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
     * @fileOverview 错误信息
     */
    define('lib/dnd',[
        'base',
        'mediator',
        'runtime/client'
    ], function( Base, Mediator, RuntimeClent ) {
    
        var $ = Base.$;
    
        function DragAndDrop( opts ) {
            opts = this.options = $.extend({}, DragAndDrop.options, opts );
    
            opts.container = $( opts.container );
    
            if ( !opts.container.length ) {
                return;
            }
    
            RuntimeClent.call( this, 'DragAndDrop' );
        }
    
        DragAndDrop.options = {
            accept: null,
            disableGlobalDnd: false
        };
    
        Base.inherits( RuntimeClent, {
            constructor: DragAndDrop,
    
            init: function() {
                var me = this;
    
                me.connectRuntime( me.options, function() {
                    me.exec('init');
                    me.trigger('ready');
                });
            },
    
            destroy: function() {
                this.disconnectRuntime();
            }
        });
    
        Mediator.installTo( DragAndDrop.prototype );
    
        return DragAndDrop;
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
     * @fileOverview DragAndDrop Widget。
     */
    define('widgets/filednd',[
        'base',
        'uploader',
        'lib/dnd',
        'widgets/widget'
    ], function( Base, Uploader, Dnd ) {
        var $ = Base.$;
    
        Uploader.options.dnd = '';
    
        /**
         * @property {Selector} [dnd=undefined]  指定Drag And Drop拖拽的容器，如果不指定，则不启动。
         * @namespace options
         * @for Uploader
         */
    
        /**
         * @event dndAccept
         * @param {DataTransferItemList} items DataTransferItem
         * @description 阻止此事件可以拒绝某些类型的文件拖入进来。目前只有 chrome 提供这样的 API，且只能通过 mime-type 验证。
         * @for  Uploader
         */
        return Uploader.register({
            init: function( opts ) {
    
                if ( !opts.dnd ||
                        this.request('predict-runtime-type') !== 'html5' ) {
                    return;
                }
    
                var me = this,
                    deferred = Base.Deferred(),
                    options = $.extend({}, {
                        disableGlobalDnd: opts.disableGlobalDnd,
                        container: opts.dnd,
                        accept: opts.accept
                    }),
                    dnd;
    
                dnd = new Dnd( options );
    
                dnd.once( 'ready', deferred.resolve );
                dnd.on( 'drop', function( files ) {
                    me.request( 'add-file', [ files ]);
                });
    
                // 检测文件是否全部允许添加。
                dnd.on( 'accept', function( items ) {
                    return me.owner.trigger( 'dndAccept', items );
                });
    
                dnd.init();
    
                return deferred.promise();
            }
        });
    });
    
    /**
     * @fileOverview 错误信息
     */
    define('lib/filepaste',[
        'base',
        'mediator',
        'runtime/client'
    ], function( Base, Mediator, RuntimeClent ) {
    
        var $ = Base.$;
    
        function FilePaste( opts ) {
            opts = this.options = $.extend({}, opts );
            opts.container = $( opts.container || document.body );
            RuntimeClent.call( this, 'FilePaste' );
        }
    
        Base.inherits( RuntimeClent, {
            constructor: FilePaste,
    
            init: function() {
                var me = this;
    
                me.connectRuntime( me.options, function() {
                    me.exec('init');
                    me.trigger('ready');
                });
            },
    
            destroy: function() {
                this.exec('destroy');
                this.disconnectRuntime();
                this.off();
            }
        });
    
        Mediator.installTo( FilePaste.prototype );
    
        return FilePaste;
    });
    /**
     * @fileOverview 组件基类。
     */
    define('widgets/filepaste',[
        'base',
        'uploader',
        'lib/filepaste',
        'widgets/widget'
    ], function( Base, Uploader, FilePaste ) {
        var $ = Base.$;
    
        /**
         * @property {Selector} [paste=undefined]  指定监听paste事件的容器，如果不指定，不启用此功能。此功能为通过粘贴来添加截屏的图片。建议设置为`document.body`.
         * @namespace options
         * @for Uploader
         */
        return Uploader.register({
            init: function( opts ) {
    
                if ( !opts.paste ||
                        this.request('predict-runtime-type') !== 'html5' ) {
                    return;
                }
    
                var me = this,
                    deferred = Base.Deferred(),
                    options = $.extend({}, {
                        container: opts.paste,
                        accept: opts.accept
                    }),
                    paste;
    
                paste = new FilePaste( options );
    
                paste.once( 'ready', deferred.resolve );
                paste.on( 'paste', function( files ) {
                    me.owner.request( 'add-file', [ files ]);
                });
                paste.init();
    
                return deferred.promise();
            }
        });
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
     * @fileOverview 各种验证，包括文件总大小是否超出、单文件是否超出和文件是否重复。
     */
    
    define('widgets/validator',[
        'base',
        'uploader',
        'file',
        'widgets/widget'
    ], function( Base, Uploader, WUFile ) {
    
        var $ = Base.$,
            validators = {},
            api;
    
        /**
         * @event error
         * @param {String} type 错误类型。
         * @description 当validate不通过时，会以派送错误事件的形式通知调用者。通过`upload.on('error', handler)`可以捕获到此类错误，目前有以下错误会在特定的情况下派送错来。
         *
         * * `Q_EXCEED_NUM_LIMIT` 在设置了`fileNumLimit`且尝试给`uploader`添加的文件数量超出这个值时派送。
         * * `Q_EXCEED_SIZE_LIMIT` 在设置了`Q_EXCEED_SIZE_LIMIT`且尝试给`uploader`添加的文件总大小超出这个值时派送。
         * @for  Uploader
         */
    
        // 暴露给外面的api
        api = {
    
            // 添加验证器
            addValidator: function( type, cb ) {
                validators[ type ] = cb;
            },
    
            // 移除验证器
            removeValidator: function( type ) {
                delete validators[ type ];
            }
        };
    
        // 在Uploader初始化的时候启动Validators的初始化
        Uploader.register({
            init: function() {
                var me = this;
                $.each( validators, function() {
                    this.call( me.owner );
                });
            }
        });
    
        /**
         * @property {int} [fileNumLimit=undefined]
         * @namespace options
         * @for Uploader
         * @description 验证文件总数量, 超出则不允许加入队列。
         */
        api.addValidator( 'fileNumLimit', function() {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = opts.fileNumLimit >> 0,
                flag = true;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
    
                if ( count >= max && flag ) {
                    flag = false;
                    this.trigger( 'error', 'Q_EXCEED_NUM_LIMIT', max, file );
                    setTimeout(function() {
                        flag = true;
                    }, 1 );
                }
    
                return count >= max ? false : true;
            });
    
            uploader.on( 'fileQueued', function() {
                count++;
            });
    
            uploader.on( 'fileDequeued', function() {
                count--;
            });
    
            uploader.on( 'uploadFinished', function() {
                count = 0;
            });
        });
    
    
        /**
         * @property {int} [fileSizeLimit=undefined]
         * @namespace options
         * @for Uploader
         * @description 验证文件总大小是否超出限制, 超出则不允许加入队列。
         */
        api.addValidator( 'fileSizeLimit', function() {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = opts.fileSizeLimit >> 0,
                flag = true;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
                var invalid = count + file.size > max;
    
                if ( invalid && flag ) {
                    flag = false;
                    this.trigger( 'error', 'Q_EXCEED_SIZE_LIMIT', max, file );
                    setTimeout(function() {
                        flag = true;
                    }, 1 );
                }
    
                return invalid ? false : true;
            });
    
            uploader.on( 'fileQueued', function( file ) {
                count += file.size;
            });
    
            uploader.on( 'fileDequeued', function( file ) {
                count -= file.size;
            });
    
            uploader.on( 'uploadFinished', function() {
                count = 0;
            });
        });
    
        /**
         * @property {int} [fileSingleSizeLimit=undefined]
         * @namespace options
         * @for Uploader
         * @description 验证单个文件大小是否超出限制, 超出则不允许加入队列。
         */
        api.addValidator( 'fileSingleSizeLimit', function() {
            var uploader = this,
                opts = uploader.options,
                max = opts.fileSingleSizeLimit;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
    
                if ( file.size > max ) {
                    file.setStatus( WUFile.Status.INVALID, 'exceed_size' );
                    this.trigger( 'error', 'F_EXCEED_SIZE', file );
                    return false;
                }
    
            });
    
        });
    
        /**
         * @property {int} [duplicate=undefined]
         * @namespace options
         * @for Uploader
         * @description 去重， 根据文件名字、文件大小和最后修改时间来生成hash Key.
         */
        api.addValidator( 'duplicate', function() {
            var uploader = this,
                opts = uploader.options,
                mapping = {};
    
            if ( opts.duplicate ) {
                return;
            }
    
            function hashString( str ) {
                var hash = 0,
                    i = 0,
                    len = str.length,
                    _char;
    
                for ( ; i < len; i++ ) {
                    _char = str.charCodeAt( i );
                    hash = _char + (hash << 6) + (hash << 16) - hash;
                }
    
                return hash;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
                var hash = file.__hash || (file.__hash = hashString( file.name +
                        file.size + file.lastModifiedDate ));
    
                // 已经重复了
                if ( mapping[ hash ] ) {
                    this.trigger( 'error', 'F_DUPLICATE', file );
                    return false;
                }
            });
    
            uploader.on( 'fileQueued', function( file ) {
                var hash = file.__hash;
    
                hash && (mapping[ hash ] = true);
            });
    
            uploader.on( 'fileDequeued', function( file ) {
                var hash = file.__hash;
    
                hash && (delete mapping[ hash ]);
            });
        });
    
        return api;
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
     * @fileOverview FilePaste
     */
    define('runtime/html5/dnd',[
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function( Base, Html5Runtime, File ) {
    
        var $ = Base.$,
            prefix = 'webuploader-dnd-';
    
        return Html5Runtime.register( 'DragAndDrop', {
            init: function() {
                var elem = this.elem = this.options.container;
    
                this.dragEnterHandler = Base.bindFn( this._dragEnterHandler, this );
                this.dragOverHandler = Base.bindFn( this._dragOverHandler, this );
                this.dragLeaveHandler = Base.bindFn( this._dragLeaveHandler, this );
                this.dropHandler = Base.bindFn( this._dropHandler, this );
                this.dndOver = false;
    
                elem.on( 'dragenter', this.dragEnterHandler );
                elem.on( 'dragover', this.dragOverHandler );
                elem.on( 'dragleave', this.dragLeaveHandler );
                elem.on( 'drop', this.dropHandler );
    
                if ( this.options.disableGlobalDnd ) {
                    $( document ).on( 'dragover', this.dragOverHandler );
                    $( document ).on( 'drop', this.dropHandler );
                }
            },
    
            _dragEnterHandler: function( e ) {
                var me = this,
                    denied = me._denied || false,
                    items;
    
                e = e.originalEvent || e;
    
                if ( !me.dndOver ) {
                    me.dndOver = true;
    
                    // 注意只有 chrome 支持。
                    items = e.dataTransfer.items;
    
                    if ( items && items.length ) {
                        me._denied = denied = !me.trigger( 'accept', items );
                    }
    
                    me.elem.addClass( prefix + 'over' );
                    me.elem[ denied ? 'addClass' :
                            'removeClass' ]( prefix + 'denied' );
                }
    
    
                e.dataTransfer.dropEffect = denied ? 'none' : 'copy';
    
                return false;
            },
    
            _dragOverHandler: function( e ) {
                // 只处理框内的。
                var parentElem = this.elem.parent().get( 0 );
                if ( parentElem && !$.contains( parentElem, e.currentTarget ) ) {
                    return false;
                }
    
                clearTimeout( this._leaveTimer );
                this._dragEnterHandler.call( this, e );
    
                return false;
            },
    
            _dragLeaveHandler: function() {
                var me = this,
                    handler;
    
                handler = function() {
                    me.dndOver = false;
                    me.elem.removeClass( prefix + 'over ' + prefix + 'denied' );
                };
    
                clearTimeout( me._leaveTimer );
                me._leaveTimer = setTimeout( handler, 100 );
                return false;
            },
    
            _dropHandler: function( e ) {
                var me = this,
                    ruid = me.getRuid(),
                    parentElem = me.elem.parent().get( 0 );
    
                // 只处理框内的。
                if ( parentElem && !$.contains( parentElem, e.currentTarget ) ) {
                    return false;
                }
    
                me._getTansferFiles( e, function( results ) {
                    me.trigger( 'drop', $.map( results, function( file ) {
                        return new File( ruid, file );
                    }) );
                });
    
                me.dndOver = false;
                me.elem.removeClass( prefix + 'over' );
                return false;
            },
    
            // 如果传入 callback 则去查看文件夹，否则只管当前文件夹。
            _getTansferFiles: function( e, callback ) {
                var results  = [],
                    promises = [],
                    items, files, dataTransfer, file, item, i, len, canAccessFolder;
    
                e = e.originalEvent || e;
    
                dataTransfer = e.dataTransfer;
                items = dataTransfer.items;
                files = dataTransfer.files;
    
                canAccessFolder = !!(items && items[ 0 ].webkitGetAsEntry);
    
                for ( i = 0, len = files.length; i < len; i++ ) {
                    file = files[ i ];
                    item = items && items[ i ];
    
                    if ( canAccessFolder && item.webkitGetAsEntry().isDirectory ) {
    
                        promises.push( this._traverseDirectoryTree(
                                item.webkitGetAsEntry(), results ) );
                    } else {
                        results.push( file );
                    }
                }
    
                Base.when.apply( Base, promises ).done(function() {
    
                    if ( !results.length ) {
                        return;
                    }
    
                    callback( results );
                });
            },
    
            _traverseDirectoryTree: function( entry, results ) {
                var deferred = Base.Deferred(),
                    me = this;
    
                if ( entry.isFile ) {
                    entry.file(function( file ) {
                        results.push( file );
                        deferred.resolve();
                    });
                } else if ( entry.isDirectory ) {
                    entry.createReader().readEntries(function( entries ) {
                        var len = entries.length,
                            promises = [],
                            arr = [],    // 为了保证顺序。
                            i;
    
                        for ( i = 0; i < len; i++ ) {
                            promises.push( me._traverseDirectoryTree(
                                    entries[ i ], arr ) );
                        }
    
                        Base.when.apply( Base, promises ).then(function() {
                            results.push.apply( results, arr );
                            deferred.resolve();
                        }, deferred.reject );
                    });
                }
    
                return deferred.promise();
            },
    
            destroy: function() {
                var elem = this.elem;
    
                elem.off( 'dragenter', this.dragEnterHandler );
                elem.off( 'dragover', this.dragEnterHandler );
                elem.off( 'dragleave', this.dragLeaveHandler );
                elem.off( 'drop', this.dropHandler );
    
                if ( this.options.disableGlobalDnd ) {
                    $( document ).off( 'dragover', this.dragOverHandler );
                    $( document ).off( 'drop', this.dropHandler );
                }
            }
        });
    });
    
    /**
     * @fileOverview FilePaste
     */
    define('runtime/html5/filepaste',[
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function( Base, Html5Runtime, File ) {
    
        return Html5Runtime.register( 'FilePaste', {
            init: function() {
                var opts = this.options,
                    elem = this.elem = opts.container,
                    accept = '.*',
                    arr, i, len, item;
    
                // accetp的mimeTypes中生成匹配正则。
                if ( opts.accept ) {
                    arr = [];
    
                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        item = opts.accept[ i ].mimeTypes;
                        item && arr.push( item );
                    }
    
                    if ( arr.length ) {
                        accept = arr.join(',');
                        accept = accept.replace( /,/g, '|' ).replace( /\*/g, '.*' );
                    }
                }
                this.accept = accept = new RegExp( accept, 'i' );
                this.hander = Base.bindFn( this._pasteHander, this );
                elem.on( 'paste', this.hander );
            },
    
            _pasteHander: function( e ) {
                var allowed = [],
                    ruid = this.getRuid(),
                    items, item, blob, i, len;
    
                e = e.originalEvent || e;
                items = e.clipboardData.items;
    
                for ( i = 0, len = items.length; i < len; i++ ) {
                    item = items[ i ];
    
                    if ( item.kind !== 'file' || !(blob = item.getAsFile()) ) {
                        continue;
                    }
    
                    allowed.push( new File( ruid, blob ) );
                }
    
                if ( allowed.length ) {
                    // 不阻止非文件粘贴（文字粘贴）的事件冒泡
                    e.preventDefault();
                    e.stopPropagation();
                    this.trigger( 'paste', allowed );
                }
            },
    
            destroy: function() {
                this.elem.off( 'paste', this.hander );
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
    /**
     * @fileOverview 只有html5实现的文件版本。
     */
    define('preset/html5only',[
        'base',
    
        // widgets
        'widgets/filednd',
        'widgets/filepaste',
        'widgets/filepicker',
        'widgets/image',
        'widgets/queue',
        'widgets/runtime',
        'widgets/upload',
        'widgets/validator',
    
        // runtimes
        // html5
        'runtime/html5/blob',
        'runtime/html5/dnd',
        'runtime/html5/filepaste',
        'runtime/html5/filepicker',
        'runtime/html5/imagemeta/exif',
        'runtime/html5/image',
        'runtime/html5/transport'
    ], function( Base ) {
        return Base;
    });
    define('webuploader',[
        'preset/html5only'
    ], function( preset ) {
        return preset;
    });
    return require('webuploader');
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvd2VidXBsb2FkZXIvd2VidXBsb2FkZXIuaHRtbDVvbmx5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISBXZWJVcGxvYWRlciAwLjEuMiAqL1xuXG5cbi8qKlxuICogQGZpbGVPdmVydmlldyDorqnlhoXpg6jlkITkuKrpg6jku7bnmoTku6PnoIHlj6/ku6XnlKhbYW1kXShodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EKeaooeWdl+WumuS5ieaWueW8j+e7hOe7h+i1t+adpeOAglxuICpcbiAqIEFNRCBBUEkg5YaF6YOo55qE566A5Y2V5LiN5a6M5YWo5a6e546w77yM6K+35b+955Wl44CC5Y+q5pyJ5b2TV2ViVXBsb2FkZXLooqvlkIjlubbmiJDkuIDkuKrmlofku7bnmoTml7blgJnmiY3kvJrlvJXlhaXjgIJcbiAqL1xuKGZ1bmN0aW9uKCByb290LCBmYWN0b3J5ICkge1xuICAgIHZhciBtb2R1bGVzID0ge30sXG5cbiAgICAgICAgLy8g5YaF6YOocmVxdWlyZSwg566A5Y2V5LiN5a6M5YWo5a6e546w44CCXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbWRqcy9hbWRqcy1hcGkvd2lraS9yZXF1aXJlXG4gICAgICAgIF9yZXF1aXJlID0gZnVuY3Rpb24oIGRlcHMsIGNhbGxiYWNrICkge1xuICAgICAgICAgICAgdmFyIGFyZ3MsIGxlbiwgaTtcblxuICAgICAgICAgICAgLy8g5aaC5p6cZGVwc+S4jeaYr+aVsOe7hO+8jOWImeebtOaOpei/lOWbnuaMh+Wumm1vZHVsZVxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgZGVwcyA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldE1vZHVsZSggZGVwcyApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yKCBsZW4gPSBkZXBzLmxlbmd0aCwgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKCBnZXRNb2R1bGUoIGRlcHNbIGkgXSApICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KCBudWxsLCBhcmdzICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5YaF6YOoZGVmaW5l77yM5pqC5pe25LiN5pSv5oyB5LiN5oyH5a6aaWQuXG4gICAgICAgIF9kZWZpbmUgPSBmdW5jdGlvbiggaWQsIGRlcHMsIGZhY3RvcnkgKSB7XG4gICAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDIgKSB7XG4gICAgICAgICAgICAgICAgZmFjdG9yeSA9IGRlcHM7XG4gICAgICAgICAgICAgICAgZGVwcyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9yZXF1aXJlKCBkZXBzIHx8IFtdLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRNb2R1bGUoIGlkLCBmYWN0b3J5LCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOiuvue9rm1vZHVsZSwg5YW85a65Q29tbW9uSnPlhpnms5XjgIJcbiAgICAgICAgc2V0TW9kdWxlID0gZnVuY3Rpb24oIGlkLCBmYWN0b3J5LCBhcmdzICkge1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0czogZmFjdG9yeVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmV0dXJuZWQ7XG5cbiAgICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggfHwgKGFyZ3MgPSBbIF9yZXF1aXJlLCBtb2R1bGUuZXhwb3J0cywgbW9kdWxlIF0pO1xuICAgICAgICAgICAgICAgIHJldHVybmVkID0gZmFjdG9yeS5hcHBseSggbnVsbCwgYXJncyApO1xuICAgICAgICAgICAgICAgIHJldHVybmVkICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gcmV0dXJuZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtb2R1bGVzWyBpZCBdID0gbW9kdWxlLmV4cG9ydHM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5qC55o2uaWTojrflj5Ztb2R1bGVcbiAgICAgICAgZ2V0TW9kdWxlID0gZnVuY3Rpb24oIGlkICkge1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZXNbIGlkIF0gfHwgcm9vdFsgaWQgXTtcblxuICAgICAgICAgICAgaWYgKCAhbW9kdWxlICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ2AnICsgaWQgKyAnYCBpcyB1bmRlZmluZWQnICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtb2R1bGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5bCG5omA5pyJbW9kdWxlc++8jOWwhui3r+W+hGlkc+ijheaNouaIkOWvueixoeOAglxuICAgICAgICBleHBvcnRzVG8gPSBmdW5jdGlvbiggb2JqICkge1xuICAgICAgICAgICAgdmFyIGtleSwgaG9zdCwgcGFydHMsIHBhcnQsIGxhc3QsIHVjRmlyc3Q7XG5cbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIGZpcnN0IGNoYXJhY3RlciB1cHBlciBjYXNlLlxuICAgICAgICAgICAgdWNGaXJzdCA9IGZ1bmN0aW9uKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ciAmJiAoc3RyLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyKCAxICkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yICgga2V5IGluIG1vZHVsZXMgKSB7XG4gICAgICAgICAgICAgICAgaG9zdCA9IG9iajtcblxuICAgICAgICAgICAgICAgIGlmICggIW1vZHVsZXMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwYXJ0cyA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIGxhc3QgPSB1Y0ZpcnN0KCBwYXJ0cy5wb3AoKSApO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUoIChwYXJ0ID0gdWNGaXJzdCggcGFydHMuc2hpZnQoKSApKSApIHtcbiAgICAgICAgICAgICAgICAgICAgaG9zdFsgcGFydCBdID0gaG9zdFsgcGFydCBdIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICBob3N0ID0gaG9zdFsgcGFydCBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGhvc3RbIGxhc3QgXSA9IG1vZHVsZXNbIGtleSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV4cG9ydHMgPSBmYWN0b3J5KCByb290LCBfZGVmaW5lLCBfcmVxdWlyZSApLFxuICAgICAgICBvcmlnaW47XG5cbiAgICAvLyBleHBvcnRzIGV2ZXJ5IG1vZHVsZS5cbiAgICBleHBvcnRzVG8oIGV4cG9ydHMgKTtcblxuICAgIGlmICggdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyApIHtcblxuICAgICAgICAvLyBGb3IgQ29tbW9uSlMgYW5kIENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHdoZXJlIGEgcHJvcGVyIHdpbmRvdyBpcyBwcmVzZW50LFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHM7XG4gICAgfSBlbHNlIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuXG4gICAgICAgIC8vIEFsbG93IHVzaW5nIHRoaXMgYnVpbHQgbGlicmFyeSBhcyBhbiBBTUQgbW9kdWxlXG4gICAgICAgIC8vIGluIGFub3RoZXIgcHJvamVjdC4gVGhhdCBvdGhlciBwcm9qZWN0IHdpbGwgb25seVxuICAgICAgICAvLyBzZWUgdGhpcyBBTUQgY2FsbCwgbm90IHRoZSBpbnRlcm5hbCBtb2R1bGVzIGluXG4gICAgICAgIC8vIHRoZSBjbG9zdXJlIGJlbG93LlxuICAgICAgICBkZWZpbmUoW10sIGV4cG9ydHMgKTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFscyBjYXNlLiBKdXN0IGFzc2lnbiB0aGVcbiAgICAgICAgLy8gcmVzdWx0IHRvIGEgcHJvcGVydHkgb24gdGhlIGdsb2JhbC5cbiAgICAgICAgb3JpZ2luID0gcm9vdC5XZWJVcGxvYWRlcjtcbiAgICAgICAgcm9vdC5XZWJVcGxvYWRlciA9IGV4cG9ydHM7XG4gICAgICAgIHJvb3QuV2ViVXBsb2FkZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcm9vdC5XZWJVcGxvYWRlciA9IG9yaWdpbjtcbiAgICAgICAgfTtcbiAgICB9XG59KSggdGhpcywgZnVuY3Rpb24oIHdpbmRvdywgZGVmaW5lLCByZXF1aXJlICkge1xuXG5cbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IGpRdWVyeSBvciBaZXB0b1xuICAgICAqL1xuICAgIGRlZmluZSgnZG9sbGFyLXRoaXJkJyxbXSxmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRG9tIOaTjeS9nOebuOWFs1xuICAgICAqL1xuICAgIGRlZmluZSgnZG9sbGFyJyxbXG4gICAgICAgICdkb2xsYXItdGhpcmQnXG4gICAgXSwgZnVuY3Rpb24oIF8gKSB7XG4gICAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5L2/55SoalF1ZXJ555qEUHJvbWlzZVxuICAgICAqL1xuICAgIGRlZmluZSgncHJvbWlzZS10aGlyZCcsW1xuICAgICAgICAnZG9sbGFyJ1xuICAgIF0sIGZ1bmN0aW9uKCAkICkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgRGVmZXJyZWQ6ICQuRGVmZXJyZWQsXG4gICAgICAgICAgICB3aGVuOiAkLndoZW4sXG4gICAgXG4gICAgICAgICAgICBpc1Byb21pc2U6IGZ1bmN0aW9uKCBhbnl0aGluZyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW55dGhpbmcgJiYgdHlwZW9mIGFueXRoaW5nLnRoZW4gPT09ICdmdW5jdGlvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBQcm9taXNlL0ErXG4gICAgICovXG4gICAgZGVmaW5lKCdwcm9taXNlJyxbXG4gICAgICAgICdwcm9taXNlLXRoaXJkJ1xuICAgIF0sIGZ1bmN0aW9uKCBfICkge1xuICAgICAgICByZXR1cm4gXztcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOWfuuehgOexu+aWueazleOAglxuICAgICAqL1xuICAgIFxuICAgIC8qKlxuICAgICAqIFdlYiBVcGxvYWRlcuWGhemDqOexu+eahOivpue7huivtOaYju+8jOS7peS4i+aPkOWPiueahOWKn+iDveexu++8jOmDveWPr+S7peWcqGBXZWJVcGxvYWRlcmDov5nkuKrlj5jph4/kuK3orr/pl67liLDjgIJcbiAgICAgKlxuICAgICAqIEFzIHlvdSBrbm93LCBXZWIgVXBsb2FkZXLnmoTmr4/kuKrmlofku7bpg73mmK/nlKjov4dbQU1EXShodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EKeinhOiMg+S4reeahGBkZWZpbmVg57uE57uH6LW35p2l55qELCDmr4/kuKpNb2R1bGXpg73kvJrmnInkuKptb2R1bGUgaWQuXG4gICAgICog6buY6K6kbW9kdWxlIGlk6K+l5paH5Lu255qE6Lev5b6E77yM6ICM5q2k6Lev5b6E5bCG5Lya6L2s5YyW5oiQ5ZCN5a2X56m66Ze05a2Y5pS+5ZyoV2ViVXBsb2FkZXLkuK3jgILlpoLvvJpcbiAgICAgKlxuICAgICAqICogbW9kdWxlIGBiYXNlYO+8mldlYlVwbG9hZGVyLkJhc2VcbiAgICAgKiAqIG1vZHVsZSBgZmlsZWA6IFdlYlVwbG9hZGVyLkZpbGVcbiAgICAgKiAqIG1vZHVsZSBgbGliL2RuZGA6IFdlYlVwbG9hZGVyLkxpYi5EbmRcbiAgICAgKiAqIG1vZHVsZSBgcnVudGltZS9odG1sNS9kbmRgOiBXZWJVcGxvYWRlci5SdW50aW1lLkh0bWw1LkRuZFxuICAgICAqXG4gICAgICpcbiAgICAgKiDku6XkuIvmlofmoaPlsIblj6/og73nnIHnlaVgV2ViVXBsb2FkZXJg5YmN57yA44CCXG4gICAgICogQG1vZHVsZSBXZWJVcGxvYWRlclxuICAgICAqIEB0aXRsZSBXZWJVcGxvYWRlciBBUEnmlofmoaNcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2Jhc2UnLFtcbiAgICAgICAgJ2RvbGxhcicsXG4gICAgICAgICdwcm9taXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCAkLCBwcm9taXNlICkge1xuICAgIFxuICAgICAgICB2YXIgbm9vcCA9IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbiAgICBcbiAgICAgICAgLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcbiAgICAgICAgLy8g5Y+N56eR6YeM5YyWXG4gICAgICAgIGZ1bmN0aW9uIHVuY3VycnlUaGlzKCBmbiApIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbC5hcHBseSggZm4sIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBmdW5jdGlvbiBiaW5kRm4oIGZuLCBjb250ZXh0ICkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSggY29udGV4dCwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdCggcHJvdG8gKSB7XG4gICAgICAgICAgICB2YXIgZjtcbiAgICBcbiAgICAgICAgICAgIGlmICggT2JqZWN0LmNyZWF0ZSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZiA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgICAgICAgZi5wcm90b3R5cGUgPSBwcm90bztcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIFxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Z+656GA57G777yM5o+Q5L6b5LiA5Lqb566A5Y2V5bi455So55qE5pa55rOV44CCXG4gICAgICAgICAqIEBjbGFzcyBCYXNlXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4ge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge1N0cmluZ30gdmVyc2lvbiDlvZPliY3niYjmnKzlj7fjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdmVyc2lvbjogJzAuMS4yJyxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtqUXVlcnl8WmVwdG99ICQg5byV55So5L6d6LWW55qEalF1ZXJ55oiW6ICFWmVwdG/lr7nosaHjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJDogJCxcbiAgICBcbiAgICAgICAgICAgIERlZmVycmVkOiBwcm9taXNlLkRlZmVycmVkLFxuICAgIFxuICAgICAgICAgICAgaXNQcm9taXNlOiBwcm9taXNlLmlzUHJvbWlzZSxcbiAgICBcbiAgICAgICAgICAgIHdoZW46IHByb21pc2Uud2hlbixcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uICDnroDljZXnmoTmtY/op4jlmajmo4Dmn6Xnu5PmnpzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGB3ZWJraXRgICB3ZWJraXTniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ53ZWJraXTlhoXmoLjvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgY2hyb21lYCAgY2hyb21l5rWP6KeI5Zmo54mI5pys5Y+377yM5aaC5p6c5rWP6KeI5Zmo5Li6Y2hyb21l77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIJcbiAgICAgICAgICAgICAqICogYGllYCAgaWXmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ5pZe+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCKirmmoLkuI3mlK/mjIFpZTEwKyoqXG4gICAgICAgICAgICAgKiAqIGBmaXJlZm94YCAgZmlyZWZveOa1j+iniOWZqOeJiOacrOWPt++8jOWmguaenOa1j+iniOWZqOS4uumdnmZpcmVmb3jvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgc2FmYXJpYCAgc2FmYXJp5rWP6KeI5Zmo54mI5pys5Y+377yM5aaC5p6c5rWP6KeI5Zmo5Li66Z2ec2FmYXJp77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIJcbiAgICAgICAgICAgICAqICogYG9wZXJhYCAgb3BlcmHmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ5vcGVyYe+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFticm93c2VyXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBicm93c2VyOiAoZnVuY3Rpb24oIHVhICkge1xuICAgICAgICAgICAgICAgIHZhciByZXQgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgd2Via2l0ID0gdWEubWF0Y2goIC9XZWJLaXRcXC8oW1xcZC5dKykvICksXG4gICAgICAgICAgICAgICAgICAgIGNocm9tZSA9IHVhLm1hdGNoKCAvQ2hyb21lXFwvKFtcXGQuXSspLyApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB1YS5tYXRjaCggL0NyaU9TXFwvKFtcXGQuXSspLyApLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZSA9IHVhLm1hdGNoKCAvTVNJRVxccyhbXFxkXFwuXSspLyApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB1YS5tYXRjaCgvKD86dHJpZGVudCkoPzouKnJ2OihbXFx3Ll0rKSk/L2kpLFxuICAgICAgICAgICAgICAgICAgICBmaXJlZm94ID0gdWEubWF0Y2goIC9GaXJlZm94XFwvKFtcXGQuXSspLyApLFxuICAgICAgICAgICAgICAgICAgICBzYWZhcmkgPSB1YS5tYXRjaCggL1NhZmFyaVxcLyhbXFxkLl0rKS8gKSxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmEgPSB1YS5tYXRjaCggL09QUlxcLyhbXFxkLl0rKS8gKTtcbiAgICBcbiAgICAgICAgICAgICAgICB3ZWJraXQgJiYgKHJldC53ZWJraXQgPSBwYXJzZUZsb2F0KCB3ZWJraXRbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBjaHJvbWUgJiYgKHJldC5jaHJvbWUgPSBwYXJzZUZsb2F0KCBjaHJvbWVbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBpZSAmJiAocmV0LmllID0gcGFyc2VGbG9hdCggaWVbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBmaXJlZm94ICYmIChyZXQuZmlyZWZveCA9IHBhcnNlRmxvYXQoIGZpcmVmb3hbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBzYWZhcmkgJiYgKHJldC5zYWZhcmkgPSBwYXJzZUZsb2F0KCBzYWZhcmlbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBvcGVyYSAmJiAocmV0Lm9wZXJhID0gcGFyc2VGbG9hdCggb3BlcmFbIDEgXSApKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfSkoIG5hdmlnYXRvci51c2VyQWdlbnQgKSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uICDmk43kvZzns7vnu5/mo4Dmn6Xnu5PmnpzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGBhbmRyb2lkYCAg5aaC5p6c5ZyoYW5kcm9pZOa1j+iniOWZqOeOr+Wig+S4i++8jOatpOWAvOS4uuWvueW6lOeahGFuZHJvaWTniYjmnKzlj7fvvIzlkKbliJnkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgaW9zYCDlpoLmnpzlnKhpb3PmtY/op4jlmajnjq/looPkuIvvvIzmraTlgLzkuLrlr7nlupTnmoRpb3PniYjmnKzlj7fvvIzlkKbliJnkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtvc11cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb3M6IChmdW5jdGlvbiggdWEgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBvc3ggPSAhIXVhLm1hdGNoKCAvXFwoTWFjaW50b3NoXFw7IEludGVsIC8gKSxcbiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZCA9IHVhLm1hdGNoKCAvKD86QW5kcm9pZCk7P1tcXHNcXC9dKyhbXFxkLl0rKT8vICksXG4gICAgICAgICAgICAgICAgICAgIGlvcyA9IHVhLm1hdGNoKCAvKD86aVBhZHxpUG9kfGlQaG9uZSkuKk9TXFxzKFtcXGRfXSspLyApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIG9zeCAmJiAocmV0Lm9zeCA9IHRydWUpO1xuICAgICAgICAgICAgICAgIGFuZHJvaWQgJiYgKHJldC5hbmRyb2lkID0gcGFyc2VGbG9hdCggYW5kcm9pZFsgMSBdICkpO1xuICAgICAgICAgICAgICAgIGlvcyAmJiAocmV0LmlvcyA9IHBhcnNlRmxvYXQoIGlvc1sgMSBdLnJlcGxhY2UoIC9fL2csICcuJyApICkpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9KSggbmF2aWdhdG9yLnVzZXJBZ2VudCApLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlrp7njrDnsbvkuI7nsbvkuYvpl7TnmoTnu6fmib/jgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgaW5oZXJpdHNcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuaW5oZXJpdHMoIHN1cGVyICkgPT4gY2hpbGRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuaW5oZXJpdHMoIHN1cGVyLCBwcm90b3MgKSA9PiBjaGlsZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5pbmhlcml0cyggc3VwZXIsIHByb3Rvcywgc3RhdGljcyApID0+IGNoaWxkXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtDbGFzc30gc3VwZXIg54i257G7XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3QgfCBGdW5jdGlvbn0gW3Byb3Rvc10g5a2Q57G75oiW6ICF5a+56LGh44CC5aaC5p6c5a+56LGh5Lit5YyF5ZCrY29uc3RydWN0b3LvvIzlrZDnsbvlsIbmmK/nlKjmraTlsZ7mgKflgLzjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbcHJvdG9zLmNvbnN0cnVjdG9yXSDlrZDnsbvmnoTpgKDlmajvvIzkuI3mjIflrprnmoTor53lsIbliJvlu7rkuKrkuLTml7bnmoTnm7TmjqXmiafooYzniLbnsbvmnoTpgKDlmajnmoTmlrnms5XjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gW3N0YXRpY3NdIOmdmeaAgeWxnuaAp+aIluaWueazleOAglxuICAgICAgICAgICAgICogQHJldHVybiB7Q2xhc3N9IOi/lOWbnuWtkOexu+OAglxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIFBlcnNvbigpIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggJ1N1cGVyJyApO1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICogUGVyc29uLnByb3RvdHlwZS5oZWxsbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCAnaGVsbG8nICk7XG4gICAgICAgICAgICAgKiB9O1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIHZhciBNYW5hZ2VyID0gQmFzZS5pbmhlcml0cyggUGVyc29uLCB7XG4gICAgICAgICAgICAgKiAgICAgd29ybGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgICAgICBjb25zb2xlLmxvZyggJ1dvcmxkJyApO1xuICAgICAgICAgICAgICogICAgIH1cbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWboOS4uuayoeacieaMh+WumuaehOmAoOWZqO+8jOeItuexu+eahOaehOmAoOWZqOWwhuS8muaJp+ihjOOAglxuICAgICAgICAgICAgICogdmFyIGluc3RhbmNlID0gbmV3IE1hbmFnZXIoKTsgICAgLy8gPT4gU3VwZXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyDnu6fmib/lrZDniLbnsbvnmoTmlrnms5VcbiAgICAgICAgICAgICAqIGluc3RhbmNlLmhlbGxvKCk7ICAgIC8vID0+IGhlbGxvXG4gICAgICAgICAgICAgKiBpbnN0YW5jZS53b3JsZCgpOyAgICAvLyA9PiBXb3JsZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWtkOexu+eahF9fc3VwZXJfX+WxnuaAp+aMh+WQkeeItuexu1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIE1hbmFnZXIuX19zdXBlcl9fID09PSBQZXJzb24gKTsgICAgLy8gPT4gdHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbmhlcml0czogZnVuY3Rpb24oIFN1cGVyLCBwcm90b3MsIHN0YXRpY1Byb3RvcyApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgcHJvdG9zID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IHByb3RvcztcbiAgICAgICAgICAgICAgICAgICAgcHJvdG9zID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBwcm90b3MgJiYgcHJvdG9zLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpICkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IHByb3Rvcy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN1cGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aSN5Yi26Z2Z5oCB5pa55rOVXG4gICAgICAgICAgICAgICAgJC5leHRlbmQoIHRydWUsIGNoaWxkLCBTdXBlciwgc3RhdGljUHJvdG9zIHx8IHt9ICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLyoganNoaW50IGNhbWVsY2FzZTogZmFsc2UgKi9cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDorqnlrZDnsbvnmoRfX3N1cGVyX1/lsZ7mgKfmjIflkJHniLbnsbvjgIJcbiAgICAgICAgICAgICAgICBjaGlsZC5fX3N1cGVyX18gPSBTdXBlci5wcm90b3R5cGU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5p6E5bu65Y6f5Z6L77yM5re75Yqg5Y6f5Z6L5pa55rOV5oiW5bGe5oCn44CCXG4gICAgICAgICAgICAgICAgLy8g5pqC5pe255SoT2JqZWN0LmNyZWF0ZeWunueOsOOAglxuICAgICAgICAgICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IGNyZWF0ZU9iamVjdCggU3VwZXIucHJvdG90eXBlICk7XG4gICAgICAgICAgICAgICAgcHJvdG9zICYmICQuZXh0ZW5kKCB0cnVlLCBjaGlsZC5wcm90b3R5cGUsIHByb3RvcyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOS4gOS4quS4jeWBmuS7u+S9leS6i+aDheeahOaWueazleOAguWPr+S7peeUqOadpei1i+WAvOe7mem7mOiupOeahGNhbGxiYWNrLlxuICAgICAgICAgICAgICogQG1ldGhvZCBub29wXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5vb3A6IG5vb3AsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOi/lOWbnuS4gOS4quaWsOeahOaWueazle+8jOatpOaWueazleWwhuW3suaMh+WumueahGBjb250ZXh0YOadpeaJp+ihjOOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5iaW5kRm4oIGZuLCBjb250ZXh0ICkgPT4gRnVuY3Rpb25cbiAgICAgICAgICAgICAqIEBtZXRob2QgYmluZEZuXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdmFyIGRvU29tZXRoaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCB0aGlzLm5hbWUgKTtcbiAgICAgICAgICAgICAqICAgICB9LFxuICAgICAgICAgICAgICogICAgIG9iaiA9IHtcbiAgICAgICAgICAgICAqICAgICAgICAgbmFtZTogJ09iamVjdCBOYW1lJ1xuICAgICAgICAgICAgICogICAgIH0sXG4gICAgICAgICAgICAgKiAgICAgYWxpYXNGbiA9IEJhc2UuYmluZCggZG9Tb21ldGhpbmcsIG9iaiApO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICBhbGlhc0ZuKCk7ICAgIC8vID0+IE9iamVjdCBOYW1lXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBiaW5kRm46IGJpbmRGbixcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5byV55SoQ29uc29sZS5sb2flpoLmnpzlrZjlnKjnmoTor53vvIzlkKbliJnlvJXnlKjkuIDkuKpb56m65Ye95pWwbG9vcF0oI1dlYlVwbG9hZGVyOkJhc2UubG9nKeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5sb2coIGFyZ3MuLi4gKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2QgbG9nXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZzogKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggd2luZG93LmNvbnNvbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiaW5kRm4oIGNvbnNvbGUubG9nLCBjb25zb2xlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub29wO1xuICAgICAgICAgICAgfSkoKSxcbiAgICBcbiAgICAgICAgICAgIG5leHRUaWNrOiAoZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBjYiApIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggY2IsIDEgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIEBidWcg5b2T5rWP6KeI5Zmo5LiN5Zyo5b2T5YmN56qX5Y+j5pe25bCx5YGc5LqG44CCXG4gICAgICAgICAgICAgICAgLy8gdmFyIG5leHQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgLy8gICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAvLyAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgIC8vICAgICBmdW5jdGlvbiggY2IgKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB3aW5kb3cuc2V0VGltZW91dCggY2IsIDEwMDAgLyA2MCApO1xuICAgICAgICAgICAgICAgIC8vICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIC8vIGZpeDogVW5jYXVnaHQgVHlwZUVycm9yOiBJbGxlZ2FsIGludm9jYXRpb25cbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gYmluZEZuKCBuZXh0LCB3aW5kb3cgKTtcbiAgICAgICAgICAgIH0pKCksXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiiq1t1bmN1cnJ5dGhpc10oaHR0cDovL3d3dy4yYWxpdHkuY29tLzIwMTEvMTEvdW5jdXJyeWluZy10aGlzLmh0bWwp55qE5pWw57uEc2xpY2Xmlrnms5XjgIJcbiAgICAgICAgICAgICAqIOWwhueUqOadpeWwhumdnuaVsOe7hOWvueixoei9rOWMluaIkOaVsOe7hOWvueixoeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5zbGljZSggdGFyZ2V0LCBzdGFydFssIGVuZF0gKSA9PiBBcnJheVxuICAgICAgICAgICAgICogQG1ldGhvZCBzbGljZVxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIGRvU29tdGhpbmcoKSB7XG4gICAgICAgICAgICAgKiAgICAgdmFyIGFyZ3MgPSBCYXNlLnNsaWNlKCBhcmd1bWVudHMsIDEgKTtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggYXJncyApO1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGRvU29tdGhpbmcoICdpZ25vcmVkJywgJ2FyZzInLCAnYXJnMycgKTsgICAgLy8gPT4gQXJyYXkgW1wiYXJnMlwiLCBcImFyZzNcIl1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2xpY2U6IHVuY3VycnlUaGlzKCBbXS5zbGljZSApLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnlJ/miJDllK/kuIDnmoRJRFxuICAgICAgICAgICAgICogQG1ldGhvZCBndWlkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmd1aWQoKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZ3VpZCggcHJlZnggKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ3VpZDogKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb3VudGVyID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHByZWZpeCApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGd1aWQgPSAoK25ldyBEYXRlKCkpLnRvU3RyaW5nKCAzMiApLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IDU7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGd1aWQgKz0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIDY1NTM1ICkudG9TdHJpbmcoIDMyICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChwcmVmaXggfHwgJ3d1XycpICsgZ3VpZCArIChjb3VudGVyKyspLnRvU3RyaW5nKCAzMiApO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmoLzlvI/ljJbmlofku7blpKflsI8sIOi+k+WHuuaIkOW4puWNleS9jeeahOWtl+espuS4slxuICAgICAgICAgICAgICogQG1ldGhvZCBmb3JtYXRTaXplXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmZvcm1hdFNpemUoIHNpemUgKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZm9ybWF0U2l6ZSggc2l6ZSwgcG9pbnRMZW5ndGggKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZm9ybWF0U2l6ZSggc2l6ZSwgcG9pbnRMZW5ndGgsIHVuaXRzICkgPT4gU3RyaW5nXG4gICAgICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gc2l6ZSDmlofku7blpKflsI9cbiAgICAgICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcG9pbnRMZW5ndGg9Ml0g57K+56Gu5Yiw55qE5bCP5pWw54K55pWw44CCXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBbdW5pdHM9WyAnQicsICdLJywgJ00nLCAnRycsICdUQicgXV0g5Y2V5L2N5pWw57uE44CC5LuO5a2X6IqC77yM5Yiw5Y2D5a2X6IqC77yM5LiA55u05b6A5LiK5oyH5a6a44CC5aaC5p6c5Y2V5L2N5pWw57uE6YeM6Z2i5Y+q5oyH5a6a5LqG5Yiw5LqGSyjljYPlrZfoioIp77yM5ZCM5pe25paH5Lu25aSn5bCP5aSn5LqOTSwg5q2k5pa55rOV55qE6L6T5Ye65bCG6L+Y5piv5pi+56S65oiQ5aSa5bCRSy5cbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDAgKSApOyAgICAvLyA9PiAxMDBCXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDI0ICkgKTsgICAgLy8gPT4gMS4wMEtcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMjQsIDAgKSApOyAgICAvLyA9PiAxS1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCAqIDEwMjQgKSApOyAgICAvLyA9PiAxLjAwTVxuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCAqIDEwMjQgKiAxMDI0ICkgKTsgICAgLy8gPT4gMS4wMEdcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMjQgKiAxMDI0ICogMTAyNCwgMCwgWydCJywgJ0tCJywgJ01CJ10gKSApOyAgICAvLyA9PiAxMDI0TUJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZm9ybWF0U2l6ZTogZnVuY3Rpb24oIHNpemUsIHBvaW50TGVuZ3RoLCB1bml0cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgdW5pdDtcbiAgICBcbiAgICAgICAgICAgICAgICB1bml0cyA9IHVuaXRzIHx8IFsgJ0InLCAnSycsICdNJywgJ0cnLCAnVEInIF07XG4gICAgXG4gICAgICAgICAgICAgICAgd2hpbGUgKCAodW5pdCA9IHVuaXRzLnNoaWZ0KCkpICYmIHNpemUgPiAxMDI0ICkge1xuICAgICAgICAgICAgICAgICAgICBzaXplID0gc2l6ZSAvIDEwMjQ7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiAodW5pdCA9PT0gJ0InID8gc2l6ZSA6IHNpemUudG9GaXhlZCggcG9pbnRMZW5ndGggfHwgMiApKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIOS6i+S7tuWkhOeQhuexu++8jOWPr+S7peeLrOeri+S9v+eUqO+8jOS5n+WPr+S7peaJqeWxlee7meWvueixoeS9v+eUqOOAglxuICAgICAqIEBmaWxlT3ZlcnZpZXcgTWVkaWF0b3JcbiAgICAgKi9cbiAgICBkZWZpbmUoJ21lZGlhdG9yJyxbXG4gICAgICAgICdiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHNsaWNlID0gW10uc2xpY2UsXG4gICAgICAgICAgICBzZXBhcmF0b3IgPSAvXFxzKy8sXG4gICAgICAgICAgICBwcm90b3M7XG4gICAgXG4gICAgICAgIC8vIOagueaNruadoeS7tui/h+a7pOWHuuS6i+S7tmhhbmRsZXJzLlxuICAgICAgICBmdW5jdGlvbiBmaW5kSGFuZGxlcnMoIGFyciwgbmFtZSwgY2FsbGJhY2ssIGNvbnRleHQgKSB7XG4gICAgICAgICAgICByZXR1cm4gJC5ncmVwKCBhcnIsIGZ1bmN0aW9uKCBoYW5kbGVyICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoIW5hbWUgfHwgaGFuZGxlci5lID09PSBuYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCFjYWxsYmFjayB8fCBoYW5kbGVyLmNiID09PSBjYWxsYmFjayB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jYi5fY2IgPT09IGNhbGxiYWNrKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCFjb250ZXh0IHx8IGhhbmRsZXIuY3R4ID09PSBjb250ZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGVhY2hFdmVudCggZXZlbnRzLCBjYWxsYmFjaywgaXRlcmF0b3IgKSB7XG4gICAgICAgICAgICAvLyDkuI3mlK/mjIHlr7nosaHvvIzlj6rmlK/mjIHlpJrkuKpldmVudOeUqOepuuagvOmalOW8gFxuICAgICAgICAgICAgJC5lYWNoKCAoZXZlbnRzIHx8ICcnKS5zcGxpdCggc2VwYXJhdG9yICksIGZ1bmN0aW9uKCBfLCBrZXkgKSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoIGtleSwgY2FsbGJhY2sgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIHRyaWdnZXJIYW5kZXJzKCBldmVudHMsIGFyZ3MgKSB7XG4gICAgICAgICAgICB2YXIgc3RvcGVkID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgaSA9IC0xLFxuICAgICAgICAgICAgICAgIGxlbiA9IGV2ZW50cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgaGFuZGxlcjtcbiAgICBcbiAgICAgICAgICAgIHdoaWxlICggKytpIDwgbGVuICkge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBldmVudHNbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGhhbmRsZXIuY2IuYXBwbHkoIGhhbmRsZXIuY3R4MiwgYXJncyApID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgcmV0dXJuICFzdG9wZWQ7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcHJvdG9zID0ge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnu5Hlrprkuovku7bjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgY2FsbGJhY2tg5pa55rOV5Zyo5omn6KGM5pe277yMYXJndW1lbnRz5bCG5Lya5p2l5rqQ5LqOdHJpZ2dlcueahOaXtuWAmeaQuuW4pueahOWPguaVsOOAguWmglxuICAgICAgICAgICAgICogYGBgamF2YXNjcmlwdFxuICAgICAgICAgICAgICogdmFyIG9iaiA9IHt9O1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOS9v+W+l29iauacieS6i+S7tuihjOS4ulxuICAgICAgICAgICAgICogTWVkaWF0b3IuaW5zdGFsbFRvKCBvYmogKTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBvYmoub24oICd0ZXN0YScsIGZ1bmN0aW9uKCBhcmcxLCBhcmcyICkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCBhcmcxLCBhcmcyICk7IC8vID0+ICdhcmcxJywgJ2FyZzInXG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBvYmoudHJpZ2dlciggJ3Rlc3RhJywgJ2FyZzEnLCAnYXJnMicgKTtcbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIOWmguaenGBjYWxsYmFja2DkuK3vvIzmn5DkuIDkuKrmlrnms5VgcmV0dXJuIGZhbHNlYOS6hu+8jOWImeWQjue7reeahOWFtuS7lmBjYWxsYmFja2Dpg73kuI3kvJrooqvmiafooYzliLDjgIJcbiAgICAgICAgICAgICAqIOWIh+S8muW9seWTjeWIsGB0cmlnZ2VyYOaWueazleeahOi/lOWbnuWAvO+8jOS4umBmYWxzZWDjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgb25g6L+Y5Y+v5Lul55So5p2l5re75Yqg5LiA5Liq54m55q6K5LqL5Lu2YGFsbGAsIOi/meagt+aJgOacieeahOS6i+S7tuinpuWPkemDveS8muWTjeW6lOWIsOOAguWQjOaXtuatpOexu2BjYWxsYmFja2DkuK3nmoRhcmd1bWVudHPmnInkuIDkuKrkuI3lkIzlpITvvIxcbiAgICAgICAgICAgICAqIOWwseaYr+esrOS4gOS4quWPguaVsOS4umB0eXBlYO+8jOiusOW9leW9k+WJjeaYr+S7gOS5iOS6i+S7tuWcqOinpuWPkeOAguatpOexu2BjYWxsYmFja2DnmoTkvJjlhYjnuqfmr5TohJrkvY7vvIzkvJrlho3mraPluLhgY2FsbGJhY2tg5omn6KGM5a6M5ZCO6Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBgYGBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgKiBvYmoub24oICdhbGwnLCBmdW5jdGlvbiggdHlwZSwgYXJnMSwgYXJnMiApIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggdHlwZSwgYXJnMSwgYXJnMiApOyAvLyA9PiAndGVzdGEnLCAnYXJnMScsICdhcmcyJ1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKiBgYGBcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIG9uXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvbiggbmFtZSwgY2FsbGJhY2tbLCBjb250ZXh0XSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBuYW1lICAgICDkuovku7blkI3vvIzmlK/mjIHlpJrkuKrkuovku7bnlKjnqbrmoLzpmpTlvIBcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayDkuovku7blpITnkIblmahcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gICBbY29udGV4dF0gIOS6i+S7tuWkhOeQhuWZqOeahOS4iuS4i+aWh+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7c2VsZn0g6L+U5Zue6Ieq6Lqr77yM5pa55L6/6ZO+5byPXG4gICAgICAgICAgICAgKiBAY2hhaW5hYmxlXG4gICAgICAgICAgICAgKiBAY2xhc3MgTWVkaWF0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb246IGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBzZXQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBzZXQgPSB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IFtdKTtcbiAgICBcbiAgICAgICAgICAgICAgICBlYWNoRXZlbnQoIG5hbWUsIGNhbGxiYWNrLCBmdW5jdGlvbiggbmFtZSwgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0geyBlOiBuYW1lIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jdHggPSBjb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmN0eDIgPSBjb250ZXh0IHx8IG1lO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmlkID0gc2V0Lmxlbmd0aDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgc2V0LnB1c2goIGhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe7keWumuS6i+S7tu+8jOS4lOW9k2hhbmRsZXLmiafooYzlrozlkI7vvIzoh6rliqjop6PpmaTnu5HlrprjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb25jZVxuICAgICAgICAgICAgICogQGdyYW1tYXIgb25jZSggbmFtZSwgY2FsbGJhY2tbLCBjb250ZXh0XSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBuYW1lICAgICDkuovku7blkI1cbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayDkuovku7blpITnkIblmahcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gICBbY29udGV4dF0gIOS6i+S7tuWkhOeQhuWZqOeahOS4iuS4i+aWh+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7c2VsZn0g6L+U5Zue6Ieq6Lqr77yM5pa55L6/6ZO+5byPXG4gICAgICAgICAgICAgKiBAY2hhaW5hYmxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uY2U6IGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWNhbGxiYWNrICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGVhY2hFdmVudCggbmFtZSwgY2FsbGJhY2ssIGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vZmYoIG5hbWUsIG9uY2UgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoIGNvbnRleHQgfHwgbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgb25jZS5fY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgbWUub24oIG5hbWUsIG9uY2UsIGNvbnRleHQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbWU7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDop6PpmaTkuovku7bnu5HlrppcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb2ZmXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvZmYoIFtuYW1lWywgY2FsbGJhY2tbLCBjb250ZXh0XSBdIF0gKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgW25hbWVdICAgICDkuovku7blkI1cbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIOS6i+S7tuWkhOeQhuWZqFxuICAgICAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSAgIFtjb250ZXh0XSAg5LqL5Lu25aSE55CG5Zmo55qE5LiK5LiL5paH44CCXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzZWxmfSDov5Tlm57oh6rouqvvvIzmlrnkvr/pk77lvI9cbiAgICAgICAgICAgICAqIEBjaGFpbmFibGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb2ZmOiBmdW5jdGlvbiggbmFtZSwgY2IsIGN0eCApIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWV2ZW50cyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIW5hbWUgJiYgIWNiICYmICFjdHggKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZWFjaEV2ZW50KCBuYW1lLCBjYiwgZnVuY3Rpb24oIG5hbWUsIGNiICkge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goIGZpbmRIYW5kbGVycyggZXZlbnRzLCBuYW1lLCBjYiwgY3R4ICksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1sgdGhpcy5pZCBdO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOinpuWPkeS6i+S7tlxuICAgICAgICAgICAgICogQG1ldGhvZCB0cmlnZ2VyXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciB0cmlnZ2VyKCBuYW1lWywgYXJncy4uLl0gKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdHlwZSAgICAg5LqL5Lu25ZCNXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHsqfSBbLi4uXSDku7vmhI/lj4LmlbBcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IOWmguaenGhhbmRsZXLkuK1yZXR1cm4gZmFsc2XkuobvvIzliJnov5Tlm55mYWxzZSwg5ZCm5YiZ6L+U5ZuedHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncywgZXZlbnRzLCBhbGxFdmVudHM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhdGhpcy5fZXZlbnRzIHx8ICF0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgYXJncyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgICAgICAgICAgICAgIGV2ZW50cyA9IGZpbmRIYW5kbGVycyggdGhpcy5fZXZlbnRzLCB0eXBlICk7XG4gICAgICAgICAgICAgICAgYWxsRXZlbnRzID0gZmluZEhhbmRsZXJzKCB0aGlzLl9ldmVudHMsICdhbGwnICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyaWdnZXJIYW5kZXJzKCBldmVudHMsIGFyZ3MgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlckhhbmRlcnMoIGFsbEV2ZW50cywgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuK3ku4vogIXvvIzlroPmnKzouqvmmK/kuKrljZXkvovvvIzkvYblj6/ku6XpgJrov4dbaW5zdGFsbFRvXSgjV2ViVXBsb2FkZXI6TWVkaWF0b3I6aW5zdGFsbFRvKeaWueazle+8jOS9v+S7u+S9leWvueixoeWFt+Wkh+S6i+S7tuihjOS4uuOAglxuICAgICAgICAgKiDkuLvopoHnm67nmoTmmK/otJ/otKPmqKHlnZfkuI7mqKHlnZfkuYvpl7TnmoTlkIjkvZzvvIzpmY3kvY7ogKblkIjluqbjgIJcbiAgICAgICAgICpcbiAgICAgICAgICogQGNsYXNzIE1lZGlhdG9yXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gJC5leHRlbmQoe1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlj6/ku6XpgJrov4fov5nkuKrmjqXlj6PvvIzkvb/ku7vkvZXlr7nosaHlhbflpIfkuovku7blip/og73jgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgaW5zdGFsbFRvXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9iaiDpnIDopoHlhbflpIfkuovku7booYzkuLrnmoTlr7nosaHjgIJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0g6L+U5Zueb2JqLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbnN0YWxsVG86IGZ1bmN0aW9uKCBvYmogKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKCBvYmosIHByb3RvcyApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9LCBwcm90b3MgKTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFVwbG9hZGVy5LiK5Lyg57G7XG4gICAgICovXG4gICAgZGVmaW5lKCd1cGxvYWRlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5LiK5Lyg5YWl5Y+j57G744CCXG4gICAgICAgICAqIEBjbGFzcyBVcGxvYWRlclxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGdyYW1tYXIgbmV3IFVwbG9hZGVyKCBvcHRzICkgPT4gVXBsb2FkZXJcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdmFyIHVwbG9hZGVyID0gV2ViVXBsb2FkZXIuVXBsb2FkZXIoe1xuICAgICAgICAgKiAgICAgc3dmOiAncGF0aF9vZl9zd2YvVXBsb2FkZXIuc3dmJyxcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIOW8gOi1t+WIhueJh+S4iuS8oOOAglxuICAgICAgICAgKiAgICAgY2h1bmtlZDogdHJ1ZVxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFVwbG9hZGVyKCBvcHRzICkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoIHRydWUsIHt9LCBVcGxvYWRlci5vcHRpb25zLCBvcHRzICk7XG4gICAgICAgICAgICB0aGlzLl9pbml0KCB0aGlzLm9wdGlvbnMgKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAvLyBkZWZhdWx0IE9wdGlvbnNcbiAgICAgICAgLy8gd2lkZ2V0c+S4reacieebuOW6lOaJqeWxlVxuICAgICAgICBVcGxvYWRlci5vcHRpb25zID0ge307XG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggVXBsb2FkZXIucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIC8vIOaJuemHj+a3u+WKoOe6r+WRveS7pOW8j+aWueazleOAglxuICAgICAgICAkLmVhY2goe1xuICAgICAgICAgICAgdXBsb2FkOiAnc3RhcnQtdXBsb2FkJyxcbiAgICAgICAgICAgIHN0b3A6ICdzdG9wLXVwbG9hZCcsXG4gICAgICAgICAgICBnZXRGaWxlOiAnZ2V0LWZpbGUnLFxuICAgICAgICAgICAgZ2V0RmlsZXM6ICdnZXQtZmlsZXMnLFxuICAgICAgICAgICAgYWRkRmlsZTogJ2FkZC1maWxlJyxcbiAgICAgICAgICAgIGFkZEZpbGVzOiAnYWRkLWZpbGUnLFxuICAgICAgICAgICAgc29ydDogJ3NvcnQtZmlsZXMnLFxuICAgICAgICAgICAgcmVtb3ZlRmlsZTogJ3JlbW92ZS1maWxlJyxcbiAgICAgICAgICAgIHNraXBGaWxlOiAnc2tpcC1maWxlJyxcbiAgICAgICAgICAgIHJldHJ5OiAncmV0cnknLFxuICAgICAgICAgICAgaXNJblByb2dyZXNzOiAnaXMtaW4tcHJvZ3Jlc3MnLFxuICAgICAgICAgICAgbWFrZVRodW1iOiAnbWFrZS10aHVtYicsXG4gICAgICAgICAgICBnZXREaW1lbnNpb246ICdnZXQtZGltZW5zaW9uJyxcbiAgICAgICAgICAgIGFkZEJ1dHRvbjogJ2FkZC1idG4nLFxuICAgICAgICAgICAgZ2V0UnVudGltZVR5cGU6ICdnZXQtcnVudGltZS10eXBlJyxcbiAgICAgICAgICAgIHJlZnJlc2g6ICdyZWZyZXNoJyxcbiAgICAgICAgICAgIGRpc2FibGU6ICdkaXNhYmxlJyxcbiAgICAgICAgICAgIGVuYWJsZTogJ2VuYWJsZScsXG4gICAgICAgICAgICByZXNldDogJ3Jlc2V0J1xuICAgICAgICB9LCBmdW5jdGlvbiggZm4sIGNvbW1hbmQgKSB7XG4gICAgICAgICAgICBVcGxvYWRlci5wcm90b3R5cGVbIGZuIF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCBjb21tYW5kLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIucHJvdG90eXBlLCB7XG4gICAgICAgICAgICBzdGF0ZTogJ3BlbmRpbmcnLFxuICAgIFxuICAgICAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucmVxdWVzdCggJ2luaXQnLCBvcHRzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuc3RhdGUgPSAncmVhZHknO1xuICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5oiW6ICF6K6+572uVXBsb2FkZXLphY3nva7pobnjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb3B0aW9uXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvcHRpb24oIGtleSApID0+ICpcbiAgICAgICAgICAgICAqIEBncmFtbWFyIG9wdGlvbigga2V5LCB2YWwgKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWIneWni+eKtuaAgeWbvueJh+S4iuS8oOWJjeS4jeS8muWOi+e8qVxuICAgICAgICAgICAgICogdmFyIHVwbG9hZGVyID0gbmV3IFdlYlVwbG9hZGVyLlVwbG9hZGVyKHtcbiAgICAgICAgICAgICAqICAgICByZXNpemU6IG51bGw7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyDkv67mlLnlkI7lm77niYfkuIrkvKDliY3vvIzlsJ3or5XlsIblm77niYfljovnvKnliLAxNjAwICogMTYwMFxuICAgICAgICAgICAgICogdXBsb2FkZXIub3B0aW9ucyggJ3Jlc2l6ZScsIHtcbiAgICAgICAgICAgICAqICAgICB3aWR0aDogMTYwMCxcbiAgICAgICAgICAgICAqICAgICBoZWlnaHQ6IDE2MDBcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvcHRpb246IGZ1bmN0aW9uKCBrZXksIHZhbCApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPiAxICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoICQuaXNQbGFpbk9iamVjdCggdmFsICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmlzUGxhaW5PYmplY3QoIG9wdHNbIGtleSBdICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCggb3B0c1sga2V5IF0sIHZhbCApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0c1sga2V5IF0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAgICAvLyBnZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleSA/IG9wdHNbIGtleSBdIDogb3B0cztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7bnu5/orqHkv6Hmga/jgILov5Tlm57kuIDkuKrljIXlkKvkuIDkuIvkv6Hmga/nmoTlr7nosaHjgIJcbiAgICAgICAgICAgICAqICogYHN1Y2Nlc3NOdW1gIOS4iuS8oOaIkOWKn+eahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgdXBsb2FkRmFpbE51bWAg5LiK5Lyg5aSx6LSl55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBjYW5jZWxOdW1gIOiiq+WIoOmZpOeahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgaW52YWxpZE51bWAg5peg5pWI55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBxdWV1ZU51bWAg6L+Y5Zyo6Zif5YiX5Lit55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGdldFN0YXRzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRTdGF0cygpID0+IE9iamVjdFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdGF0czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoaXMuX21nci5nZXRTdGF0cy5hcHBseSggdGhpcy5fbWdyLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHMgPSB0aGlzLnJlcXVlc3QoJ2dldC1zdGF0cycpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NOdW06IHN0YXRzLm51bU9mU3VjY2VzcyxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hvIGNhcmU/XG4gICAgICAgICAgICAgICAgICAgIC8vIHF1ZXVlRmFpbE51bTogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsTnVtOiBzdGF0cy5udW1PZkNhbmNlbCxcbiAgICAgICAgICAgICAgICAgICAgaW52YWxpZE51bTogc3RhdHMubnVtT2ZJbnZhbGlkLFxuICAgICAgICAgICAgICAgICAgICB1cGxvYWRGYWlsTnVtOiBzdGF0cy5udW1PZlVwbG9hZEZhaWxlZCxcbiAgICAgICAgICAgICAgICAgICAgcXVldWVOdW06IHN0YXRzLm51bU9mUXVldWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOmcgOimgemHjeWGmeatpOaWueazleadpeadpeaUr+aMgW9wdHMub25FdmVudOWSjGluc3RhbmNlLm9uRXZlbnTnmoTlpITnkIblmahcbiAgICAgICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKCB0eXBlLyosIGFyZ3MuLi4qLyApIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gJ29uJyArIHR5cGUuc3Vic3RyaW5nKCAwLCAxICkudG9VcHBlckNhc2UoKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlLnN1YnN0cmluZyggMSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiwg+eUqOmAmui/h29u5pa55rOV5rOo5YaM55qEaGFuZGxlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIE1lZGlhdG9yLnRyaWdnZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApID09PSBmYWxzZSB8fFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6LCD55Sob3B0cy5vbkV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmlzRnVuY3Rpb24oIG9wdHNbIG5hbWUgXSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzWyBuYW1lIF0uYXBwbHkoIHRoaXMsIGFyZ3MgKSA9PT0gZmFsc2UgfHxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiwg+eUqHRoaXMub25FdmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgJC5pc0Z1bmN0aW9uKCB0aGlzWyBuYW1lIF0gKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1sgbmFtZSBdLmFwcGx5KCB0aGlzLCBhcmdzICkgPT09IGZhbHNlIHx8XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlub/mkq3miYDmnIl1cGxvYWRlcueahOS6i+S7tuOAglxuICAgICAgICAgICAgICAgICAgICAgICAgTWVkaWF0b3IudHJpZ2dlci5hcHBseSggTWVkaWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBbIHRoaXMsIHR5cGUgXS5jb25jYXQoIGFyZ3MgKSApID09PSBmYWxzZSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyB3aWRnZXRzL3dpZGdldC5qc+WwhuihpeWFheatpOaWueazleeahOivpue7huaWh+aho+OAglxuICAgICAgICAgICAgcmVxdWVzdDogQmFzZS5ub29wXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Yib5bu6VXBsb2FkZXLlrp7kvovvvIznrYnlkIzkuo5uZXcgVXBsb2FkZXIoIG9wdHMgKTtcbiAgICAgICAgICogQG1ldGhvZCBjcmVhdGVcbiAgICAgICAgICogQGNsYXNzIEJhc2VcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmNyZWF0ZSggb3B0cyApID0+IFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLmNyZWF0ZSA9IFVwbG9hZGVyLmNyZWF0ZSA9IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVcGxvYWRlciggb3B0cyApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyDmmrTpnLJVcGxvYWRlcu+8jOWPr+S7pemAmui/h+Wug+adpeaJqeWxleS4muWKoemAu+i+keOAglxuICAgICAgICBCYXNlLlVwbG9hZGVyID0gVXBsb2FkZXI7XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlcjtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvcnVudGltZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgZmFjdG9yaWVzID0ge30sXG4gICAgXG4gICAgICAgICAgICAvLyDojrflj5blr7nosaHnmoTnrKzkuIDkuKprZXlcbiAgICAgICAgICAgIGdldEZpcnN0S2V5ID0gZnVuY3Rpb24oIG9iaiApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIga2V5IGluIG9iaiApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBvYmouaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOaOpeWPo+exu+OAglxuICAgICAgICBmdW5jdGlvbiBSdW50aW1lKCBvcHRpb25zICkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogZG9jdW1lbnQuYm9keVxuICAgICAgICAgICAgfSwgb3B0aW9ucyApO1xuICAgICAgICAgICAgdGhpcy51aWQgPSBCYXNlLmd1aWQoJ3J0XycpO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBSdW50aW1lLnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgZ2V0Q29udGFpbmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LCBjb250YWluZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLl9jb250YWluZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHBhcmVudCA9ICQoIG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHkgKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSAkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hdHRyKCAnaWQnLCAncnRfJyArIHRoaXMudWlkICk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgICAgICB0b3A6ICcwcHgnLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAnMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBwYXJlbnQuYXBwZW5kKCBjb250YWluZXIgKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IEJhc2Uubm9vcCxcbiAgICAgICAgICAgIGV4ZWM6IEJhc2Uubm9vcCxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy5fY29udGFpbmVyICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5fX2NvbnRhaW5lciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgUnVudGltZS5vcmRlcnMgPSAnaHRtbDUsZmxhc2gnO1xuICAgIFxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5re75YqgUnVudGltZeWunueOsOOAglxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSAgICDnsbvlnotcbiAgICAgICAgICogQHBhcmFtIHtSdW50aW1lfSBmYWN0b3J5IOWFt+S9k1J1bnRpbWXlrp7njrDjgIJcbiAgICAgICAgICovXG4gICAgICAgIFJ1bnRpbWUuYWRkUnVudGltZSA9IGZ1bmN0aW9uKCB0eXBlLCBmYWN0b3J5ICkge1xuICAgICAgICAgICAgZmFjdG9yaWVzWyB0eXBlIF0gPSBmYWN0b3J5O1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBSdW50aW1lLmhhc1J1bnRpbWUgPSBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgIHJldHVybiAhISh0eXBlID8gZmFjdG9yaWVzWyB0eXBlIF0gOiBnZXRGaXJzdEtleSggZmFjdG9yaWVzICkpO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBSdW50aW1lLmNyZWF0ZSA9IGZ1bmN0aW9uKCBvcHRzLCBvcmRlcnMgKSB7XG4gICAgICAgICAgICB2YXIgdHlwZSwgcnVudGltZTtcbiAgICBcbiAgICAgICAgICAgIG9yZGVycyA9IG9yZGVycyB8fCBSdW50aW1lLm9yZGVycztcbiAgICAgICAgICAgICQuZWFjaCggb3JkZXJzLnNwbGl0KCAvXFxzKixcXHMqL2cgKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBmYWN0b3JpZXNbIHRoaXMgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IGdldEZpcnN0S2V5KCBmYWN0b3JpZXMgKTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIXR5cGUgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSdW50aW1lIEVycm9yJyk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBydW50aW1lID0gbmV3IGZhY3Rvcmllc1sgdHlwZSBdKCBvcHRzICk7XG4gICAgICAgICAgICByZXR1cm4gcnVudGltZTtcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBSdW50aW1lLnByb3RvdHlwZSApO1xuICAgICAgICByZXR1cm4gUnVudGltZTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvY2xpZW50JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IsIFJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIHZhciBjYWNoZTtcbiAgICBcbiAgICAgICAgY2FjaGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0ge307XG4gICAgXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFkZDogZnVuY3Rpb24oIHJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsgcnVudGltZS51aWQgXSA9IHJ1bnRpbWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCBydWlkLCBzdGFuZGFsb25lICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBydWlkICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialsgcnVpZCBdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgaW4gb2JqICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5Lqb57G75Z6L5LiN6IO96YeN55So77yM5q+U5aaCZmlsZXBpY2tlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc3RhbmRhbG9uZSAmJiBvYmpbIGkgXS5fX3N0YW5kYWxvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCBydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2JqWyBydW50aW1lLnVpZCBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKCk7XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIFJ1bnRpbWVDbGllbnQoIGNvbXBvbmVudCwgc3RhbmRhbG9uZSApIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKSxcbiAgICAgICAgICAgICAgICBydW50aW1lO1xuICAgIFxuICAgICAgICAgICAgdGhpcy51aWQgPSBCYXNlLmd1aWQoJ2NsaWVudF8nKTtcbiAgICBcbiAgICAgICAgICAgIC8vIOWFgeiuuHJ1bnRpbWXmsqHmnInliJ3lp4vljJbkuYvliY3vvIzms6jlhozkuIDkupvmlrnms5XlnKjliJ3lp4vljJblkI7miafooYzjgIJcbiAgICAgICAgICAgIHRoaXMucnVudGltZVJlYWR5ID0gZnVuY3Rpb24oIGNiICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5kb25lKCBjYiApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdFJ1bnRpbWUgPSBmdW5jdGlvbiggb3B0cywgY2IgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBjb25uZWN0ZWQuXG4gICAgICAgICAgICAgICAgaWYgKCBydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FscmVhZHkgY29ubmVjdGVkIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5kb25lKCBjYiApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9wdHMgPT09ICdzdHJpbmcnICYmIGNhY2hlLmdldCggb3B0cyApICkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lID0gY2FjaGUuZ2V0KCBvcHRzICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWDj2ZpbGVQaWNrZXLlj6rog73ni6znq4vlrZjlnKjvvIzkuI3og73lhaznlKjjgIJcbiAgICAgICAgICAgICAgICBydW50aW1lID0gcnVudGltZSB8fCBjYWNoZS5nZXQoIG51bGwsIHN0YW5kYWxvbmUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDpnIDopoHliJvlu7pcbiAgICAgICAgICAgICAgICBpZiAoICFydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lID0gUnVudGltZS5jcmVhdGUoIG9wdHMsIG9wdHMucnVudGltZU9yZGVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUuX19wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZS5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLmFkZCggcnVudGltZSApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLl9fY2xpZW50ID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDmnaXoh6pjYWNoZVxuICAgICAgICAgICAgICAgICAgICBCYXNlLiQuZXh0ZW5kKCBydW50aW1lLm9wdGlvbnMsIG9wdHMgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZS5fX3Byb21pc2UudGhlbiggZGVmZXJyZWQucmVzb2x2ZSApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLl9fY2xpZW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHN0YW5kYWxvbmUgJiYgKHJ1bnRpbWUuX19zdGFuZGFsb25lID0gc3RhbmRhbG9uZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggIXJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcnVudGltZS5fX2NsaWVudC0tO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggcnVudGltZS5fX2NsaWVudCA8PSAwICkge1xuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoIHJ1bnRpbWUgKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJ1bnRpbWUuX19wcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcnVudGltZSA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5leGVjID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAhcnVudGltZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudCAmJiBhcmdzLnVuc2hpZnQoIGNvbXBvbmVudCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBydW50aW1lLmV4ZWMuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmdldFJ1aWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVudGltZSAmJiBydW50aW1lLnVpZDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3kgPSAoZnVuY3Rpb24oIGRlc3Ryb3kgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBkZXN0cm95ICYmIGRlc3Ryb3kuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vZmYoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdFJ1bnRpbWUoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoIHRoaXMuZGVzdHJveSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggUnVudGltZUNsaWVudC5wcm90b3R5cGUgKTtcbiAgICAgICAgcmV0dXJuIFJ1bnRpbWVDbGllbnQ7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDplJnor6/kv6Hmga9cbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9kbmQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbWVkaWF0b3InLFxuICAgICAgICAncnVudGltZS9jbGllbnQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIE1lZGlhdG9yLCBSdW50aW1lQ2xlbnQgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBEcmFnQW5kRHJvcCggb3B0cyApIHtcbiAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJhZ0FuZERyb3Aub3B0aW9ucywgb3B0cyApO1xuICAgIFxuICAgICAgICAgICAgb3B0cy5jb250YWluZXIgPSAkKCBvcHRzLmNvbnRhaW5lciApO1xuICAgIFxuICAgICAgICAgICAgaWYgKCAhb3B0cy5jb250YWluZXIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIFJ1bnRpbWVDbGVudC5jYWxsKCB0aGlzLCAnRHJhZ0FuZERyb3AnICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgRHJhZ0FuZERyb3Aub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgICAgICAgIGRpc2FibGVHbG9iYWxEbmQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGVudCwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IERyYWdBbmREcm9wLFxuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5jb25uZWN0UnVudGltZSggbWUub3B0aW9ucywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmV4ZWMoJ2luaXQnKTtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIERyYWdBbmREcm9wLnByb3RvdHlwZSApO1xuICAgIFxuICAgICAgICByZXR1cm4gRHJhZ0FuZERyb3A7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDnu4Tku7bln7rnsbvjgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvd2lkZ2V0JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICBfaW5pdCA9IFVwbG9hZGVyLnByb3RvdHlwZS5faW5pdCxcbiAgICAgICAgICAgIElHTk9SRSA9IHt9LFxuICAgICAgICAgICAgd2lkZ2V0Q2xhc3MgPSBbXTtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gaXNBcnJheUxpa2UoIG9iaiApIHtcbiAgICAgICAgICAgIGlmICggIW9iaiApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB0eXBlID0gJC50eXBlKCBvYmogKTtcbiAgICBcbiAgICAgICAgICAgIGlmICggb2JqLm5vZGVUeXBlID09PSAxICYmIGxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHJldHVybiB0eXBlID09PSAnYXJyYXknIHx8IHR5cGUgIT09ICdmdW5jdGlvbicgJiYgdHlwZSAhPT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgICAgICAgICAgKGxlbmd0aCA9PT0gMCB8fCB0eXBlb2YgbGVuZ3RoID09PSAnbnVtYmVyJyAmJiBsZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgICAgIChsZW5ndGggLSAxKSBpbiBvYmopO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIFdpZGdldCggdXBsb2FkZXIgKSB7XG4gICAgICAgICAgICB0aGlzLm93bmVyID0gdXBsb2FkZXI7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSB1cGxvYWRlci5vcHRpb25zO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBXaWRnZXQucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBCYXNlLm5vb3AsXG4gICAgXG4gICAgICAgICAgICAvLyDnsbtCYWNrYm9uZeeahOS6i+S7tuebkeWQrOWjsOaYju+8jOebkeWQrHVwbG9hZGVy5a6e5L6L5LiK55qE5LqL5Lu2XG4gICAgICAgICAgICAvLyB3aWRnZXTnm7TmjqXml6Dms5Xnm5HlkKzkuovku7bvvIzkuovku7blj6rog73pgJrov4d1cGxvYWRlcuadpeS8oOmAklxuICAgICAgICAgICAgaW52b2tlOiBmdW5jdGlvbiggYXBpTmFtZSwgYXJncyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWFrZS10aHVtYic6ICdtYWtlVGh1bWInXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5yZXNwb25zZU1hcDtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzml6BBUEnlk43lupTlo7DmmI7liJnlv73nlaVcbiAgICAgICAgICAgICAgICBpZiAoICFtYXAgfHwgIShhcGlOYW1lIGluIG1hcCkgfHwgIShtYXBbIGFwaU5hbWUgXSBpbiB0aGlzKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgISQuaXNGdW5jdGlvbiggdGhpc1sgbWFwWyBhcGlOYW1lIF0gXSApICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSUdOT1JFO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1sgbWFwWyBhcGlOYW1lIF0gXS5hcHBseSggdGhpcywgYXJncyApO1xuICAgIFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Y+R6YCB5ZG95Luk44CC5b2T5Lyg5YWlYGNhbGxiYWNrYOaIluiAhWBoYW5kbGVyYOS4rei/lOWbnmBwcm9taXNlYOaXtuOAgui/lOWbnuS4gOS4quW9k+aJgOaciWBoYW5kbGVyYOS4reeahHByb21pc2Xpg73lrozmiJDlkI7lrozmiJDnmoTmlrBgcHJvbWlzZWDjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgcmVxdWVzdFxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmVxdWVzdCggY29tbWFuZCwgYXJncyApID0+ICogfCBQcm9taXNlXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZXF1ZXN0KCBjb21tYW5kLCBhcmdzLCBjYWxsYmFjayApID0+IFByb21pc2VcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlcXVlc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm93bmVyLnJlcXVlc3QuYXBwbHkoIHRoaXMub3duZXIsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLy8g5omp5bGVVXBsb2FkZXIuXG4gICAgICAgICQuZXh0ZW5kKCBVcGxvYWRlci5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIC8vIOimhuWGmV9pbml055So5p2l5Yid5aeL5YyWd2lkZ2V0c1xuICAgICAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHdpZGdldHMgPSBtZS5fd2lkZ2V0cyA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgICQuZWFjaCggd2lkZ2V0Q2xhc3MsIGZ1bmN0aW9uKCBfLCBrbGFzcyApIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkZ2V0cy5wdXNoKCBuZXcga2xhc3MoIG1lICkgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gX2luaXQuYXBwbHkoIG1lLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbiggYXBpTmFtZSwgYXJncywgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgICAgICB3aWRnZXRzID0gdGhpcy5fd2lkZ2V0cyxcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gd2lkZ2V0cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHJsdHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgZGZkcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICB3aWRnZXQsIHJsdCwgcHJvbWlzZSwga2V5O1xuICAgIFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBpc0FycmF5TGlrZSggYXJncyApID8gYXJncyA6IFsgYXJncyBdO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICB3aWRnZXQgPSB3aWRnZXRzWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIHJsdCA9IHdpZGdldC5pbnZva2UoIGFwaU5hbWUsIGFyZ3MgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBybHQgIT09IElHTk9SRSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlZmVycmVk5a+56LGhXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIEJhc2UuaXNQcm9taXNlKCBybHQgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZmRzLnB1c2goIHJsdCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBybHRzLnB1c2goIHJsdCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOaciWNhbGxiYWNr77yM5YiZ55So5byC5q2l5pa55byP44CCXG4gICAgICAgICAgICAgICAgaWYgKCBjYWxsYmFjayB8fCBkZmRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSA9IEJhc2Uud2hlbi5hcHBseSggQmFzZSwgZGZkcyApO1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBwcm9taXNlLnBpcGUgPyAncGlwZScgOiAndGhlbic7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOW+iOmHjeimgeS4jeiDveWIoOmZpOOAguWIoOmZpOS6huS8muatu+W+queOr+OAglxuICAgICAgICAgICAgICAgICAgICAvLyDkv53or4HmiafooYzpobrluo/jgILorqljYWxsYmFja+aAu+aYr+WcqOS4i+S4gOS4qnRpY2vkuK3miafooYzjgIJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2VbIGtleSBdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZS5hcHBseSggZGVmZXJyZWQsIGFyZ3MgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMSApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pWyBrZXkgXSggY2FsbGJhY2sgfHwgQmFzZS5ub29wICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJsdHNbIDAgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5re75Yqg57uE5Lu2XG4gICAgICAgICAqIEBwYXJhbSAge29iamVjdH0gd2lkZ2V0UHJvdG8g57uE5Lu25Y6f5Z6L77yM5p6E6YCg5Ye95pWw6YCa6L+HY29uc3RydWN0b3LlsZ7mgKflrprkuYlcbiAgICAgICAgICogQHBhcmFtICB7b2JqZWN0fSByZXNwb25zZU1hcCBBUEnlkI3np7DkuI7lh73mlbDlrp7njrDnmoTmmKDlsIRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIFVwbG9hZGVyLnJlZ2lzdGVyKCB7XG4gICAgICAgICAqICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdGlvbnMgKSB7fSxcbiAgICAgICAgICogICAgICAgICBtYWtlVGh1bWI6IGZ1bmN0aW9uKCkge31cbiAgICAgICAgICogICAgIH0sIHtcbiAgICAgICAgICogICAgICAgICAnbWFrZS10aHVtYic6ICdtYWtlVGh1bWInXG4gICAgICAgICAqICAgICB9ICk7XG4gICAgICAgICAqL1xuICAgICAgICBVcGxvYWRlci5yZWdpc3RlciA9IFdpZGdldC5yZWdpc3RlciA9IGZ1bmN0aW9uKCByZXNwb25zZU1hcCwgd2lkZ2V0UHJvdG8gKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0geyBpbml0OiAnaW5pdCcgfSxcbiAgICAgICAgICAgICAgICBrbGFzcztcbiAgICBcbiAgICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICB3aWRnZXRQcm90byA9IHJlc3BvbnNlTWFwO1xuICAgICAgICAgICAgICAgIHdpZGdldFByb3RvLnJlc3BvbnNlTWFwID0gbWFwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aWRnZXRQcm90by5yZXNwb25zZU1hcCA9ICQuZXh0ZW5kKCBtYXAsIHJlc3BvbnNlTWFwICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBrbGFzcyA9IEJhc2UuaW5oZXJpdHMoIFdpZGdldCwgd2lkZ2V0UHJvdG8gKTtcbiAgICAgICAgICAgIHdpZGdldENsYXNzLnB1c2goIGtsYXNzICk7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4ga2xhc3M7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIHJldHVybiBXaWRnZXQ7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBEcmFnQW5kRHJvcCBXaWRnZXTjgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvZmlsZWRuZCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdsaWIvZG5kJyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgRG5kICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgVXBsb2FkZXIub3B0aW9ucy5kbmQgPSAnJztcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7U2VsZWN0b3J9IFtkbmQ9dW5kZWZpbmVkXSAg5oyH5a6aRHJhZyBBbmQgRHJvcOaLluaLveeahOWuueWZqO+8jOWmguaenOS4jeaMh+Wumu+8jOWImeS4jeWQr+WKqOOAglxuICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBldmVudCBkbmRBY2NlcHRcbiAgICAgICAgICogQHBhcmFtIHtEYXRhVHJhbnNmZXJJdGVtTGlzdH0gaXRlbXMgRGF0YVRyYW5zZmVySXRlbVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24g6Zi75q2i5q2k5LqL5Lu25Y+v5Lul5ouS57ud5p+Q5Lqb57G75Z6L55qE5paH5Lu25ouW5YWl6L+b5p2l44CC55uu5YmN5Y+q5pyJIGNocm9tZSDmj5Dkvpvov5nmoLfnmoQgQVBJ77yM5LiU5Y+q6IO96YCa6L+HIG1pbWUtdHlwZSDpqozor4HjgIJcbiAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiggb3B0cyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFvcHRzLmRuZCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0KCdwcmVkaWN0LXJ1bnRpbWUtdHlwZScpICE9PSAnaHRtbDUnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVHbG9iYWxEbmQ6IG9wdHMuZGlzYWJsZUdsb2JhbERuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogb3B0cy5kbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6IG9wdHMuYWNjZXB0XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBkbmQ7XG4gICAgXG4gICAgICAgICAgICAgICAgZG5kID0gbmV3IERuZCggb3B0aW9ucyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGRuZC5vbmNlKCAncmVhZHknLCBkZWZlcnJlZC5yZXNvbHZlICk7XG4gICAgICAgICAgICAgICAgZG5kLm9uKCAnZHJvcCcsIGZ1bmN0aW9uKCBmaWxlcyApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVxdWVzdCggJ2FkZC1maWxlJywgWyBmaWxlcyBdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDmo4DmtYvmlofku7bmmK/lkKblhajpg6jlhYHorrjmt7vliqDjgIJcbiAgICAgICAgICAgICAgICBkbmQub24oICdhY2NlcHQnLCBmdW5jdGlvbiggaXRlbXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5vd25lci50cmlnZ2VyKCAnZG5kQWNjZXB0JywgaXRlbXMgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBkbmQuaW5pdCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg6ZSZ6K+v5L+h5oGvXG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvZmlsZXBhc3RlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciwgUnVudGltZUNsZW50ICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gRmlsZVBhc3RlKCBvcHRzICkge1xuICAgICAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRzICk7XG4gICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9ICQoIG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHkgKTtcbiAgICAgICAgICAgIFJ1bnRpbWVDbGVudC5jYWxsKCB0aGlzLCAnRmlsZVBhc3RlJyApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGVudCwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IEZpbGVQYXN0ZSxcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuY29ubmVjdFJ1bnRpbWUoIG1lLm9wdGlvbnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCdpbml0Jyk7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIEZpbGVQYXN0ZS5wcm90b3R5cGUgKTtcbiAgICBcbiAgICAgICAgcmV0dXJuIEZpbGVQYXN0ZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOe7hOS7tuWfuuexu+OAglxuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9maWxlcGFzdGUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAnbGliL2ZpbGVwYXN0ZScsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIsIEZpbGVQYXN0ZSApIHtcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge1NlbGVjdG9yfSBbcGFzdGU9dW5kZWZpbmVkXSAg5oyH5a6a55uR5ZCscGFzdGXkuovku7bnmoTlrrnlmajvvIzlpoLmnpzkuI3mjIflrprvvIzkuI3lkK/nlKjmraTlip/og73jgILmraTlip/og73kuLrpgJrov4fnspjotLTmnaXmt7vliqDmiKrlsY/nmoTlm77niYfjgILlu7rorq7orr7nva7kuLpgZG9jdW1lbnQuYm9keWAuXG4gICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhb3B0cy5wYXN0ZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0KCdwcmVkaWN0LXJ1bnRpbWUtdHlwZScpICE9PSAnaHRtbDUnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogb3B0cy5wYXN0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdDogb3B0cy5hY2NlcHRcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIHBhc3RlO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhc3RlID0gbmV3IEZpbGVQYXN0ZSggb3B0aW9ucyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhc3RlLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICBwYXN0ZS5vbiggJ3Bhc3RlJywgZnVuY3Rpb24oIGZpbGVzICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5vd25lci5yZXF1ZXN0KCAnYWRkLWZpbGUnLCBbIGZpbGVzIF0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHBhc3RlLmluaXQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEJsb2JcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9ibG9iJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lQ2xpZW50ICkge1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBCbG9iKCBydWlkLCBzb3VyY2UgKSB7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgbWUuc291cmNlID0gc291cmNlO1xuICAgICAgICAgICAgbWUucnVpZCA9IHJ1aWQ7XG4gICAgXG4gICAgICAgICAgICBSdW50aW1lQ2xpZW50LmNhbGwoIG1lLCAnQmxvYicgKTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMudWlkID0gc291cmNlLnVpZCB8fCB0aGlzLnVpZDtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHNvdXJjZS50eXBlIHx8ICcnO1xuICAgICAgICAgICAgdGhpcy5zaXplID0gc291cmNlLnNpemUgfHwgMDtcbiAgICBcbiAgICAgICAgICAgIGlmICggcnVpZCApIHtcbiAgICAgICAgICAgICAgICBtZS5jb25uZWN0UnVudGltZSggcnVpZCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGllbnQsIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBCbG9iLFxuICAgIFxuICAgICAgICAgICAgc2xpY2U6IGZ1bmN0aW9uKCBzdGFydCwgZW5kICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMoICdzbGljZScsIHN0YXJ0LCBlbmQgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNvdXJjZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIHJldHVybiBCbG9iO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIOS4uuS6hue7n+S4gOWMlkZsYXNo55qERmlsZeWSjEhUTUw155qERmlsZeiAjOWtmOWcqOOAglxuICAgICAqIOS7peiHs+S6juimgeiwg+eUqEZsYXNo6YeM6Z2i55qERmlsZe+8jOS5n+WPr+S7peWDj+iwg+eUqEhUTUw154mI5pys55qERmlsZeS4gOS4i+OAglxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRmlsZVxuICAgICAqL1xuICAgIGRlZmluZSgnbGliL2ZpbGUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbGliL2Jsb2InXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEJsb2IgKSB7XG4gICAgXG4gICAgICAgIHZhciB1aWQgPSAxLFxuICAgICAgICAgICAgckV4dCA9IC9cXC4oW14uXSspJC87XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIEZpbGUoIHJ1aWQsIGZpbGUgKSB7XG4gICAgICAgICAgICB2YXIgZXh0O1xuICAgIFxuICAgICAgICAgICAgQmxvYi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBmaWxlLm5hbWUgfHwgKCd1bnRpdGxlZCcgKyB1aWQrKyk7XG4gICAgICAgICAgICBleHQgPSByRXh0LmV4ZWMoIGZpbGUubmFtZSApID8gUmVnRXhwLiQxLnRvTG93ZXJDYXNlKCkgOiAnJztcbiAgICBcbiAgICAgICAgICAgIC8vIHRvZG8g5pSv5oyB5YW25LuW57G75Z6L5paH5Lu255qE6L2s5o2i44CCXG4gICAgXG4gICAgICAgICAgICAvLyDlpoLmnpzmnIltaW1ldHlwZSwg5L2G5piv5paH5Lu25ZCN6YeM6Z2i5rKh5pyJ5om+5Ye65ZCO57yA6KeE5b6LXG4gICAgICAgICAgICBpZiAoICFleHQgJiYgdGhpcy50eXBlICkge1xuICAgICAgICAgICAgICAgIGV4dCA9IC9cXC8oanBnfGpwZWd8cG5nfGdpZnxibXApJC9pLmV4ZWMoIHRoaXMudHlwZSApID9cbiAgICAgICAgICAgICAgICAgICAgICAgIFJlZ0V4cC4kMS50b0xvd2VyQ2FzZSgpIDogJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lICs9ICcuJyArIGV4dDtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIOWmguaenOayoeacieaMh+Wumm1pbWV0eXBlLCDkvYbmmK/nn6XpgZPmlofku7blkI7nvIDjgIJcbiAgICAgICAgICAgIGlmICggIXRoaXMudHlwZSAmJiAgfidqcGcsanBlZyxwbmcsZ2lmLGJtcCcuaW5kZXhPZiggZXh0ICkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ2ltYWdlLycgKyAoZXh0ID09PSAnanBnJyA/ICdqcGVnJyA6IGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB0aGlzLmV4dCA9IGV4dDtcbiAgICAgICAgICAgIHRoaXMubGFzdE1vZGlmaWVkRGF0ZSA9IGZpbGUubGFzdE1vZGlmaWVkRGF0ZSB8fFxuICAgICAgICAgICAgICAgICAgICAobmV3IERhdGUoKSkudG9Mb2NhbGVTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4gQmFzZS5pbmhlcml0cyggQmxvYiwgRmlsZSApO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg6ZSZ6K+v5L+h5oGvXG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvZmlsZXBpY2tlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCcsXG4gICAgICAgICdsaWIvZmlsZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZUNsZW50LCBGaWxlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gRmlsZVBpY2tlciggb3B0cyApIHtcbiAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRmlsZVBpY2tlci5vcHRpb25zLCBvcHRzICk7XG4gICAgXG4gICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9ICQoIG9wdHMuaWQgKTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIW9wdHMuY29udGFpbmVyLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aMiemSruaMh+WumumUmeivrycpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgb3B0cy5pbm5lckhUTUwgPSBvcHRzLmlubmVySFRNTCB8fCBvcHRzLmxhYmVsIHx8XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyLmh0bWwoKSB8fCAnJztcbiAgICBcbiAgICAgICAgICAgIG9wdHMuYnV0dG9uID0gJCggb3B0cy5idXR0b24gfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykgKTtcbiAgICAgICAgICAgIG9wdHMuYnV0dG9uLmh0bWwoIG9wdHMuaW5uZXJIVE1MICk7XG4gICAgICAgICAgICBvcHRzLmNvbnRhaW5lci5odG1sKCBvcHRzLmJ1dHRvbiApO1xuICAgIFxuICAgICAgICAgICAgUnVudGltZUNsZW50LmNhbGwoIHRoaXMsICdGaWxlUGlja2VyJywgdHJ1ZSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIEZpbGVQaWNrZXIub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGJ1dHRvbjogbnVsbCxcbiAgICAgICAgICAgIGNvbnRhaW5lcjogbnVsbCxcbiAgICAgICAgICAgIGxhYmVsOiBudWxsLFxuICAgICAgICAgICAgaW5uZXJIVE1MOiBudWxsLFxuICAgICAgICAgICAgbXVsdGlwbGU6IHRydWUsXG4gICAgICAgICAgICBhY2NlcHQ6IG51bGwsXG4gICAgICAgICAgICBuYW1lOiAnZmlsZSdcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgQmFzZS5pbmhlcml0cyggUnVudGltZUNsZW50LCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogRmlsZVBpY2tlcixcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBidXR0b24gPSBvcHRzLmJ1dHRvbjtcbiAgICBcbiAgICAgICAgICAgICAgICBidXR0b24uYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2snKTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5vbiggJ2FsbCcsIGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZXM7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoIHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdtb3VzZWVudGVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24uYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2staG92ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ21vdXNlbGVhdmUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5yZW1vdmVDbGFzcygnd2VidXBsb2FkZXItcGljay1ob3ZlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hhbmdlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlcyA9IG1lLmV4ZWMoJ2dldEZpbGVzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ3NlbGVjdCcsICQubWFwKCBmaWxlcywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUgPSBuZXcgRmlsZSggbWUuZ2V0UnVpZCgpLCBmaWxlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiusOW9leadpea6kOOAglxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLl9yZWZlciA9IG9wdHMuY29udGFpbmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSwgb3B0cy5jb250YWluZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLmNvbm5lY3RSdW50aW1lKCBvcHRzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCAnaW5pdCcsIG9wdHMgKTtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAkKCB3aW5kb3cgKS5vbiggJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVmcmVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNoaW1Db250YWluZXIgPSB0aGlzLmdldFJ1bnRpbWUoKS5nZXRDb250YWluZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uID0gdGhpcy5vcHRpb25zLmJ1dHRvbixcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBidXR0b24ub3V0ZXJXaWR0aCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLm91dGVyV2lkdGgoKSA6IGJ1dHRvbi53aWR0aCgpLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBidXR0b24ub3V0ZXJIZWlnaHQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5vdXRlckhlaWdodCgpIDogYnV0dG9uLmhlaWdodCgpLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBwb3MgPSBidXR0b24ub2Zmc2V0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgd2lkdGggJiYgaGVpZ2h0ICYmIHNoaW1Db250YWluZXIuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICsgJ3B4J1xuICAgICAgICAgICAgICAgIH0pLm9mZnNldCggcG9zICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnRuID0gdGhpcy5vcHRpb25zLmJ1dHRvbjtcbiAgICBcbiAgICAgICAgICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2stZGlzYWJsZScpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBidG4gPSB0aGlzLm9wdGlvbnMuYnV0dG9uO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UnVudGltZSgpLmdldENvbnRhaW5lcigpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogJy05OTk5OXB4J1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGJ0bi5hZGRDbGFzcygnd2VidXBsb2FkZXItcGljay1kaXNhYmxlJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhlYygnZGVzdHJveScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIEZpbGVQaWNrZXI7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDmlofku7bpgInmi6nnm7jlhbNcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvZmlsZXBpY2tlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdsaWIvZmlsZXBpY2tlcicsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIsIEZpbGVQaWNrZXIgKSB7XG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIub3B0aW9ucywge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge1NlbGVjdG9yIHwgT2JqZWN0fSBbcGljaz11bmRlZmluZWRdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmjIflrprpgInmi6nmlofku7bnmoTmjInpkq7lrrnlmajvvIzkuI3mjIflrprliJnkuI3liJvlu7rmjInpkq7jgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGBpZGAge1NlbGV0b3J9IOaMh+WumumAieaLqeaWh+S7tueahOaMiemSruWuueWZqO+8jOS4jeaMh+WumuWImeS4jeWIm+W7uuaMiemSruOAglxuICAgICAgICAgICAgICogKiBgbGFiZWxgIHtTdHJpbmd9IOivt+mHh+eUqCBgaW5uZXJIVE1MYCDku6Pmm79cbiAgICAgICAgICAgICAqICogYGlubmVySFRNTGAge1N0cmluZ30g5oyH5a6a5oyJ6ZKu5paH5a2X44CC5LiN5oyH5a6a5pe25LyY5YWI5LuO5oyH5a6a55qE5a655Zmo5Lit55yL5piv5ZCm6Ieq5bim5paH5a2X44CCXG4gICAgICAgICAgICAgKiAqIGBtdWx0aXBsZWAge0Jvb2xlYW59IOaYr+WQpuW8gOi1t+WQjOaXtumAieaLqeWkmuS4quaWh+S7tuiDveWKm+OAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwaWNrOiBudWxsLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Fycm95fSBbYWNjZXB0PW51bGxdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmjIflrprmjqXlj5flk6rkupvnsbvlnovnmoTmlofku7bjgIIg55Sx5LqO55uu5YmN6L+Y5pyJZXh06L2sbWltZVR5cGXooajvvIzmiYDku6Xov5nph4zpnIDopoHliIblvIDmjIflrprjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGB0aXRsZWAge1N0cmluZ30g5paH5a2X5o+P6L+wXG4gICAgICAgICAgICAgKiAqIGBleHRlbnNpb25zYCB7U3RyaW5nfSDlhYHorrjnmoTmlofku7blkI7nvIDvvIzkuI3luKbngrnvvIzlpJrkuKrnlKjpgJflj7fliIblibLjgIJcbiAgICAgICAgICAgICAqICogYG1pbWVUeXBlc2Age1N0cmluZ30g5aSa5Liq55So6YCX5Y+35YiG5Ymy44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICog5aaC77yaXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogYGBgXG4gICAgICAgICAgICAgKiB7XG4gICAgICAgICAgICAgKiAgICAgdGl0bGU6ICdJbWFnZXMnLFxuICAgICAgICAgICAgICogICAgIGV4dGVuc2lvbnM6ICdnaWYsanBnLGpwZWcsYm1wLHBuZycsXG4gICAgICAgICAgICAgKiAgICAgbWltZVR5cGVzOiAnaW1hZ2UvKidcbiAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhY2NlcHQ6IG51bGwvKntcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0ltYWdlcycsXG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uczogJ2dpZixqcGcsanBlZyxibXAscG5nJyxcbiAgICAgICAgICAgICAgICBtaW1lVHlwZXM6ICdpbWFnZS8qJ1xuICAgICAgICAgICAgfSovXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgJ2FkZC1idG4nOiAnYWRkQnV0dG9uJyxcbiAgICAgICAgICAgIHJlZnJlc2g6ICdyZWZyZXNoJyxcbiAgICAgICAgICAgIGRpc2FibGU6ICdkaXNhYmxlJyxcbiAgICAgICAgICAgIGVuYWJsZTogJ2VuYWJsZSdcbiAgICAgICAgfSwge1xuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5waWNrZXJzID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMucGljayAmJiB0aGlzLmFkZEJ1dHRvbiggb3B0cy5waWNrICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVmcmVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCB0aGlzLnBpY2tlcnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgYWRkQnV0dG9uXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBhZGRCdXR0b24oIHBpY2sgKSA9PiBQcm9taXNlXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAqIOa3u+WKoOaWh+S7tumAieaLqeaMiemSru+8jOWmguaenOS4gOS4quaMiemSruS4jeWkn++8jOmcgOimgeiwg+eUqOatpOaWueazleadpea3u+WKoOOAguWPguaVsOi3n1tvcHRpb25zLnBpY2tdKCNXZWJVcGxvYWRlcjpVcGxvYWRlcjpvcHRpb25zKeS4gOiHtOOAglxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHVwbG9hZGVyLmFkZEJ1dHRvbih7XG4gICAgICAgICAgICAgKiAgICAgaWQ6ICcjYnRuQ29udGFpbmVyJyxcbiAgICAgICAgICAgICAqICAgICBpbm5lckhUTUw6ICfpgInmi6nmlofku7YnXG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkQnV0dG9uOiBmdW5jdGlvbiggcGljayApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0ID0gb3B0cy5hY2NlcHQsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMsIHBpY2tlciwgZGVmZXJyZWQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhcGljayApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgICAgICAkLmlzUGxhaW5PYmplY3QoIHBpY2sgKSB8fCAocGljayA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHBpY2tcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHBpY2ssIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0OiAkLmlzUGxhaW5PYmplY3QoIGFjY2VwdCApID8gWyBhY2NlcHQgXSA6IGFjY2VwdCxcbiAgICAgICAgICAgICAgICAgICAgc3dmOiBvcHRzLnN3ZixcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZU9yZGVyOiBvcHRzLnJ1bnRpbWVPcmRlclxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHBpY2tlciA9IG5ldyBGaWxlUGlja2VyKCBvcHRpb25zICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcGlja2VyLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICBwaWNrZXIub24oICdzZWxlY3QnLCBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnJlcXVlc3QoICdhZGQtZmlsZScsIFsgZmlsZXMgXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGlja2VyLmluaXQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLnBpY2tlcnMucHVzaCggcGlja2VyICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkLmVhY2goIHRoaXMucGlja2VycywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCB0aGlzLnBpY2tlcnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVuYWJsZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEltYWdlXG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvaW1hZ2UnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9jbGllbnQnLFxuICAgICAgICAnbGliL2Jsb2InXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFJ1bnRpbWVDbGllbnQsIEJsb2IgKSB7XG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICAvLyDmnoTpgKDlmajjgIJcbiAgICAgICAgZnVuY3Rpb24gSW1hZ2UoIG9wdHMgKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgSW1hZ2Uub3B0aW9ucywgb3B0cyApO1xuICAgICAgICAgICAgUnVudGltZUNsaWVudC5jYWxsKCB0aGlzLCAnSW1hZ2UnICk7XG4gICAgXG4gICAgICAgICAgICB0aGlzLm9uKCAnbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luZm8gPSB0aGlzLmV4ZWMoJ2luZm8nKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tZXRhID0gdGhpcy5leGVjKCdtZXRhJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAvLyDpu5jorqTpgInpobnjgIJcbiAgICAgICAgSW1hZ2Uub3B0aW9ucyA9IHtcbiAgICBcbiAgICAgICAgICAgIC8vIOm7mOiupOeahOWbvueJh+WkhOeQhui0qOmHj1xuICAgICAgICAgICAgcXVhbGl0eTogOTAsXG4gICAgXG4gICAgICAgICAgICAvLyDmmK/lkKboo4HliapcbiAgICAgICAgICAgIGNyb3A6IGZhbHNlLFxuICAgIFxuICAgICAgICAgICAgLy8g5piv5ZCm5L+d55WZ5aS06YOo5L+h5oGvXG4gICAgICAgICAgICBwcmVzZXJ2ZUhlYWRlcnM6IHRydWUsXG4gICAgXG4gICAgICAgICAgICAvLyDmmK/lkKblhYHorrjmlL7lpKfjgIJcbiAgICAgICAgICAgIGFsbG93TWFnbmlmeTogdHJ1ZVxuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyDnu6fmib9SdW50aW1lQ2xpZW50LlxuICAgICAgICBCYXNlLmluaGVyaXRzKCBSdW50aW1lQ2xpZW50LCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogSW1hZ2UsXG4gICAgXG4gICAgICAgICAgICBpbmZvOiBmdW5jdGlvbiggdmFsICkge1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIHNldHRlclxuICAgICAgICAgICAgICAgIGlmICggdmFsICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmZvID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZ2V0dGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luZm87XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgbWV0YTogZnVuY3Rpb24oIHZhbCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWV0YSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGdldHRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZXRhO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGxvYWRGcm9tQmxvYjogZnVuY3Rpb24oIGJsb2IgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcnVpZCA9IGJsb2IuZ2V0UnVpZCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdFJ1bnRpbWUoIHJ1aWQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCAnaW5pdCcsIG1lLm9wdGlvbnMgKTtcbiAgICAgICAgICAgICAgICAgICAgbWUuZXhlYyggJ2xvYWRGcm9tQmxvYicsIGJsb2IgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICByZXNpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQmFzZS5zbGljZSggYXJndW1lbnRzICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYy5hcHBseSggdGhpcywgWyAncmVzaXplJyBdLmNvbmNhdCggYXJncyApICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0QXNEYXRhVXJsOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCAnZ2V0QXNEYXRhVXJsJywgdHlwZSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldEFzQmxvYjogZnVuY3Rpb24oIHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsb2IgPSB0aGlzLmV4ZWMoICdnZXRBc0Jsb2InLCB0eXBlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCbG9iKCB0aGlzLmdldFJ1aWQoKSwgYmxvYiApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIEltYWdlO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5Zu+54mH5pON5L2cLCDotJ/otKPpooTop4jlm77niYflkozkuIrkvKDliY3ljovnvKnlm77niYdcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvaW1hZ2UnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAnbGliL2ltYWdlJyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgSW1hZ2UgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgdGhyb3R0bGU7XG4gICAgXG4gICAgICAgIC8vIOagueaNruimgeWkhOeQhueahOaWh+S7tuWkp+Wwj+adpeiKgua1ge+8jOS4gOasoeS4jeiDveWkhOeQhuWkquWkmu+8jOS8muWNoeOAglxuICAgICAgICB0aHJvdHRsZSA9IChmdW5jdGlvbiggbWF4ICkge1xuICAgICAgICAgICAgdmFyIG9jY3VwaWVkID0gMCxcbiAgICAgICAgICAgICAgICB3YWl0aW5nID0gW10sXG4gICAgICAgICAgICAgICAgdGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCB3YWl0aW5nLmxlbmd0aCAmJiBvY2N1cGllZCA8IG1heCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB3YWl0aW5nLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvY2N1cGllZCArPSBpdGVtWyAwIF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtWyAxIF0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGVtaXRlciwgc2l6ZSwgY2IgKSB7XG4gICAgICAgICAgICAgICAgd2FpdGluZy5wdXNoKFsgc2l6ZSwgY2IgXSk7XG4gICAgICAgICAgICAgICAgZW1pdGVyLm9uY2UoICdkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9jY3VwaWVkIC09IHNpemU7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoIHRpY2ssIDEgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCB0aWNrLCAxICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KSggNSAqIDEwMjQgKiAxMDI0ICk7XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBVcGxvYWRlci5vcHRpb25zLCB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbdGh1bWJdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDphY3nva7nlJ/miJDnvKnnlaXlm77nmoTpgInpobnjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiDpu5jorqTkuLrvvJpcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgYGBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgKiB7XG4gICAgICAgICAgICAgKiAgICAgd2lkdGg6IDExMCxcbiAgICAgICAgICAgICAqICAgICBoZWlnaHQ6IDExMCxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5Zu+54mH6LSo6YeP77yM5Y+q5pyJdHlwZeS4umBpbWFnZS9qcGVnYOeahOaXtuWAmeaJjeacieaViOOAglxuICAgICAgICAgICAgICogICAgIHF1YWxpdHk6IDcwLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDmmK/lkKblhYHorrjmlL7lpKfvvIzlpoLmnpzmg7PopoHnlJ/miJDlsI/lm77nmoTml7blgJnkuI3lpLHnnJ/vvIzmraTpgInpobnlupTor6Xorr7nva7kuLpmYWxzZS5cbiAgICAgICAgICAgICAqICAgICBhbGxvd01hZ25pZnk6IHRydWUsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOaYr+WQpuWFgeiuuOijgeWJquOAglxuICAgICAgICAgICAgICogICAgIGNyb3A6IHRydWUsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOaYr+WQpuS/neeVmeWktOmDqG1ldGHkv6Hmga/jgIJcbiAgICAgICAgICAgICAqICAgICBwcmVzZXJ2ZUhlYWRlcnM6IGZhbHNlLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDkuLrnqbrnmoTor53liJnkv53nlZnljp/mnInlm77niYfmoLzlvI/jgIJcbiAgICAgICAgICAgICAqICAgICAvLyDlkKbliJnlvLrliLbovazmjaLmiJDmjIflrprnmoTnsbvlnovjgIJcbiAgICAgICAgICAgICAqICAgICB0eXBlOiAnaW1hZ2UvanBlZydcbiAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aHVtYjoge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAxMTAsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxMTAsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogNzAsXG4gICAgICAgICAgICAgICAgYWxsb3dNYWduaWZ5OiB0cnVlLFxuICAgICAgICAgICAgICAgIGNyb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgcHJlc2VydmVIZWFkZXJzOiBmYWxzZSxcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuLrnqbrnmoTor53liJnkv53nlZnljp/mnInlm77niYfmoLzlvI/jgIJcbiAgICAgICAgICAgICAgICAvLyDlkKbliJnlvLrliLbovazmjaLmiJDmjIflrprnmoTnsbvlnovjgIJcbiAgICAgICAgICAgICAgICAvLyBJRSA45LiL6Z2iIGJhc2U2NCDlpKflsI/kuI3og73otoXov4cgMzJLIOWQpuWImemihOiniOWksei0pe+8jOiAjOmdniBqcGVnIOe8lueggeeahOWbvueJh+W+iOWPr1xuICAgICAgICAgICAgICAgIC8vIOiDveS8mui2hei/hyAzMmssIOaJgOS7pei/memHjOiuvue9ruaIkOmihOiniOeahOaXtuWAmemDveaYryBpbWFnZS9qcGVnXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL2pwZWcnXG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW2NvbXByZXNzXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6YWN572u5Y6L57yp55qE5Zu+54mH55qE6YCJ6aG544CC5aaC5p6c5q2k6YCJ6aG55Li6YGZhbHNlYCwg5YiZ5Zu+54mH5Zyo5LiK5Lyg5YmN5LiN6L+b6KGM5Y6L57yp44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICog6buY6K6k5Li677yaXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogYGBgamF2YXNjcmlwdFxuICAgICAgICAgICAgICoge1xuICAgICAgICAgICAgICogICAgIHdpZHRoOiAxNjAwLFxuICAgICAgICAgICAgICogICAgIGhlaWdodDogMTYwMCxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5Zu+54mH6LSo6YeP77yM5Y+q5pyJdHlwZeS4umBpbWFnZS9qcGVnYOeahOaXtuWAmeaJjeacieaViOOAglxuICAgICAgICAgICAgICogICAgIHF1YWxpdHk6IDkwLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDmmK/lkKblhYHorrjmlL7lpKfvvIzlpoLmnpzmg7PopoHnlJ/miJDlsI/lm77nmoTml7blgJnkuI3lpLHnnJ/vvIzmraTpgInpobnlupTor6Xorr7nva7kuLpmYWxzZS5cbiAgICAgICAgICAgICAqICAgICBhbGxvd01hZ25pZnk6IGZhbHNlLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDmmK/lkKblhYHorrjoo4HliarjgIJcbiAgICAgICAgICAgICAqICAgICBjcm9wOiBmYWxzZSxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5piv5ZCm5L+d55WZ5aS06YOobWV0YeS/oeaBr+OAglxuICAgICAgICAgICAgICogICAgIHByZXNlcnZlSGVhZGVyczogdHJ1ZVxuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICogYGBgXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDE2MDAsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxNjAwLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDkwLFxuICAgICAgICAgICAgICAgIGFsbG93TWFnbmlmeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgY3JvcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgcHJlc2VydmVIZWFkZXJzOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgJ21ha2UtdGh1bWInOiAnbWFrZVRodW1iJyxcbiAgICAgICAgICAgICdiZWZvcmUtc2VuZC1maWxlJzogJ2NvbXByZXNzSW1hZ2UnXG4gICAgICAgIH0sIHtcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog55Sf5oiQ57yp55Wl5Zu+77yM5q2k6L+H56iL5Li65byC5q2l77yM5omA5Lul6ZyA6KaB5Lyg5YWlYGNhbGxiYWNrYOOAglxuICAgICAgICAgICAgICog6YCa5bi45oOF5Ya15Zyo5Zu+54mH5Yqg5YWl6Zif6YeM5ZCO6LCD55So5q2k5pa55rOV5p2l55Sf5oiQ6aKE6KeI5Zu+5Lul5aKe5by65Lqk5LqS5pWI5p6c44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogYGNhbGxiYWNrYOS4reWPr+S7peaOpeaUtuWIsOS4pOS4quWPguaVsOOAglxuICAgICAgICAgICAgICogKiDnrKzkuIDkuKrkuLplcnJvcu+8jOWmguaenOeUn+aIkOe8qeeVpeWbvuaciemUmeivr++8jOatpGVycm9y5bCG5Li655yf44CCXG4gICAgICAgICAgICAgKiAqIOesrOS6jOS4quS4unJldCwg57yp55Wl5Zu+55qERGF0YSBVUkzlgLzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqKuazqOaEjyoqXG4gICAgICAgICAgICAgKiBEYXRlIFVSTOWcqElFNi835Lit5LiN5pSv5oyB77yM5omA5Lul5LiN55So6LCD55So5q2k5pa55rOV5LqG77yM55u05o6l5pi+56S65LiA5byg5pqC5LiN5pSv5oyB6aKE6KeI5Zu+54mH5aW95LqG44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZXRob2QgbWFrZVRodW1iXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBtYWtlVGh1bWIoIGZpbGUsIGNhbGxiYWNrICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBtYWtlVGh1bWIoIGZpbGUsIGNhbGxiYWNrLCB3aWR0aCwgaGVpZ2h0ICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIHVwbG9hZGVyLm9uKCAnZmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICogICAgIHZhciAkbGkgPSAuLi47XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIHVwbG9hZGVyLm1ha2VUaHVtYiggZmlsZSwgZnVuY3Rpb24oIGVycm9yLCByZXQgKSB7XG4gICAgICAgICAgICAgKiAgICAgICAgIGlmICggZXJyb3IgKSB7XG4gICAgICAgICAgICAgKiAgICAgICAgICAgICAkbGkudGV4dCgn6aKE6KeI6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgKiAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgKiAgICAgICAgICAgICAkbGkuYXBwZW5kKCc8aW1nIGFsdD1cIlwiIHNyYz1cIicgKyByZXQgKyAnXCIgLz4nKTtcbiAgICAgICAgICAgICAqICAgICAgICAgfVxuICAgICAgICAgICAgICogICAgIH0pO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBtYWtlVGh1bWI6IGZ1bmN0aW9uKCBmaWxlLCBjYiwgd2lkdGgsIGhlaWdodCApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cywgaW1hZ2U7XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZSA9IHRoaXMucmVxdWVzdCggJ2dldC1maWxlJywgZmlsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWPqumihOiniOWbvueJh+agvOW8j+OAglxuICAgICAgICAgICAgICAgIGlmICggIWZpbGUudHlwZS5tYXRjaCggL15pbWFnZS8gKSApIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoIHRydWUgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucy50aHVtYiApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOS8oOWFpeeahOaYr29iamVjdC5cbiAgICAgICAgICAgICAgICBpZiAoICQuaXNQbGFpbk9iamVjdCggd2lkdGggKSApIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKCBvcHRzLCB3aWR0aCApO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHdpZHRoID0gd2lkdGggfHwgb3B0cy53aWR0aDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBoZWlnaHQgfHwgb3B0cy5oZWlnaHQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoIG9wdHMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZS5vbmNlKCAnbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlLl9pbmZvID0gZmlsZS5faW5mbyB8fCBpbWFnZS5pbmZvKCk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuX21ldGEgPSBmaWxlLl9tZXRhIHx8IGltYWdlLm1ldGEoKTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UucmVzaXplKCB3aWR0aCwgaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2Uub25jZSggJ2NvbXBsZXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKCBmYWxzZSwgaW1hZ2UuZ2V0QXNEYXRhVXJsKCBvcHRzLnR5cGUgKSApO1xuICAgICAgICAgICAgICAgICAgICBpbWFnZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2Uub25jZSggJ2Vycm9yJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKCB0cnVlICk7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aHJvdHRsZSggaW1hZ2UsIGZpbGUuc291cmNlLnNpemUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlLl9pbmZvICYmIGltYWdlLmluZm8oIGZpbGUuX2luZm8gKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5fbWV0YSAmJiBpbWFnZS5tZXRhKCBmaWxlLl9tZXRhICk7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlLmxvYWRGcm9tQmxvYiggZmlsZS5zb3VyY2UgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBjb21wcmVzc0ltYWdlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucy5jb21wcmVzcyB8fCB0aGlzLm9wdGlvbnMucmVzaXplLFxuICAgICAgICAgICAgICAgICAgICBjb21wcmVzc1NpemUgPSBvcHRzICYmIG9wdHMuY29tcHJlc3NTaXplIHx8IDMwMCAqIDEwMjQsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlLCBkZWZlcnJlZDtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlID0gdGhpcy5yZXF1ZXN0KCAnZ2V0LWZpbGUnLCBmaWxlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Y+q6aKE6KeI5Zu+54mH5qC85byP44CCXG4gICAgICAgICAgICAgICAgaWYgKCAhb3B0cyB8fCAhfidpbWFnZS9qcGVnLGltYWdlL2pwZycuaW5kZXhPZiggZmlsZS50eXBlICkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2l6ZSA8IGNvbXByZXNzU2l6ZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5fY29tcHJlc3NlZCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIG9wdHMgKTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZSA9IG5ldyBJbWFnZSggb3B0cyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGRlZmVycmVkLmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICBpbWFnZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaW1hZ2Uub25jZSggJ2Vycm9yJywgZGVmZXJyZWQucmVqZWN0ICk7XG4gICAgICAgICAgICAgICAgaW1hZ2Uub25jZSggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5faW5mbyA9IGZpbGUuX2luZm8gfHwgaW1hZ2UuaW5mbygpO1xuICAgICAgICAgICAgICAgICAgICBmaWxlLl9tZXRhID0gZmlsZS5fbWV0YSB8fCBpbWFnZS5tZXRhKCk7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlLnJlc2l6ZSggb3B0cy53aWR0aCwgb3B0cy5oZWlnaHQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZS5vbmNlKCAnY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IsIHNpemU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOenu+WKqOerryBVQyAvIHFxIOa1j+iniOWZqOeahOaXoOWbvuaooeW8j+S4i1xuICAgICAgICAgICAgICAgICAgICAvLyBjdHguZ2V0SW1hZ2VEYXRhIOWkhOeQhuWkp+WbvueahOaXtuWAmeS8muaKpSBFeGNlcHRpb25cbiAgICAgICAgICAgICAgICAgICAgLy8gSU5ERVhfU0laRV9FUlI6IERPTSBFeGNlcHRpb24gMVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvYiA9IGltYWdlLmdldEFzQmxvYiggb3B0cy50eXBlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplID0gZmlsZS5zaXplO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5Y6L57yp5ZCO77yM5q+U5Y6f5p2l6L+Y5aSn5YiZ5LiN55So5Y6L57yp5ZCO55qE44CCXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGJsb2Iuc2l6ZSA8IHNpemUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlsZS5zb3VyY2UuZGVzdHJveSAmJiBmaWxlLnNvdXJjZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zb3VyY2UgPSBibG9iO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2l6ZSA9IGJsb2Iuc2l6ZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnRyaWdnZXIoICdyZXNpemUnLCBibG9iLnNpemUsIHNpemUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOagh+iusO+8jOmBv+WFjemHjeWkjeWOi+e8qeOAglxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5fY29tcHJlc3NlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKCBlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Ye66ZSZ5LqG55u05o6l57un57ut77yM6K6p5YW25LiK5Lyg5Y6f5aeL5Zu+54mHXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlLl9pbmZvICYmIGltYWdlLmluZm8oIGZpbGUuX2luZm8gKTtcbiAgICAgICAgICAgICAgICBmaWxlLl9tZXRhICYmIGltYWdlLm1ldGEoIGZpbGUuX21ldGEgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZS5sb2FkRnJvbUJsb2IoIGZpbGUuc291cmNlICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDmlofku7blsZ7mgKflsIHoo4VcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2ZpbGUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbWVkaWF0b3InXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIE1lZGlhdG9yICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIGlkUHJlZml4ID0gJ1dVX0ZJTEVfJyxcbiAgICAgICAgICAgIGlkU3VmZml4ID0gMCxcbiAgICAgICAgICAgIHJFeHQgPSAvXFwuKFteLl0rKSQvLFxuICAgICAgICAgICAgc3RhdHVzTWFwID0ge307XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGdpZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBpZFByZWZpeCArIGlkU3VmZml4Kys7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaWh+S7tuexu1xuICAgICAgICAgKiBAY2xhc3MgRmlsZVxuICAgICAgICAgKiBAY29uc3RydWN0b3Ig5p6E6YCg5Ye95pWwXG4gICAgICAgICAqIEBncmFtbWFyIG5ldyBGaWxlKCBzb3VyY2UgKSA9PiBGaWxlXG4gICAgICAgICAqIEBwYXJhbSB7TGliLkZpbGV9IHNvdXJjZSBbbGliLkZpbGVdKCNMaWIuRmlsZSnlrp7kvossIOatpHNvdXJjZeWvueixoeaYr+W4puaciVJ1bnRpbWXkv6Hmga/nmoTjgIJcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFdVRmlsZSggc291cmNlICkge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlofku7blkI3vvIzljIXmi6zmianlsZXlkI3vvIjlkI7nvIDvvIlcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBuYW1lXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBzb3VyY2UubmFtZSB8fCAnVW50aXRsZWQnO1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlofku7bkvZPnp6/vvIjlrZfoioLvvIlcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBzaXplXG4gICAgICAgICAgICAgKiBAdHlwZSB7dWludH1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IDBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5zaXplID0gc291cmNlLnNpemUgfHwgMDtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5Lu2TUlNRVRZUEXnsbvlnovvvIzkuI7mlofku7bnsbvlnovnmoTlr7nlupTlhbPns7vor7flj4LogINbaHR0cDovL3QuY24vejhabkZueV0oaHR0cDovL3QuY24vejhabkZueSlcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB0eXBlXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgJ2FwcGxpY2F0aW9uJ1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBzb3VyY2UudHlwZSB8fCAnYXBwbGljYXRpb24nO1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlofku7bmnIDlkI7kv67mlLnml6XmnJ9cbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBsYXN0TW9kaWZpZWREYXRlXG4gICAgICAgICAgICAgKiBAdHlwZSB7aW50fVxuICAgICAgICAgICAgICogQGRlZmF1bHQg5b2T5YmN5pe26Ze05oizXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMubGFzdE1vZGlmaWVkRGF0ZSA9IHNvdXJjZS5sYXN0TW9kaWZpZWREYXRlIHx8IChuZXcgRGF0ZSgpICogMSk7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tklE77yM5q+P5Liq5a+56LGh5YW35pyJ5ZSv5LiASUTvvIzkuI7mlofku7blkI3ml6DlhbNcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBpZFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5pZCA9IGdpZCgpO1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlofku7bmianlsZXlkI3vvIzpgJrov4fmlofku7blkI3ojrflj5bvvIzkvovlpoJ0ZXN0LnBuZ+eahOaJqeWxleWQjeS4unBuZ1xuICAgICAgICAgICAgICogQHByb3BlcnR5IGV4dFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5leHQgPSByRXh0LmV4ZWMoIHRoaXMubmFtZSApID8gUmVnRXhwLiQxIDogJyc7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOeKtuaAgeaWh+Wtl+ivtOaYjuOAguWcqOS4jeWQjOeahHN0YXR1c+ivreWig+S4i+acieS4jeWQjOeahOeUqOmAlOOAglxuICAgICAgICAgICAgICogQHByb3BlcnR5IHN0YXR1c1RleHRcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuc3RhdHVzVGV4dCA9ICcnO1xuICAgIFxuICAgICAgICAgICAgLy8g5a2Y5YKo5paH5Lu254q25oCB77yM6Ziy5q2i6YCa6L+H5bGe5oCn55u05o6l5L+u5pS5XG4gICAgICAgICAgICBzdGF0dXNNYXBbIHRoaXMuaWQgXSA9IFdVRmlsZS5TdGF0dXMuSU5JVEVEO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZCA9IDA7XG4gICAgXG4gICAgICAgICAgICB0aGlzLm9uKCAnZXJyb3InLCBmdW5jdGlvbiggbXNnICkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdHVzKCBXVUZpbGUuU3RhdHVzLkVSUk9SLCBtc2cgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBXVUZpbGUucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiuvue9rueKtuaAge+8jOeKtuaAgeWPmOWMluaXtuS8muinpuWPkWBjaGFuZ2Vg5LqL5Lu244CCXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHNldFN0YXR1c1xuICAgICAgICAgICAgICogQGdyYW1tYXIgc2V0U3RhdHVzKCBzdGF0dXNbLCBzdGF0dXNUZXh0XSApO1xuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlLlN0YXR1c3xTdHJpbmd9IHN0YXR1cyBb5paH5Lu254q25oCB5YC8XSgjV2ViVXBsb2FkZXI6RmlsZTpGaWxlLlN0YXR1cylcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbc3RhdHVzVGV4dD0nJ10g54q25oCB6K+05piO77yM5bi45ZyoZXJyb3Lml7bkvb/nlKjvvIznlKhodHRwLCBhYm9ydCxzZXJ2ZXLnrYnmnaXmoIforrDmmK/nlLHkuo7ku4DkuYjljp/lm6Dlr7zoh7Tmlofku7bplJnor6/jgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3RhdHVzOiBmdW5jdGlvbiggc3RhdHVzLCB0ZXh0ICkge1xuICAgIFxuICAgICAgICAgICAgICAgIHZhciBwcmV2U3RhdHVzID0gc3RhdHVzTWFwWyB0aGlzLmlkIF07XG4gICAgXG4gICAgICAgICAgICAgICAgdHlwZW9mIHRleHQgIT09ICd1bmRlZmluZWQnICYmICh0aGlzLnN0YXR1c1RleHQgPSB0ZXh0KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cyAhPT0gcHJldlN0YXR1cyApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWFwWyB0aGlzLmlkIF0gPSBzdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiDmlofku7bnirbmgIHlj5jljJZcbiAgICAgICAgICAgICAgICAgICAgICogQGV2ZW50IHN0YXR1c2NoYW5nZVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCAnc3RhdHVzY2hhbmdlJywgc3RhdHVzLCBwcmV2U3RhdHVzICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5paH5Lu254q25oCBXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtGaWxlLlN0YXR1c31cbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgICAgICAgICDmlofku7bnirbmgIHlhbfkvZPljIXmi6zku6XkuIvlh6Dnp43nsbvlnovvvJpcbiAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliJ3lp4vljJZcbiAgICAgICAgICAgICAgICAgICAgICAgIElOSVRFRDogICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlt7LlhaXpmJ/liJdcbiAgICAgICAgICAgICAgICAgICAgICAgIFFVRVVFRDogICAgIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmraPlnKjkuIrkvKBcbiAgICAgICAgICAgICAgICAgICAgICAgIFBST0dSRVNTOiAgICAgMixcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS4iuS8oOWHuumUmVxuICAgICAgICAgICAgICAgICAgICAgICAgRVJST1I6ICAgICAgICAgMyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS4iuS8oOaIkOWKn1xuICAgICAgICAgICAgICAgICAgICAgICAgQ09NUExFVEU6ICAgICA0LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LiK5Lyg5Y+W5raIXG4gICAgICAgICAgICAgICAgICAgICAgICBDQU5DRUxMRUQ6ICAgICA1XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0U3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdHVzTWFwWyB0aGlzLmlkIF07XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7bljp/lp4vkv6Hmga/jgIJcbiAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFNvdXJjZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBzdGF0dXNNYXBbIHRoaXMuaWQgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggV1VGaWxlLnByb3RvdHlwZSApO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5paH5Lu254q25oCB5YC877yM5YW35L2T5YyF5ous5Lul5LiL5Yeg56eN57G75Z6L77yaXG4gICAgICAgICAqICogYGluaXRlZGAg5Yid5aeL54q25oCBXG4gICAgICAgICAqICogYHF1ZXVlZGAg5bey57uP6L+b5YWl6Zif5YiXLCDnrYnlvoXkuIrkvKBcbiAgICAgICAgICogKiBgcHJvZ3Jlc3NgIOS4iuS8oOS4rVxuICAgICAgICAgKiAqIGBjb21wbGV0ZWAg5LiK5Lyg5a6M5oiQ44CCXG4gICAgICAgICAqICogYGVycm9yYCDkuIrkvKDlh7rplJnvvIzlj6/ph43or5VcbiAgICAgICAgICogKiBgaW50ZXJydXB0YCDkuIrkvKDkuK3mlq3vvIzlj6/nu63kvKDjgIJcbiAgICAgICAgICogKiBgaW52YWxpZGAg5paH5Lu25LiN5ZCI5qC877yM5LiN6IO96YeN6K+V5LiK5Lyg44CC5Lya6Ieq5Yqo5LuO6Zif5YiX5Lit56e76Zmk44CCXG4gICAgICAgICAqICogYGNhbmNlbGxlZGAg5paH5Lu26KKr56e76Zmk44CCXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBTdGF0dXNcbiAgICAgICAgICogQG5hbWVzcGFjZSBGaWxlXG4gICAgICAgICAqIEBjbGFzcyBGaWxlXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICovXG4gICAgICAgIFdVRmlsZS5TdGF0dXMgPSB7XG4gICAgICAgICAgICBJTklURUQ6ICAgICAnaW5pdGVkJywgICAgLy8g5Yid5aeL54q25oCBXG4gICAgICAgICAgICBRVUVVRUQ6ICAgICAncXVldWVkJywgICAgLy8g5bey57uP6L+b5YWl6Zif5YiXLCDnrYnlvoXkuIrkvKBcbiAgICAgICAgICAgIFBST0dSRVNTOiAgICdwcm9ncmVzcycsICAgIC8vIOS4iuS8oOS4rVxuICAgICAgICAgICAgRVJST1I6ICAgICAgJ2Vycm9yJywgICAgLy8g5LiK5Lyg5Ye66ZSZ77yM5Y+v6YeN6K+VXG4gICAgICAgICAgICBDT01QTEVURTogICAnY29tcGxldGUnLCAgICAvLyDkuIrkvKDlrozmiJDjgIJcbiAgICAgICAgICAgIENBTkNFTExFRDogICdjYW5jZWxsZWQnLCAgICAvLyDkuIrkvKDlj5bmtojjgIJcbiAgICAgICAgICAgIElOVEVSUlVQVDogICdpbnRlcnJ1cHQnLCAgICAvLyDkuIrkvKDkuK3mlq3vvIzlj6/nu63kvKDjgIJcbiAgICAgICAgICAgIElOVkFMSUQ6ICAgICdpbnZhbGlkJyAgICAvLyDmlofku7bkuI3lkIjmoLzvvIzkuI3og73ph43or5XkuIrkvKDjgIJcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFdVRmlsZTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOaWh+S7tumYn+WIl1xuICAgICAqL1xuICAgIGRlZmluZSgncXVldWUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbWVkaWF0b3InLFxuICAgICAgICAnZmlsZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IsIFdVRmlsZSApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICBTVEFUVVMgPSBXVUZpbGUuU3RhdHVzO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5paH5Lu26Zif5YiXLCDnlKjmnaXlrZjlgqjlkITkuKrnirbmgIHkuK3nmoTmlofku7bjgIJcbiAgICAgICAgICogQGNsYXNzIFF1ZXVlXG4gICAgICAgICAqIEBleHRlbmRzIE1lZGlhdG9yXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBRdWV1ZSgpIHtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog57uf6K6h5paH5Lu25pWw44CCXG4gICAgICAgICAgICAgKiAqIGBudW1PZlF1ZXVlYCDpmJ/liJfkuK3nmoTmlofku7bmlbDjgIJcbiAgICAgICAgICAgICAqICogYG51bU9mU3VjY2Vzc2Ag5LiK5Lyg5oiQ5Yqf55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBudW1PZkNhbmNlbGAg6KKr56e76Zmk55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBudW1PZlByb2dyZXNzYCDmraPlnKjkuIrkvKDkuK3nmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqICogYG51bU9mVXBsb2FkRmFpbGVkYCDkuIrkvKDplJnor6/nmoTmlofku7bmlbDjgIJcbiAgICAgICAgICAgICAqICogYG51bU9mSW52YWxpZGAg5peg5pWI55qE5paH5Lu25pWw44CCXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gc3RhdHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5zdGF0cyA9IHtcbiAgICAgICAgICAgICAgICBudW1PZlF1ZXVlOiAwLFxuICAgICAgICAgICAgICAgIG51bU9mU3VjY2VzczogMCxcbiAgICAgICAgICAgICAgICBudW1PZkNhbmNlbDogMCxcbiAgICAgICAgICAgICAgICBudW1PZlByb2dyZXNzOiAwLFxuICAgICAgICAgICAgICAgIG51bU9mVXBsb2FkRmFpbGVkOiAwLFxuICAgICAgICAgICAgICAgIG51bU9mSW52YWxpZDogMFxuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIC8vIOS4iuS8oOmYn+WIl++8jOS7heWMheaLrOetieW+heS4iuS8oOeahOaWh+S7tlxuICAgICAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICBcbiAgICAgICAgICAgIC8vIOWtmOWCqOaJgOacieaWh+S7tlxuICAgICAgICAgICAgdGhpcy5fbWFwID0ge307XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFF1ZXVlLnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlsIbmlrDmlofku7bliqDlhaXlr7npmJ/liJflsL7pg6hcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGFwcGVuZFxuICAgICAgICAgICAgICogQHBhcmFtICB7RmlsZX0gZmlsZSAgIOaWh+S7tuWvueixoVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goIGZpbGUgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWxlQWRkZWQoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWwhuaWsOaWh+S7tuWKoOWFpeWvuemYn+WIl+WktOmDqFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZXRob2QgcHJlcGVuZFxuICAgICAgICAgICAgICogQHBhcmFtICB7RmlsZX0gZmlsZSAgIOaWh+S7tuWvueixoVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwcmVwZW5kOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9xdWV1ZS51bnNoaWZ0KCBmaWxlICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsZUFkZGVkKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7blr7nosaFcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGdldEZpbGVcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZUlkICAg5paH5Lu2SURcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0ZpbGV9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEZpbGU6IGZ1bmN0aW9uKCBmaWxlSWQgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgZmlsZUlkICE9PSAnc3RyaW5nJyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbGVJZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21hcFsgZmlsZUlkIF07XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDku47pmJ/liJfkuK3lj5blh7rkuIDkuKrmjIflrprnirbmgIHnmoTmlofku7bjgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGZldGNoKCBzdGF0dXMgKSA9PiBGaWxlXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGZldGNoXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RhdHVzIFvmlofku7bnirbmgIHlgLxdKCNXZWJVcGxvYWRlcjpGaWxlOkZpbGUuU3RhdHVzKVxuICAgICAgICAgICAgICogQHJldHVybiB7RmlsZX0gW0ZpbGVdKCNXZWJVcGxvYWRlcjpGaWxlKVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmZXRjaDogZnVuY3Rpb24oIHN0YXR1cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gdGhpcy5fcXVldWUubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBpLCBmaWxlO1xuICAgIFxuICAgICAgICAgICAgICAgIHN0YXR1cyA9IHN0YXR1cyB8fCBTVEFUVVMuUVVFVUVEO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSB0aGlzLl9xdWV1ZVsgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cyA9PT0gZmlsZS5nZXRTdGF0dXMoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5a+56Zif5YiX6L+b6KGM5o6S5bqP77yM6IO95aSf5o6n5Yi25paH5Lu25LiK5Lyg6aG65bqP44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBzb3J0KCBmbiApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQG1ldGhvZCBzb3J0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiDmjpLluo/mlrnms5VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc29ydDogZnVuY3Rpb24oIGZuICkge1xuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9xdWV1ZS5zb3J0KCBmbiApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiOt+WPluaMh+Wumuexu+Wei+eahOaWh+S7tuWIl+ihqCwg5YiX6KGo5Lit5q+P5LiA5Liq5oiQ5ZGY5Li6W0ZpbGVdKCNXZWJVcGxvYWRlcjpGaWxlKeWvueixoeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgZ2V0RmlsZXMoIFtzdGF0dXMxWywgc3RhdHVzMiAuLi5dXSApID0+IEFycmF5XG4gICAgICAgICAgICAgKiBAbWV0aG9kIGdldEZpbGVzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3N0YXR1c10gW+aWh+S7tueKtuaAgeWAvF0oI1dlYlVwbG9hZGVyOkZpbGU6RmlsZS5TdGF0dXMpXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEZpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RzID0gW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAwICksXG4gICAgICAgICAgICAgICAgICAgIHJldCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gdGhpcy5fcXVldWUubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBmaWxlO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlID0gdGhpcy5fcXVldWVbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzdHMubGVuZ3RoICYmICF+JC5pbkFycmF5KCBmaWxlLmdldFN0YXR1cygpLCBzdHMgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX2ZpbGVBZGRlZDogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmcgPSB0aGlzLl9tYXBbIGZpbGUuaWQgXTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFleGlzdGluZyApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFwWyBmaWxlLmlkIF0gPSBmaWxlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmaWxlLm9uKCAnc3RhdHVzY2hhbmdlJywgZnVuY3Rpb24oIGN1ciwgcHJlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX29uRmlsZVN0YXR1c0NoYW5nZSggY3VyLCBwcmUgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTVEFUVVMuUVVFVUVEICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX29uRmlsZVN0YXR1c0NoYW5nZTogZnVuY3Rpb24oIGN1clN0YXR1cywgcHJlU3RhdHVzICkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0cyA9IHRoaXMuc3RhdHM7XG4gICAgXG4gICAgICAgICAgICAgICAgc3dpdGNoICggcHJlU3RhdHVzICkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5QUk9HUkVTUzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mUHJvZ3Jlc3MtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5RVUVVRUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlF1ZXVlIC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLkVSUk9SOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZVcGxvYWRGYWlsZWQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5JTlZBTElEOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZJbnZhbGlkLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgc3dpdGNoICggY3VyU3RhdHVzICkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5RVUVVRUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlF1ZXVlKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuUFJPR1JFU1M6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlByb2dyZXNzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuRVJST1I6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlVwbG9hZEZhaWxlZCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLkNPTVBMRVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZTdWNjZXNzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuQ0FOQ0VMTEVEOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZDYW5jZWwrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5JTlZBTElEOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZJbnZhbGlkKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIFF1ZXVlLnByb3RvdHlwZSApO1xuICAgIFxuICAgICAgICByZXR1cm4gUXVldWU7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDpmJ/liJdcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvcXVldWUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAncXVldWUnLFxuICAgICAgICAnZmlsZScsXG4gICAgICAgICdsaWIvZmlsZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCcsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIsIFF1ZXVlLCBXVUZpbGUsIEZpbGUsIFJ1bnRpbWVDbGllbnQgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgckV4dCA9IC9cXC5cXHcrJC8sXG4gICAgICAgICAgICBTdGF0dXMgPSBXVUZpbGUuU3RhdHVzO1xuICAgIFxuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgJ3NvcnQtZmlsZXMnOiAnc29ydEZpbGVzJyxcbiAgICAgICAgICAgICdhZGQtZmlsZSc6ICdhZGRGaWxlcycsXG4gICAgICAgICAgICAnZ2V0LWZpbGUnOiAnZ2V0RmlsZScsXG4gICAgICAgICAgICAnZmV0Y2gtZmlsZSc6ICdmZXRjaEZpbGUnLFxuICAgICAgICAgICAgJ2dldC1zdGF0cyc6ICdnZXRTdGF0cycsXG4gICAgICAgICAgICAnZ2V0LWZpbGVzJzogJ2dldEZpbGVzJyxcbiAgICAgICAgICAgICdyZW1vdmUtZmlsZSc6ICdyZW1vdmVGaWxlJyxcbiAgICAgICAgICAgICdyZXRyeSc6ICdyZXRyeScsXG4gICAgICAgICAgICAncmVzZXQnOiAncmVzZXQnLFxuICAgICAgICAgICAgJ2FjY2VwdC1maWxlJzogJ2FjY2VwdEZpbGUnXG4gICAgICAgIH0sIHtcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLCBsZW4sIGksIGl0ZW0sIGFyciwgYWNjZXB0LCBydW50aW1lO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggJC5pc1BsYWluT2JqZWN0KCBvcHRzLmFjY2VwdCApICkge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmFjY2VwdCA9IFsgb3B0cy5hY2NlcHQgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gYWNjZXB05Lit55qE5Lit55Sf5oiQ5Yy56YWN5q2j5YiZ44CCXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLmFjY2VwdCApIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyID0gW107XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsZW4gPSBvcHRzLmFjY2VwdC5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBvcHRzLmFjY2VwdFsgaSBdLmV4dGVuc2lvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtICYmIGFyci5wdXNoKCBpdGVtICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhcnIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0ID0gJ1xcXFwuJyArIGFyci5qb2luKCcsJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoIC8sL2csICckfFxcXFwuJyApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCAvXFwqL2csICcuKicgKSArICckJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBtZS5hY2NlcHQgPSBuZXcgUmVnRXhwKCBhY2NlcHQsICdpJyApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5xdWV1ZSA9IG5ldyBRdWV1ZSgpO1xuICAgICAgICAgICAgICAgIG1lLnN0YXRzID0gbWUucXVldWUuc3RhdHM7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5b2T5YmN5LiN5pivaHRtbDXov5DooYzml7bvvIzpgqPlsLHnrpfkuobjgIJcbiAgICAgICAgICAgICAgICAvLyDkuI3miafooYzlkI7nu63mk43kvZxcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucmVxdWVzdCgncHJlZGljdC1ydW50aW1lLXR5cGUnKSAhPT0gJ2h0bWw1JyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDliJvlu7rkuIDkuKogaHRtbDUg6L+Q6KGM5pe255qEIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgICAgLy8g5Lul6Iez5LqO5aSW6YOo5re75Yqg5Y6f55SfIEZpbGUg5a+56LGh55qE5pe25YCZ6IO95q2j56Gu5YyF6KO55LiA5LiL5L6bIHdlYnVwbG9hZGVyIOS9v+eUqOOAglxuICAgICAgICAgICAgICAgIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgICAgIHJ1bnRpbWUgPSBuZXcgUnVudGltZUNsaWVudCgnUGxhY2Vob2xkZXInKTtcbiAgICAgICAgICAgICAgICBydW50aW1lLmNvbm5lY3RSdW50aW1lKHtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZU9yZGVyOiAnaHRtbDUnXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLl9ydWlkID0gcnVudGltZS5nZXRSdWlkKCk7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8vIOS4uuS6huaUr+aMgeWklumDqOebtOaOpea3u+WKoOS4gOS4quWOn+eUn0ZpbGXlr7nosaHjgIJcbiAgICAgICAgICAgIF93cmFwRmlsZTogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAhKGZpbGUgaW5zdGFuY2VvZiBXVUZpbGUpICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoICEoZmlsZSBpbnN0YW5jZW9mIEZpbGUpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhdGhpcy5fcnVpZCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhblxcJ3QgYWRkIGV4dGVybmFsIGZpbGVzLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSA9IG5ldyBGaWxlKCB0aGlzLl9ydWlkLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IG5ldyBXVUZpbGUoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g5Yik5pat5paH5Lu25piv5ZCm5Y+v5Lul6KKr5Yqg5YWl6Zif5YiXXG4gICAgICAgICAgICBhY2NlcHRGaWxlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgaW52YWxpZCA9ICFmaWxlIHx8IGZpbGUuc2l6ZSA8IDYgfHwgdGhpcy5hY2NlcHQgJiZcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOWQjeWtl+S4reacieWQjue8gO+8jOaJjeWBmuWQjue8gOeZveWQjeWNleWkhOeQhuOAglxuICAgICAgICAgICAgICAgICAgICAgICAgckV4dC5leGVjKCBmaWxlLm5hbWUgKSAmJiAhdGhpcy5hY2NlcHQudGVzdCggZmlsZS5uYW1lICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuICFpbnZhbGlkO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IGJlZm9yZUZpbGVRdWV1ZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5paH5Lu26KKr5Yqg5YWl6Zif5YiX5LmL5YmN6Kem5Y+R77yM5q2k5LqL5Lu255qEaGFuZGxlcui/lOWbnuWAvOS4umBmYWxzZWDvvIzliJnmraTmlofku7bkuI3kvJrooqvmt7vliqDov5vlhaXpmJ/liJfjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IGZpbGVRdWV1ZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5paH5Lu26KKr5Yqg5YWl6Zif5YiX5Lul5ZCO6Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICBfYWRkRmlsZTogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlID0gbWUuX3dyYXBGaWxlKCBmaWxlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5LiN6L+H57G75Z6L5Yik5pat5YWB6K645LiN5YWB6K6477yM5YWI5rS+6YCBIGBiZWZvcmVGaWxlUXVldWVkYFxuICAgICAgICAgICAgICAgIGlmICggIW1lLm93bmVyLnRyaWdnZXIoICdiZWZvcmVGaWxlUXVldWVkJywgZmlsZSApICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOexu+Wei+S4jeWMuemFje+8jOWImea0vumAgemUmeivr+S6i+S7tu+8jOW5tui/lOWbnuOAglxuICAgICAgICAgICAgICAgIGlmICggIW1lLmFjY2VwdEZpbGUoIGZpbGUgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ2Vycm9yJywgJ1FfVFlQRV9ERU5JRUQnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucXVldWUuYXBwZW5kKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ2ZpbGVRdWV1ZWQnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0RmlsZTogZnVuY3Rpb24oIGZpbGVJZCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5nZXRGaWxlKCBmaWxlSWQgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCBmaWxlc1F1ZXVlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlcyDmlbDnu4TvvIzlhoXlrrnkuLrljp/lp4tGaWxlKGxpYi9GaWxl77yJ5a+56LGh44CCXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5LiA5om55paH5Lu25re75Yqg6L+b6Zif5YiX5Lul5ZCO6Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgYWRkRmlsZXNcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGFkZEZpbGVzKCBmaWxlICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBhZGRGaWxlcyggW2ZpbGUxLCBmaWxlMiAuLi5dICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0FycmF5IG9mIEZpbGUgb3IgRmlsZX0gW2ZpbGVzXSBGaWxlcyDlr7nosaEg5pWw57uEXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5re75Yqg5paH5Lu25Yiw6Zif5YiXXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhZGRGaWxlczogZnVuY3Rpb24oIGZpbGVzICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhZmlsZXMubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlcyA9IFsgZmlsZXMgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZXMgPSAkLm1hcCggZmlsZXMsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUuX2FkZEZpbGUoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAnZmlsZXNRdWV1ZWQnLCBmaWxlcyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggbWUub3B0aW9ucy5hdXRvICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5yZXF1ZXN0KCdzdGFydC11cGxvYWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0U3RhdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IGZpbGVEZXF1ZXVlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmlofku7booqvnp7vpmaTpmJ/liJflkI7op6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCByZW1vdmVGaWxlXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZW1vdmVGaWxlKCBmaWxlICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZW1vdmVGaWxlKCBpZCApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfGlkfSBmaWxlIEZpbGXlr7nosaHmiJbov5lGaWxl5a+56LGh55qEaWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDnp7vpmaTmn5DkuIDmlofku7bjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICRsaS5vbignY2xpY2snLCAnLnJlbW92ZS10aGlzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgKiAgICAgdXBsb2FkZXIucmVtb3ZlRmlsZSggZmlsZSApO1xuICAgICAgICAgICAgICogfSlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVtb3ZlRmlsZTogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlID0gZmlsZS5pZCA/IGZpbGUgOiBtZS5xdWV1ZS5nZXRGaWxlKCBmaWxlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5DQU5DRUxMRUQgKTtcbiAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAnZmlsZURlcXVldWVkJywgZmlsZSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCBnZXRGaWxlc1xuICAgICAgICAgICAgICogQGdyYW1tYXIgZ2V0RmlsZXMoKSA9PiBBcnJheVxuICAgICAgICAgICAgICogQGdyYW1tYXIgZ2V0RmlsZXMoIHN0YXR1czEsIHN0YXR1czIsIHN0YXR1cy4uLiApID0+IEFycmF5XG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6L+U5Zue5oyH5a6a54q25oCB55qE5paH5Lu26ZuG5ZCI77yM5LiN5Lyg5Y+C5pWw5bCG6L+U5Zue5omA5pyJ54q25oCB55qE5paH5Lu244CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCB1cGxvYWRlci5nZXRGaWxlcygpICk7ICAgIC8vID0+IGFsbCBmaWxlc1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIHVwbG9hZGVyLmdldEZpbGVzKCdlcnJvcicpICkgICAgLy8gPT4gYWxsIGVycm9yIGZpbGVzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRGaWxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuZ2V0RmlsZXMuYXBwbHkoIHRoaXMucXVldWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGZldGNoRmlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuZmV0Y2guYXBwbHkoIHRoaXMucXVldWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCByZXRyeVxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmV0cnkoKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJldHJ5KCBmaWxlICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6YeN6K+V5LiK5Lyg77yM6YeN6K+V5oyH5a6a5paH5Lu277yM5oiW6ICF5LuO5Ye66ZSZ55qE5paH5Lu25byA5aeL6YeN5paw5LiK5Lyg44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIHJldHJ5KCkge1xuICAgICAgICAgICAgICogICAgIHVwbG9hZGVyLnJldHJ5KCk7XG4gICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJldHJ5OiBmdW5jdGlvbiggZmlsZSwgbm9Gb3JjZVN0YXJ0ICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLCBpLCBsZW47XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlID0gZmlsZS5pZCA/IGZpbGUgOiBtZS5xdWV1ZS5nZXRGaWxlKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuUVVFVUVEICk7XG4gICAgICAgICAgICAgICAgICAgIG5vRm9yY2VTdGFydCB8fCBtZS5yZXF1ZXN0KCdzdGFydC11cGxvYWQnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlcyA9IG1lLnF1ZXVlLmdldEZpbGVzKCBTdGF0dXMuRVJST1IgKTtcbiAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgICAgICBsZW4gPSBmaWxlcy5sZW5ndGg7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlc1sgaSBdO1xuICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLlFVRVVFRCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5yZXF1ZXN0KCdzdGFydC11cGxvYWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc29ydFxuICAgICAgICAgICAgICogQGdyYW1tYXIgc29ydCggZm4gKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmjpLluo/pmJ/liJfkuK3nmoTmlofku7bvvIzlnKjkuIrkvKDkuYvliY3osIPmlbTlj6/ku6XmjqfliLbkuIrkvKDpobrluo/jgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNvcnRGaWxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuc29ydC5hcHBseSggdGhpcy5xdWV1ZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHJlc2V0XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZXNldCgpID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOmHjee9rnVwbG9hZGVy44CC55uu5YmN5Y+q6YeN572u5LqG6Zif5YiX44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHVwbG9hZGVyLnJlc2V0KCk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnF1ZXVlID0gbmV3IFF1ZXVlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0cyA9IHRoaXMucXVldWUuc3RhdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5re75Yqg6I635Y+WUnVudGltZeebuOWFs+S/oeaBr+eahOaWueazleOAglxuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9ydW50aW1lJyxbXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdydW50aW1lL3J1bnRpbWUnLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIFVwbG9hZGVyLCBSdW50aW1lICkge1xuICAgIFxuICAgICAgICBVcGxvYWRlci5zdXBwb3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gUnVudGltZS5oYXNSdW50aW1lLmFwcGx5KCBSdW50aW1lLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICdwcmVkaWN0LXJ1bnRpbWUtdHlwZSc6ICdwcmVkaWN0UnVudG1lVHlwZSdcbiAgICAgICAgfSwge1xuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAhdGhpcy5wcmVkaWN0UnVudG1lVHlwZSgpICkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignUnVudGltZSBFcnJvcicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOmihOa1i1VwbG9hZGVy5bCG6YeH55So5ZOq5LiqYFJ1bnRpbWVgXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBwcmVkaWN0UnVudG1lVHlwZSgpID0+IFN0cmluZ1xuICAgICAgICAgICAgICogQG1ldGhvZCBwcmVkaWN0UnVudG1lVHlwZVxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcHJlZGljdFJ1bnRtZVR5cGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcmRlcnMgPSB0aGlzLm9wdGlvbnMucnVudGltZU9yZGVyIHx8IFJ1bnRpbWUub3JkZXJzLFxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gdGhpcy50eXBlLFxuICAgICAgICAgICAgICAgICAgICBpLCBsZW47XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhdHlwZSApIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJzID0gb3JkZXJzLnNwbGl0KCAvXFxzKixcXHMqL2cgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGxlbiA9IG9yZGVycy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggUnVudGltZS5oYXNSdW50aW1lKCBvcmRlcnNbIGkgXSApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IHR5cGUgPSBvcmRlcnNbIGkgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBUcmFuc3BvcnRcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi90cmFuc3BvcnQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9jbGllbnQnLFxuICAgICAgICAnbWVkaWF0b3InXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFJ1bnRpbWVDbGllbnQsIE1lZGlhdG9yICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gVHJhbnNwb3J0KCBvcHRzICkge1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zID0gJC5leHRlbmQoIHRydWUsIHt9LCBUcmFuc3BvcnQub3B0aW9ucywgb3B0cyB8fCB7fSApO1xuICAgICAgICAgICAgUnVudGltZUNsaWVudC5jYWxsKCB0aGlzLCAnVHJhbnNwb3J0JyApO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5fYmxvYiA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRGF0YSA9IG9wdHMuZm9ybURhdGEgfHwge307XG4gICAgICAgICAgICB0aGlzLl9oZWFkZXJzID0gb3B0cy5oZWFkZXJzIHx8IHt9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5vbiggJ3Byb2dyZXNzJywgdGhpcy5fdGltZW91dCApO1xuICAgICAgICAgICAgdGhpcy5vbiggJ2xvYWQgZXJyb3InLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCAncHJvZ3Jlc3MnLCAxICk7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBtZS5fdGltZXIgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIFRyYW5zcG9ydC5vcHRpb25zID0ge1xuICAgICAgICAgICAgc2VydmVyOiAnJyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIFxuICAgICAgICAgICAgLy8g6Leo5Z+f5pe277yM5piv5ZCm5YWB6K645pC65bimY29va2llLCDlj6rmnIlodG1sNSBydW50aW1l5omN5pyJ5pWIXG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IGZhbHNlLFxuICAgICAgICAgICAgZmlsZVZhbDogJ2ZpbGUnLFxuICAgICAgICAgICAgdGltZW91dDogMiAqIDYwICogMTAwMCwgICAgLy8gMuWIhumSn1xuICAgICAgICAgICAgZm9ybURhdGE6IHt9LFxuICAgICAgICAgICAgaGVhZGVyczoge30sXG4gICAgICAgICAgICBzZW5kQXNCaW5hcnk6IGZhbHNlXG4gICAgICAgIH07XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBUcmFuc3BvcnQucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICAvLyDmt7vliqBCbG9iLCDlj6rog73mt7vliqDkuIDmrKHvvIzmnIDlkI7kuIDmrKHmnInmlYjjgIJcbiAgICAgICAgICAgIGFwcGVuZEJsb2I6IGZ1bmN0aW9uKCBrZXksIGJsb2IsIGZpbGVuYW1lICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggbWUuZ2V0UnVpZCgpICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5kaXNjb25uZWN0UnVudGltZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDov57mjqXliLBibG9i5b2S5bGe55qE5ZCM5LiA5LiqcnVudGltZS5cbiAgICAgICAgICAgICAgICBtZS5jb25uZWN0UnVudGltZSggYmxvYi5ydWlkLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuZXhlYygnaW5pdCcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLl9ibG9iID0gYmxvYjtcbiAgICAgICAgICAgICAgICBvcHRzLmZpbGVWYWwgPSBrZXkgfHwgb3B0cy5maWxlVmFsO1xuICAgICAgICAgICAgICAgIG9wdHMuZmlsZW5hbWUgPSBmaWxlbmFtZSB8fCBvcHRzLmZpbGVuYW1lO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOWFtuS7luWtl+autVxuICAgICAgICAgICAgYXBwZW5kOiBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICkge1xuICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCggdGhpcy5fZm9ybURhdGEsIGtleSApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Zvcm1EYXRhWyBrZXkgXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBzZXRSZXF1ZXN0SGVhZGVyOiBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICkge1xuICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCggdGhpcy5faGVhZGVycywga2V5ICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGVhZGVyc1sga2V5IF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgc2VuZDogZnVuY3Rpb24oIG1ldGhvZCApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4ZWMoICdzZW5kJywgbWV0aG9kICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGltZW91dCgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIHRoaXMuX3RpbWVyICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYygnYWJvcnQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICAgICAgICAgIHRoaXMuZXhlYygnZGVzdHJveScpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdFJ1bnRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRSZXNwb25zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYygnZ2V0UmVzcG9uc2UnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRSZXNwb25zZUFzSnNvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYygnZ2V0UmVzcG9uc2VBc0pzb24nKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMoJ2dldFN0YXR1cycpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF90aW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IG1lLm9wdGlvbnMudGltZW91dDtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFkdXJhdGlvbiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIG1lLl90aW1lciApO1xuICAgICAgICAgICAgICAgIG1lLl90aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoICdlcnJvcicsICd0aW1lb3V0JyApO1xuICAgICAgICAgICAgICAgIH0sIGR1cmF0aW9uICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvLyDorqlUcmFuc3BvcnTlhbflpIfkuovku7blip/og73jgIJcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBUcmFuc3BvcnQucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIHJldHVybiBUcmFuc3BvcnQ7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDotJ/otKPmlofku7bkuIrkvKDnm7jlhbPjgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvdXBsb2FkJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ2ZpbGUnLFxuICAgICAgICAnbGliL3RyYW5zcG9ydCcsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIsIFdVRmlsZSwgVHJhbnNwb3J0ICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIGlzUHJvbWlzZSA9IEJhc2UuaXNQcm9taXNlLFxuICAgICAgICAgICAgU3RhdHVzID0gV1VGaWxlLlN0YXR1cztcbiAgICBcbiAgICAgICAgLy8g5re75Yqg6buY6K6k6YWN572u6aG5XG4gICAgICAgICQuZXh0ZW5kKCBVcGxvYWRlci5vcHRpb25zLCB7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gW3ByZXBhcmVOZXh0RmlsZT1mYWxzZV1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaYr+WQpuWFgeiuuOWcqOaWh+S7tuS8oOi+k+aXtuaPkOWJjeaKiuS4i+S4gOS4quaWh+S7tuWHhuWkh+WlveOAglxuICAgICAgICAgICAgICog5a+55LqO5LiA5Liq5paH5Lu255qE5YeG5aSH5bel5L2c5q+U6L6D6ICX5pe277yM5q+U5aaC5Zu+54mH5Y6L57yp77yMbWQ15bqP5YiX5YyW44CCXG4gICAgICAgICAgICAgKiDlpoLmnpzog73mj5DliY3lnKjlvZPliY3mlofku7bkvKDovpPmnJ/lpITnkIbvvIzlj6/ku6XoioLnnIHmgLvkvZPogJfml7bjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcHJlcGFyZU5leHRGaWxlOiBmYWxzZSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCb29sZWFufSBbY2h1bmtlZD1mYWxzZV1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaYr+WQpuimgeWIhueJh+WkhOeQhuWkp+aWh+S7tuS4iuS8oOOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjaHVua2VkOiBmYWxzZSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCb29sZWFufSBbY2h1bmtTaXplPTUyNDI4ODBdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlpoLmnpzopoHliIbniYfvvIzliIblpJrlpKfkuIDniYfvvJ8g6buY6K6k5aSn5bCP5Li6NU0uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNodW5rU2l6ZTogNSAqIDEwMjQgKiAxMDI0LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFtjaHVua1JldHJ5PTJdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlpoLmnpzmn5DkuKrliIbniYfnlLHkuo7nvZHnu5zpl67popjlh7rplJnvvIzlhYHorrjoh6rliqjph43kvKDlpJrlsJHmrKHvvJ9cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2h1bmtSZXRyeTogMixcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCb29sZWFufSBbdGhyZWFkcz0zXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5LiK5Lyg5bm25Y+R5pWw44CC5YWB6K645ZCM5pe25pyA5aSn5LiK5Lyg6L+b56iL5pWw44CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRocmVhZHM6IDMsXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbZm9ybURhdGFdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmlofku7bkuIrkvKDor7fmsYLnmoTlj4LmlbDooajvvIzmr4/mrKHlj5HpgIHpg73kvJrlj5HpgIHmraTlr7nosaHkuK3nmoTlj4LmlbDjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZm9ybURhdGE6IG51bGxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtmaWxlVmFsPSdmaWxlJ11cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOiuvue9ruaWh+S7tuS4iuS8oOWfn+eahG5hbWXjgIJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW21ldGhvZD0nUE9TVCddXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmlofku7bkuIrkvKDmlrnlvI/vvIxgUE9TVGDmiJbogIVgR0VUYOOAglxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbc2VuZEFzQmluYXJ5PWZhbHNlXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5piv5ZCm5bey5LqM6L+b5Yi255qE5rWB55qE5pa55byP5Y+R6YCB5paH5Lu277yM6L+Z5qC35pW05Liq5LiK5Lyg5YaF5a65YHBocDovL2lucHV0YOmDveS4uuaWh+S7tuWGheWuue+8jFxuICAgICAgICAgICAgICog5YW25LuW5Y+C5pWw5ZyoJF9HRVTmlbDnu4TkuK3jgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLy8g6LSf6LSj5bCG5paH5Lu25YiH54mH44CCXG4gICAgICAgIGZ1bmN0aW9uIEN1dGVGaWxlKCBmaWxlLCBjaHVua1NpemUgKSB7XG4gICAgICAgICAgICB2YXIgcGVuZGluZyA9IFtdLFxuICAgICAgICAgICAgICAgIGJsb2IgPSBmaWxlLnNvdXJjZSxcbiAgICAgICAgICAgICAgICB0b3RhbCA9IGJsb2Iuc2l6ZSxcbiAgICAgICAgICAgICAgICBjaHVua3MgPSBjaHVua1NpemUgPyBNYXRoLmNlaWwoIHRvdGFsIC8gY2h1bmtTaXplICkgOiAxLFxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gMCxcbiAgICAgICAgICAgICAgICBpbmRleCA9IDAsXG4gICAgICAgICAgICAgICAgbGVuO1xuICAgIFxuICAgICAgICAgICAgd2hpbGUgKCBpbmRleCA8IGNodW5rcyApIHtcbiAgICAgICAgICAgICAgICBsZW4gPSBNYXRoLm1pbiggY2h1bmtTaXplLCB0b3RhbCAtIHN0YXJ0ICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcGVuZGluZy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICBlbmQ6IGNodW5rU2l6ZSA/IChzdGFydCArIGxlbikgOiB0b3RhbCxcbiAgICAgICAgICAgICAgICAgICAgdG90YWw6IHRvdGFsLFxuICAgICAgICAgICAgICAgICAgICBjaHVua3M6IGNodW5rcyxcbiAgICAgICAgICAgICAgICAgICAgY2h1bms6IGluZGV4KytcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzdGFydCArPSBsZW47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBmaWxlLmJsb2NrcyA9IHBlbmRpbmcuY29uY2F0KCk7XG4gICAgICAgICAgICBmaWxlLnJlbWFuaW5nID0gcGVuZGluZy5sZW5ndGg7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgXG4gICAgICAgICAgICAgICAgaGFzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICEhcGVuZGluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgICAgICBmZXRjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwZW5kaW5nLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICAnc3RhcnQtdXBsb2FkJzogJ3N0YXJ0JyxcbiAgICAgICAgICAgICdzdG9wLXVwbG9hZCc6ICdzdG9wJyxcbiAgICAgICAgICAgICdza2lwLWZpbGUnOiAnc2tpcEZpbGUnLFxuICAgICAgICAgICAgJ2lzLWluLXByb2dyZXNzJzogJ2lzSW5Qcm9ncmVzcydcbiAgICAgICAgfSwge1xuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG93bmVyID0gdGhpcy5vd25lcjtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bmluZyA9IGZhbHNlO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOiusOW9leW9k+WJjeato+WcqOS8oOeahOaVsOaNru+8jOi3n3RocmVhZHPnm7jlhbNcbiAgICAgICAgICAgICAgICB0aGlzLnBvb2wgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDnvJPlrZjljbPlsIbkuIrkvKDnmoTmlofku7bjgIJcbiAgICAgICAgICAgICAgICB0aGlzLnBlbmRpbmcgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDot5/ouKrov5jmnInlpJrlsJHliIbniYfmsqHmnInlrozmiJDkuIrkvKDjgIJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbWFuaW5nID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9fdGljayA9IEJhc2UuYmluZEZuKCB0aGlzLl90aWNrLCB0aGlzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgb3duZXIub24oICd1cGxvYWRDb21wbGV0ZScsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAvLyDmiorlhbbku5blnZflj5bmtojkuobjgIJcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5ibG9ja3MgJiYgJC5lYWNoKCBmaWxlLmJsb2NrcywgZnVuY3Rpb24oIF8sIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2LnRyYW5zcG9ydCAmJiAodi50cmFuc3BvcnQuYWJvcnQoKSwgdi50cmFuc3BvcnQuZGVzdHJveSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2LnRyYW5zcG9ydDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBmaWxlLmJsb2NrcztcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGZpbGUucmVtYW5pbmc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgc3RhcnRVcGxvYWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPlvIDlp4vkuIrkvKDmtYHnqIvml7bop6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5byA5aeL5LiK5Lyg44CC5q2k5pa55rOV5Y+v5Lul5LuO5Yid5aeL54q25oCB6LCD55So5byA5aeL5LiK5Lyg5rWB56iL77yM5Lmf5Y+v5Lul5LuO5pqC5YGc54q25oCB6LCD55So77yM57un57ut5LiK5Lyg5rWB56iL44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciB1cGxvYWQoKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2QgdXBsb2FkXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDnp7vlh7ppbnZhbGlk55qE5paH5Lu2XG4gICAgICAgICAgICAgICAgJC5lYWNoKCBtZS5yZXF1ZXN0KCAnZ2V0LWZpbGVzJywgU3RhdHVzLklOVkFMSUQgKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnJlcXVlc3QoICdyZW1vdmUtZmlsZScsIHRoaXMgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG1lLnJ1bmluZyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5ydW5pbmcgPSB0cnVlO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOacieaaguWBnOeahO+8jOWImee7reS8oFxuICAgICAgICAgICAgICAgICQuZWFjaCggbWUucG9vbCwgZnVuY3Rpb24oIF8sIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlID0gdi5maWxlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGZpbGUuZ2V0U3RhdHVzKCkgPT09IFN0YXR1cy5JTlRFUlJVUFQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLlBST0dSRVNTICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdi50cmFuc3BvcnQgJiYgdi50cmFuc3BvcnQuc2VuZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX3RyaWdnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCdzdGFydFVwbG9hZCcpO1xuICAgICAgICAgICAgICAgIEJhc2UubmV4dFRpY2soIG1lLl9fdGljayApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHN0b3BVcGxvYWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPlvIDlp4vkuIrkvKDmtYHnqIvmmoLlgZzml7bop6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5pqC5YGc5LiK5Lyg44CC56ys5LiA5Liq5Y+C5pWw5Li65piv5ZCm5Lit5pat5LiK5Lyg5b2T5YmN5q2j5Zyo5LiK5Lyg55qE5paH5Lu244CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBzdG9wKCkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBzdG9wKCB0cnVlICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHN0b3BcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHN0b3A6IGZ1bmN0aW9uKCBpbnRlcnJ1cHQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG1lLnJ1bmluZyA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucnVuaW5nID0gZmFsc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgaW50ZXJydXB0ICYmICQuZWFjaCggbWUucG9vbCwgZnVuY3Rpb24oIF8sIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgIHYudHJhbnNwb3J0ICYmIHYudHJhbnNwb3J0LmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIHYuZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5JTlRFUlJVUFQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCdzdG9wVXBsb2FkJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDliKTmlq1gVXBsYW9kZWBy5piv5ZCm5q2j5Zyo5LiK5Lyg5Lit44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBpc0luUHJvZ3Jlc3MoKSA9PiBCb29sZWFuXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGlzSW5Qcm9ncmVzc1xuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNJblByb2dyZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISF0aGlzLnJ1bmluZztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTdGF0czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdCgnZ2V0LXN0YXRzJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmjonov4fkuIDkuKrmlofku7bkuIrkvKDvvIznm7TmjqXmoIforrDmjIflrprmlofku7bkuLrlt7LkuIrkvKDnirbmgIHjgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHNraXBGaWxlKCBmaWxlICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHNraXBGaWxlXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBza2lwRmlsZTogZnVuY3Rpb24oIGZpbGUsIHN0YXR1cyApIHtcbiAgICAgICAgICAgICAgICBmaWxlID0gdGhpcy5yZXF1ZXN0KCAnZ2V0LWZpbGUnLCBmaWxlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIHN0YXR1cyB8fCBTdGF0dXMuQ09NUExFVEUgKTtcbiAgICAgICAgICAgICAgICBmaWxlLnNraXBwZWQgPSB0cnVlO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOato+WcqOS4iuS8oOOAglxuICAgICAgICAgICAgICAgIGZpbGUuYmxvY2tzICYmICQuZWFjaCggZmlsZS5ibG9ja3MsIGZ1bmN0aW9uKCBfLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX3RyID0gdi50cmFuc3BvcnQ7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggX3RyICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdHIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYudHJhbnNwb3J0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5vd25lci50cmlnZ2VyKCAndXBsb2FkU2tpcCcsIGZpbGUgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRGaW5pc2hlZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aJgOacieaWh+S7tuS4iuS8oOe7k+adn+aXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgX3RpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBmbiwgdmFsO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOS4iuS4gOS4qnByb21pc2Xov5jmsqHmnInnu5PmnZ/vvIzliJnnrYnlvoXlrozmiJDlkI7lho3miafooYzjgIJcbiAgICAgICAgICAgICAgICBpZiAoIG1lLl9wcm9taXNlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUuX3Byb21pc2UuYWx3YXlzKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6L+Y5pyJ5L2N572u77yM5LiU6L+Y5pyJ5paH5Lu26KaB5aSE55CG55qE6K+d44CCXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5wb29sLmxlbmd0aCA8IG9wdHMudGhyZWFkcyAmJiAodmFsID0gbWUuX25leHRCbG9jaygpKSApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3RyaWdnZWQgPSBmYWxzZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm4gPSBmdW5jdGlvbiggdmFsICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Byb21pc2UgPSBudWxsO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5Y+v6IO95pivcmVqZWN06L+H5p2l55qE77yM5omA5Lul6KaB5qOA5rWLdmFs55qE57G75Z6L44CCXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgJiYgdmFsLmZpbGUgJiYgbWUuX3N0YXJ0U2VuZCggdmFsICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBCYXNlLm5leHRUaWNrKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuX3Byb21pc2UgPSBpc1Byb21pc2UoIHZhbCApID8gdmFsLmFsd2F5cyggZm4gKSA6IGZuKCB2YWwgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDmsqHmnInopoHkuIrkvKDnmoTkuobvvIzkuJTmsqHmnInmraPlnKjkvKDovpPnmoTkuobjgIJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAhbWUucmVtYW5pbmcgJiYgIW1lLmdldFN0YXRzKCkubnVtT2ZRdWV1ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucnVuaW5nID0gZmFsc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG1lLl90cmlnZ2VkIHx8IEJhc2UubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCd1cGxvYWRGaW5pc2hlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3RyaWdnZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfbmV4dEJsb2NrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBhY3QgPSBtZS5fYWN0LFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgbmV4dCwgZG9uZTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzlvZPliY3mlofku7bov5jmnInmsqHmnInpnIDopoHkvKDovpPnmoTvvIzliJnnm7TmjqXov5Tlm57liankuIvnmoTjgIJcbiAgICAgICAgICAgICAgICBpZiAoIGFjdCAmJiBhY3QuaGFzKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdC5maWxlLmdldFN0YXR1cygpID09PSBTdGF0dXMuUFJPR1JFU1MgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOaYr+WQpuaPkOWJjeWHhuWkh+S4i+S4gOS4quaWh+S7tlxuICAgICAgICAgICAgICAgICAgICBpZiAoIG9wdHMucHJlcGFyZU5leHRGaWxlICYmICFtZS5wZW5kaW5nLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wcmVwYXJlTmV4dEZpbGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0LmZldGNoKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5ZCm5YiZ77yM5aaC5p6c5q2j5Zyo6L+Q6KGM77yM5YiZ5YeG5aSH5LiL5LiA5Liq5paH5Lu277yM5bm2562J5b6F5a6M5oiQ5ZCO6L+U5Zue5LiL5Liq5YiG54mH44CCXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggbWUucnVuaW5nICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpznvJPlrZjkuK3mnInvvIzliJnnm7TmjqXlnKjnvJPlrZjkuK3lj5bvvIzmsqHmnInliJnljrtxdWV1ZeS4reWPluOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoICFtZS5wZW5kaW5nLmxlbmd0aCAmJiBtZS5nZXRTdGF0cygpLm51bU9mUXVldWUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcHJlcGFyZU5leHRGaWxlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbmV4dCA9IG1lLnBlbmRpbmcuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZG9uZSA9IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdCA9IEN1dGVGaWxlKCBmaWxlLCBvcHRzLmNodW5rZWQgPyBvcHRzLmNodW5rU2l6ZSA6IDAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9hY3QgPSBhY3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0LmZldGNoKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOaWh+S7tuWPr+iDvei/mOWcqHByZXBhcmXkuK3vvIzkuZ/mnInlj6/og73lt7Lnu4/lrozlhajlh4blpIflpb3kuobjgIJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzUHJvbWlzZSggbmV4dCApID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0WyBuZXh0LnBpcGUgPyAncGlwZScgOiAndGhlbiddKCBkb25lICkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoIG5leHQgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkU3RhcnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5p+Q5Liq5paH5Lu25byA5aeL5LiK5Lyg5YmN6Kem5Y+R77yM5LiA5Liq5paH5Lu25Y+q5Lya6Kem5Y+R5LiA5qyh44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBfcHJlcGFyZU5leHRGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gbWUucmVxdWVzdCgnZmV0Y2gtZmlsZScpLFxuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nID0gbWUucGVuZGluZyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UgPSBtZS5yZXF1ZXN0KCAnYmVmb3JlLXNlbmQtZmlsZScsIGZpbGUsIGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5Y+v6IO95paH5Lu26KKrc2tpcOaOieS6huOAguaWh+S7tuiiq3NraXDmjonlkI7vvIznirbmgIHlnZHlrprkuI3mmK9RdWV1ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGZpbGUuZ2V0U3RhdHVzKCkgPT09IFN0YXR1cy5RVUVVRUQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ3VwbG9hZFN0YXJ0JywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuUFJPR1JFU1MgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5fZmluaXNoRmlsZSggZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c6L+Y5ZyocGVuZGluZ+S4re+8jOWImeabv+aNouaIkOaWh+S7tuacrOi6q+OAglxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gJC5pbkFycmF5KCBwcm9taXNlLCBwZW5kaW5nICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB+aWR4ICYmIHBlbmRpbmcuc3BsaWNlKCBpZHgsIDEsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIGJlZmVvcmUtc2VuZC1maWxl55qE6ZKp5a2Q5bCx5pyJ6ZSZ6K+v5Y+R55Sf44CCXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UuZmFpbChmdW5jdGlvbiggcmVhc29uICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5FUlJPUiwgcmVhc29uICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAndXBsb2FkRXJyb3InLCBmaWxlLCByZWFzb24gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICd1cGxvYWRDb21wbGV0ZScsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmcucHVzaCggcHJvbWlzZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDorqnlh7rkvY3nva7kuobvvIzlj6/ku6Xorqnlhbbku5bliIbniYflvIDlp4vkuIrkvKBcbiAgICAgICAgICAgIF9wb3BCbG9jazogZnVuY3Rpb24oIGJsb2NrICkge1xuICAgICAgICAgICAgICAgIHZhciBpZHggPSAkLmluQXJyYXkoIGJsb2NrLCB0aGlzLnBvb2wgKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLnBvb2wuc3BsaWNlKCBpZHgsIDEgKTtcbiAgICAgICAgICAgICAgICBibG9jay5maWxlLnJlbWFuaW5nLS07XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1hbmluZy0tO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOW8gOWni+S4iuS8oO+8jOWPr+S7peiiq+aOiei/h+OAguWmguaenHByb21pc2XooqtyZWplY3TkuobvvIzliJnooajnpLrot7Pov4fmraTliIbniYfjgIJcbiAgICAgICAgICAgIF9zdGFydFNlbmQ6IGZ1bmN0aW9uKCBibG9jayApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gYmxvY2suZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5wb29sLnB1c2goIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgbWUucmVtYW5pbmcrKztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmsqHmnInliIbniYfvvIzliJnnm7TmjqXkvb/nlKjljp/lp4vnmoTjgIJcbiAgICAgICAgICAgICAgICAvLyDkuI3kvJrkuKLlpLFjb250ZW50LXR5cGXkv6Hmga/jgIJcbiAgICAgICAgICAgICAgICBibG9jay5ibG9iID0gYmxvY2suY2h1bmtzID09PSAxID8gZmlsZS5zb3VyY2UgOlxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zb3VyY2Uuc2xpY2UoIGJsb2NrLnN0YXJ0LCBibG9jay5lbmQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBob29rLCDmr4/kuKrliIbniYflj5HpgIHkuYvliY3lj6/og73opoHlgZrkupvlvILmraXnmoTkuovmg4XjgIJcbiAgICAgICAgICAgICAgICBwcm9taXNlID0gbWUucmVxdWVzdCggJ2JlZm9yZS1zZW5kJywgYmxvY2ssIGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDmnInlj6/og73mlofku7blt7Lnu4/kuIrkvKDlh7rplJnkuobvvIzmiYDku6XkuI3pnIDopoHlho3kvKDovpPkuobjgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlLmdldFN0YXR1cygpID09PSBTdGF0dXMuUFJPR1JFU1MgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fZG9TZW5kKCBibG9jayApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3BvcEJsb2NrKCBibG9jayApO1xuICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzkuLpmYWls5LqG77yM5YiZ6Lez6L+H5q2k5YiG54mH44CCXG4gICAgICAgICAgICAgICAgcHJvbWlzZS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGZpbGUucmVtYW5pbmcgPT09IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fZmluaXNoRmlsZSggZmlsZSApLmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9jay5wZXJjZW50YWdlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5fcG9wQmxvY2soIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ3VwbG9hZENvbXBsZXRlJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJhc2UubmV4dFRpY2soIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9jay5wZXJjZW50YWdlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wb3BCbG9jayggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEJhc2UubmV4dFRpY2soIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkQmVmb3JlU2VuZFxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEg6buY6K6k55qE5LiK5Lyg5Y+C5pWw77yM5Y+v5Lul5omp5bGV5q2k5a+56LGh5p2l5o6n5Yi25LiK5Lyg5Y+C5pWw44CCXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5p+Q5Liq5paH5Lu255qE5YiG5Z2X5Zyo5Y+R6YCB5YmN6Kem5Y+R77yM5Li76KaB55So5p2l6K+i6Zeu5piv5ZCm6KaB5re75Yqg6ZmE5bim5Y+C5pWw77yM5aSn5paH5Lu25Zyo5byA6LW35YiG54mH5LiK5Lyg55qE5YmN5o+Q5LiL5q2k5LqL5Lu25Y+v6IO95Lya6Kem5Y+R5aSa5qyh44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRBY2NlcHRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXQg5pyN5Yqh56uv55qE6L+U5Zue5pWw5o2u77yManNvbuagvOW8j++8jOWmguaenOacjeWKoeerr+S4jeaYr2pzb27moLzlvI/vvIzku45yZXQuX3Jhd+S4reWPluaVsOaNru+8jOiHquihjOino+aekOOAglxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+afkOS4quaWh+S7tuS4iuS8oOWIsOacjeWKoeerr+WTjeW6lOWQju+8jOS8mua0vumAgeatpOS6i+S7tuadpeivoumXruacjeWKoeerr+WTjeW6lOaYr+WQpuacieaViOOAguWmguaenOatpOS6i+S7tmhhbmRsZXLov5Tlm57lgLzkuLpgZmFsc2VgLCDliJnmraTmlofku7blsIbmtL7pgIFgc2VydmVyYOexu+Wei+eahGB1cGxvYWRFcnJvcmDkuovku7bjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZFByb2dyZXNzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IHBlcmNlbnRhZ2Ug5LiK5Lyg6L+b5bqmXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5LiK5Lyg6L+H56iL5Lit6Kem5Y+R77yM5pC65bim5LiK5Lyg6L+b5bqm44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRFcnJvclxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSByZWFzb24g5Ye66ZSZ55qEY29kZVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aWh+S7tuS4iuS8oOWHuumUmeaXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkU3VjY2Vzc1xuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSDmnI3liqHnq6/ov5Tlm57nmoTmlbDmja5cbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmlofku7bkuIrkvKDmiJDlip/ml7bop6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZENvbXBsZXRlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IFtmaWxlXSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5LiN566h5oiQ5Yqf5oiW6ICF5aSx6LSl77yM5paH5Lu25LiK5Lyg5a6M5oiQ5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvLyDlgZrkuIrkvKDmk43kvZzjgIJcbiAgICAgICAgICAgIF9kb1NlbmQ6IGZ1bmN0aW9uKCBibG9jayApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvd25lciA9IG1lLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGJsb2NrLmZpbGUsXG4gICAgICAgICAgICAgICAgICAgIHRyID0gbmV3IFRyYW5zcG9ydCggb3B0cyApLFxuICAgICAgICAgICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoe30sIG9wdHMuZm9ybURhdGEgKSxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVycyA9ICQuZXh0ZW5kKHt9LCBvcHRzLmhlYWRlcnMgKSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFjY2VwdCwgcmV0O1xuICAgIFxuICAgICAgICAgICAgICAgIGJsb2NrLnRyYW5zcG9ydCA9IHRyO1xuICAgIFxuICAgICAgICAgICAgICAgIHRyLm9uKCAnZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgYmxvY2sudHJhbnNwb3J0O1xuICAgICAgICAgICAgICAgICAgICBtZS5fcG9wQmxvY2soIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgICAgIEJhc2UubmV4dFRpY2soIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOW5v+aSreS4iuS8oOi/m+W6puOAguS7peaWh+S7tuS4uuWNleS9jeOAglxuICAgICAgICAgICAgICAgIHRyLm9uKCAncHJvZ3Jlc3MnLCBmdW5jdGlvbiggcGVyY2VudGFnZSApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvdGFsUGVyY2VudCA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRlZCA9IDA7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWPr+iDveayoeaciWFib3J05o6J77yMcHJvZ3Jlc3Pov5jmmK/miafooYzov5vmnaXkuobjgIJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCAhZmlsZS5ibG9ja3MgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdG90YWxQZXJjZW50ID0gYmxvY2sucGVyY2VudGFnZSA9IHBlcmNlbnRhZ2U7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggYmxvY2suY2h1bmtzID4gMSApIHsgICAgLy8g6K6h566X5paH5Lu255qE5pW05L2T6YCf5bqm44CCXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goIGZpbGUuYmxvY2tzLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRlZCArPSAodi5wZXJjZW50YWdlIHx8IDApICogKHYuZW5kIC0gdi5zdGFydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUGVyY2VudCA9IHVwbG9hZGVkIC8gZmlsZS5zaXplO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG93bmVyLnRyaWdnZXIoICd1cGxvYWRQcm9ncmVzcycsIGZpbGUsIHRvdGFsUGVyY2VudCB8fCAwICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g55So5p2l6K+i6Zeu77yM5piv5ZCm6L+U5Zue55qE57uT5p6c5piv5pyJ6ZSZ6K+v55qE44CCXG4gICAgICAgICAgICAgICAgcmVxdWVzdEFjY2VwdCA9IGZ1bmN0aW9uKCByZWplY3QgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gdHIuZ2V0UmVzcG9uc2VBc0pzb24oKSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgcmV0Ll9yYXcgPSB0ci5nZXRSZXNwb25zZSgpO1xuICAgICAgICAgICAgICAgICAgICBmbiA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDmnI3liqHnq6/lk43lupTkuobvvIzkuI3ku6PooajmiJDlip/kuobvvIzor6Lpl67mmK/lkKblk43lupTmraPnoa7jgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhb3duZXIudHJpZ2dlciggJ3VwbG9hZEFjY2VwdCcsIGJsb2NrLCByZXQsIGZuICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QgPSByZWplY3QgfHwgJ3NlcnZlcic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdDtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWwneivlemHjeivle+8jOeEtuWQjuW5v+aSreaWh+S7tuS4iuS8oOWHuumUmeOAglxuICAgICAgICAgICAgICAgIHRyLm9uKCAnZXJyb3InLCBmdW5jdGlvbiggdHlwZSwgZmxhZyApIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2sucmV0cmllZCA9IGJsb2NrLnJldHJpZWQgfHwgMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g6Ieq5Yqo6YeN6K+VXG4gICAgICAgICAgICAgICAgICAgIGlmICggYmxvY2suY2h1bmtzID4gMSAmJiB+J2h0dHAsYWJvcnQnLmluZGV4T2YoIHR5cGUgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnJldHJpZWQgPCBvcHRzLmNodW5rUmV0cnkgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBibG9jay5yZXRyaWVkKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ci5zZW5kKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBodHRwIHN0YXR1cyA1MDAgfiA2MDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIWZsYWcgJiYgdHlwZSA9PT0gJ3NlcnZlcicgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHJlcXVlc3RBY2NlcHQoIHR5cGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuRVJST1IsIHR5cGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyLnRyaWdnZXIoICd1cGxvYWRFcnJvcicsIGZpbGUsIHR5cGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyLnRyaWdnZXIoICd1cGxvYWRDb21wbGV0ZScsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOS4iuS8oOaIkOWKn1xuICAgICAgICAgICAgICAgIHRyLm9uKCAnbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVhc29uO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzpnZ7pooTmnJ/vvIzovazlkJHkuIrkvKDlh7rplJnjgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAocmVhc29uID0gcmVxdWVzdEFjY2VwdCgpKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyLnRyaWdnZXIoICdlcnJvcicsIHJlYXNvbiwgdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWFqOmDqOS4iuS8oOWujOaIkOOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoIGZpbGUucmVtYW5pbmcgPT09IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fZmluaXNoRmlsZSggZmlsZSwgcmV0ICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDphY3nva7pu5jorqTnmoTkuIrkvKDlrZfmrrXjgIJcbiAgICAgICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoIGRhdGEsIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlsZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICBsYXN0TW9kaWZpZWREYXRlOiBmaWxlLmxhc3RNb2RpZmllZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGJsb2NrLmNodW5rcyA+IDEgJiYgJC5leHRlbmQoIGRhdGEsIHtcbiAgICAgICAgICAgICAgICAgICAgY2h1bmtzOiBibG9jay5jaHVua3MsXG4gICAgICAgICAgICAgICAgICAgIGNodW5rOiBibG9jay5jaHVua1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWcqOWPkemAgeS5i+mXtOWPr+S7pea3u+WKoOWtl+auteS7gOS5iOeahOOAguOAguOAglxuICAgICAgICAgICAgICAgIC8vIOWmguaenOm7mOiupOeahOWtl+auteS4jeWkn+S9v+eUqO+8jOWPr+S7pemAmui/h+ebkeWQrOatpOS6i+S7tuadpeaJqeWxlVxuICAgICAgICAgICAgICAgIG93bmVyLnRyaWdnZXIoICd1cGxvYWRCZWZvcmVTZW5kJywgYmxvY2ssIGRhdGEsIGhlYWRlcnMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlvIDlp4vlj5HpgIHjgIJcbiAgICAgICAgICAgICAgICB0ci5hcHBlbmRCbG9iKCBvcHRzLmZpbGVWYWwsIGJsb2NrLmJsb2IsIGZpbGUubmFtZSApO1xuICAgICAgICAgICAgICAgIHRyLmFwcGVuZCggZGF0YSApO1xuICAgICAgICAgICAgICAgIHRyLnNldFJlcXVlc3RIZWFkZXIoIGhlYWRlcnMgKTtcbiAgICAgICAgICAgICAgICB0ci5zZW5kKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g5a6M5oiQ5LiK5Lyg44CCXG4gICAgICAgICAgICBfZmluaXNoRmlsZTogZnVuY3Rpb24oIGZpbGUsIHJldCwgaGRzICkge1xuICAgICAgICAgICAgICAgIHZhciBvd25lciA9IHRoaXMub3duZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG93bmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVxdWVzdCggJ2FmdGVyLXNlbmQtZmlsZScsIGFyZ3VtZW50cywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5DT01QTEVURSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyLnRyaWdnZXIoICd1cGxvYWRTdWNjZXNzJywgZmlsZSwgcmV0LCBoZHMgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiggcmVhc29uICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOWklumDqOW3sue7j+agh+iusOS4umludmFsaWTku4DkuYjnmoTvvIzkuI3lho3mlLnnirbmgIHjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGZpbGUuZ2V0U3RhdHVzKCkgPT09IFN0YXR1cy5QUk9HUkVTUyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5FUlJPUiwgcmVhc29uICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyLnRyaWdnZXIoICd1cGxvYWRFcnJvcicsIGZpbGUsIHJlYXNvbiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZENvbXBsZXRlJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5ZCE56eN6aqM6K+B77yM5YyF5ous5paH5Lu25oC75aSn5bCP5piv5ZCm6LaF5Ye644CB5Y2V5paH5Lu25piv5ZCm6LaF5Ye65ZKM5paH5Lu25piv5ZCm6YeN5aSN44CCXG4gICAgICovXG4gICAgXG4gICAgZGVmaW5lKCd3aWRnZXRzL3ZhbGlkYXRvcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdmaWxlJyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgV1VGaWxlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHZhbGlkYXRvcnMgPSB7fSxcbiAgICAgICAgICAgIGFwaTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBldmVudCBlcnJvclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSDplJnor6/nsbvlnovjgIJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k3ZhbGlkYXRl5LiN6YCa6L+H5pe277yM5Lya5Lul5rS+6YCB6ZSZ6K+v5LqL5Lu255qE5b2i5byP6YCa55+l6LCD55So6ICF44CC6YCa6L+HYHVwbG9hZC5vbignZXJyb3InLCBoYW5kbGVyKWDlj6/ku6XmjZXojrfliLDmraTnsbvplJnor6/vvIznm67liY3mnInku6XkuIvplJnor6/kvJrlnKjnibnlrprnmoTmg4XlhrXkuIvmtL7pgIHplJnmnaXjgIJcbiAgICAgICAgICpcbiAgICAgICAgICogKiBgUV9FWENFRURfTlVNX0xJTUlUYCDlnKjorr7nva7kuoZgZmlsZU51bUxpbWl0YOS4lOWwneivlee7mWB1cGxvYWRlcmDmt7vliqDnmoTmlofku7bmlbDph4/otoXlh7rov5nkuKrlgLzml7bmtL7pgIHjgIJcbiAgICAgICAgICogKiBgUV9FWENFRURfU0laRV9MSU1JVGAg5Zyo6K6+572u5LqGYFFfRVhDRUVEX1NJWkVfTElNSVRg5LiU5bCd6K+V57uZYHVwbG9hZGVyYOa3u+WKoOeahOaWh+S7tuaAu+Wkp+Wwj+i2heWHuui/meS4quWAvOaXtua0vumAgeOAglxuICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgLy8g5pq06Zyy57uZ5aSW6Z2i55qEYXBpXG4gICAgICAgIGFwaSA9IHtcbiAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOmqjOivgeWZqFxuICAgICAgICAgICAgYWRkVmFsaWRhdG9yOiBmdW5jdGlvbiggdHlwZSwgY2IgKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc1sgdHlwZSBdID0gY2I7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g56e76Zmk6aqM6K+B5ZmoXG4gICAgICAgICAgICByZW1vdmVWYWxpZGF0b3I6IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB2YWxpZGF0b3JzWyB0eXBlIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOWcqFVwbG9hZGVy5Yid5aeL5YyW55qE5pe25YCZ5ZCv5YqoVmFsaWRhdG9yc+eahOWIneWni+WMllxuICAgICAgICBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgICAgICQuZWFjaCggdmFsaWRhdG9ycywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbCggbWUub3duZXIgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge2ludH0gW2ZpbGVOdW1MaW1pdD11bmRlZmluZWRdXG4gICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiDpqozor4Hmlofku7bmgLvmlbDph48sIOi2heWHuuWImeS4jeWFgeiuuOWKoOWFpemYn+WIl+OAglxuICAgICAgICAgKi9cbiAgICAgICAgYXBpLmFkZFZhbGlkYXRvciggJ2ZpbGVOdW1MaW1pdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcyxcbiAgICAgICAgICAgICAgICBvcHRzID0gdXBsb2FkZXIub3B0aW9ucyxcbiAgICAgICAgICAgICAgICBjb3VudCA9IDAsXG4gICAgICAgICAgICAgICAgbWF4ID0gb3B0cy5maWxlTnVtTGltaXQgPj4gMCxcbiAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIW1heCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2JlZm9yZUZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGNvdW50ID49IG1heCAmJiBmbGFnICkge1xuICAgICAgICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ2Vycm9yJywgJ1FfRVhDRUVEX05VTV9MSU1JVCcsIG1heCwgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0sIDEgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvdW50ID49IG1heCA/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgdXBsb2FkZXIub24oICdmaWxlUXVldWVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgdXBsb2FkZXIub24oICdmaWxlRGVxdWV1ZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb3VudC0tO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ3VwbG9hZEZpbmlzaGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY291bnQgPSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIFxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQHByb3BlcnR5IHtpbnR9IFtmaWxlU2l6ZUxpbWl0PXVuZGVmaW5lZF1cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOmqjOivgeaWh+S7tuaAu+Wkp+Wwj+aYr+WQpui2heWHuumZkOWItiwg6LaF5Ye65YiZ5LiN5YWB6K645Yqg5YWl6Zif5YiX44CCXG4gICAgICAgICAqL1xuICAgICAgICBhcGkuYWRkVmFsaWRhdG9yKCAnZmlsZVNpemVMaW1pdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcyxcbiAgICAgICAgICAgICAgICBvcHRzID0gdXBsb2FkZXIub3B0aW9ucyxcbiAgICAgICAgICAgICAgICBjb3VudCA9IDAsXG4gICAgICAgICAgICAgICAgbWF4ID0gb3B0cy5maWxlU2l6ZUxpbWl0ID4+IDAsXG4gICAgICAgICAgICAgICAgZmxhZyA9IHRydWU7XG4gICAgXG4gICAgICAgICAgICBpZiAoICFtYXggKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgdXBsb2FkZXIub24oICdiZWZvcmVGaWxlUXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludmFsaWQgPSBjb3VudCArIGZpbGUuc2l6ZSA+IG1heDtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGludmFsaWQgJiYgZmxhZyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoICdlcnJvcicsICdRX0VYQ0VFRF9TSVpFX0xJTUlUJywgbWF4LCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaW52YWxpZCA/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgdXBsb2FkZXIub24oICdmaWxlUXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgY291bnQgKz0gZmlsZS5zaXplO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVEZXF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIGNvdW50IC09IGZpbGUuc2l6ZTtcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgdXBsb2FkZXIub24oICd1cGxvYWRGaW5pc2hlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvdW50ID0gMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7aW50fSBbZmlsZVNpbmdsZVNpemVMaW1pdD11bmRlZmluZWRdXG4gICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiDpqozor4HljZXkuKrmlofku7blpKflsI/mmK/lkKbotoXlh7rpmZDliLYsIOi2heWHuuWImeS4jeWFgeiuuOWKoOWFpemYn+WIl+OAglxuICAgICAgICAgKi9cbiAgICAgICAgYXBpLmFkZFZhbGlkYXRvciggJ2ZpbGVTaW5nbGVTaXplTGltaXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMsXG4gICAgICAgICAgICAgICAgb3B0cyA9IHVwbG9hZGVyLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgbWF4ID0gb3B0cy5maWxlU2luZ2xlU2l6ZUxpbWl0O1xuICAgIFxuICAgICAgICAgICAgaWYgKCAhbWF4ICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnYmVmb3JlRmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZmlsZS5zaXplID4gbWF4ICkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggV1VGaWxlLlN0YXR1cy5JTlZBTElELCAnZXhjZWVkX3NpemUnICk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ2Vycm9yJywgJ0ZfRVhDRUVEX1NJWkUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge2ludH0gW2R1cGxpY2F0ZT11bmRlZmluZWRdXG4gICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiDljrvph43vvIwg5qC55o2u5paH5Lu25ZCN5a2X44CB5paH5Lu25aSn5bCP5ZKM5pyA5ZCO5L+u5pS55pe26Ze05p2l55Sf5oiQaGFzaCBLZXkuXG4gICAgICAgICAqL1xuICAgICAgICBhcGkuYWRkVmFsaWRhdG9yKCAnZHVwbGljYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLFxuICAgICAgICAgICAgICAgIG9wdHMgPSB1cGxvYWRlci5vcHRpb25zLFxuICAgICAgICAgICAgICAgIG1hcHBpbmcgPSB7fTtcbiAgICBcbiAgICAgICAgICAgIGlmICggb3B0cy5kdXBsaWNhdGUgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gaGFzaFN0cmluZyggc3RyICkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gMCxcbiAgICAgICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IHN0ci5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIF9jaGFyO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBfY2hhciA9IHN0ci5jaGFyQ29kZUF0KCBpICk7XG4gICAgICAgICAgICAgICAgICAgIGhhc2ggPSBfY2hhciArIChoYXNoIDw8IDYpICsgKGhhc2ggPDwgMTYpIC0gaGFzaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2JlZm9yZUZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IGZpbGUuX19oYXNoIHx8IChmaWxlLl9faGFzaCA9IGhhc2hTdHJpbmcoIGZpbGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNpemUgKyBmaWxlLmxhc3RNb2RpZmllZERhdGUgKSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5bey57uP6YeN5aSN5LqGXG4gICAgICAgICAgICAgICAgaWYgKCBtYXBwaW5nWyBoYXNoIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ2Vycm9yJywgJ0ZfRFVQTElDQVRFJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IGZpbGUuX19oYXNoO1xuICAgIFxuICAgICAgICAgICAgICAgIGhhc2ggJiYgKG1hcHBpbmdbIGhhc2ggXSA9IHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVEZXF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gZmlsZS5fX2hhc2g7XG4gICAgXG4gICAgICAgICAgICAgICAgaGFzaCAmJiAoZGVsZXRlIG1hcHBpbmdbIGhhc2ggXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIHJldHVybiBhcGk7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBSdW50aW1l566h55CG5Zmo77yM6LSf6LSjUnVudGltZeeahOmAieaLqSwg6L+e5o6lXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2NvbXBiYXNlJyxbXSxmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gQ29tcEJhc2UoIG93bmVyLCBydW50aW1lICkge1xuICAgIFxuICAgICAgICAgICAgdGhpcy5vd25lciA9IG93bmVyO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gb3duZXIub3B0aW9ucztcbiAgICBcbiAgICAgICAgICAgIHRoaXMuZ2V0UnVudGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBydW50aW1lO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuZ2V0UnVpZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBydW50aW1lLnVpZDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3duZXIudHJpZ2dlci5hcHBseSggb3duZXIsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4gQ29tcEJhc2U7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBIdG1sNVJ1bnRpbWVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvcnVudGltZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL3J1bnRpbWUnLFxuICAgICAgICAncnVudGltZS9jb21wYmFzZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZSwgQ29tcEJhc2UgKSB7XG4gICAgXG4gICAgICAgIHZhciB0eXBlID0gJ2h0bWw1JyxcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSB7fTtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gSHRtbDVSdW50aW1lKCkge1xuICAgICAgICAgICAgdmFyIHBvb2wgPSB7fSxcbiAgICAgICAgICAgICAgICBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgZGVzdG9yeSA9IHRoaXMuZGVzdG9yeTtcbiAgICBcbiAgICAgICAgICAgIFJ1bnRpbWUuYXBwbHkoIG1lLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIG1lLnR5cGUgPSB0eXBlO1xuICAgIFxuICAgIFxuICAgICAgICAgICAgLy8g6L+Z5Liq5pa55rOV55qE6LCD55So6ICF77yM5a6e6ZmF5LiK5pivUnVudGltZUNsaWVudFxuICAgICAgICAgICAgbWUuZXhlYyA9IGZ1bmN0aW9uKCBjb21wLCBmbi8qLCBhcmdzLi4uKi8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xpZW50ID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgdWlkID0gY2xpZW50LnVpZCxcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cywgMiApLFxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGNvbXBvbmVudHNbIGNvbXAgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBwb29sWyB1aWQgXSA9IHBvb2xbIHVpZCBdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IGNvbXBvbmVudHNbIGNvbXAgXSggY2xpZW50LCBtZSApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluc3RhbmNlWyBmbiBdICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlWyBmbiBdLmFwcGx5KCBpbnN0YW5jZSwgYXJncyApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIG1lLmRlc3RvcnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBAdG9kbyDliKDpmaTmsaDlrZDkuK3nmoTmiYDmnInlrp7kvotcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVzdG9yeSAmJiBkZXN0b3J5LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgQmFzZS5pbmhlcml0cyggUnVudGltZSwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IEh0bWw1UnVudGltZSxcbiAgICBcbiAgICAgICAgICAgIC8vIOS4jemcgOimgei/nuaOpeWFtuS7lueoi+W6j++8jOebtOaOpeaJp+ihjGNhbGxiYWNrXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gICAgICAgICAgICAgICAgfSwgMSApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLy8g5rOo5YaMQ29tcG9uZW50c1xuICAgICAgICBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIgPSBmdW5jdGlvbiggbmFtZSwgY29tcG9uZW50ICkge1xuICAgICAgICAgICAgdmFyIGtsYXNzID0gY29tcG9uZW50c1sgbmFtZSBdID0gQmFzZS5pbmhlcml0cyggQ29tcEJhc2UsIGNvbXBvbmVudCApO1xuICAgICAgICAgICAgcmV0dXJuIGtsYXNzO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyDms6jlhoxodG1sNei/kOihjOaXtuOAglxuICAgICAgICAvLyDlj6rmnInlnKjmlK/mjIHnmoTliY3mj5DkuIvms6jlhozjgIJcbiAgICAgICAgaWYgKCB3aW5kb3cuQmxvYiAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRGF0YVZpZXcgKSB7XG4gICAgICAgICAgICBSdW50aW1lLmFkZFJ1bnRpbWUoIHR5cGUsIEh0bWw1UnVudGltZSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWU7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBCbG9iIEh0bWzlrp7njrBcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvYmxvYicsW1xuICAgICAgICAncnVudGltZS9odG1sNS9ydW50aW1lJyxcbiAgICAgICAgJ2xpYi9ibG9iJ1xuICAgIF0sIGZ1bmN0aW9uKCBIdG1sNVJ1bnRpbWUsIEJsb2IgKSB7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdCbG9iJywge1xuICAgICAgICAgICAgc2xpY2U6IGZ1bmN0aW9uKCBzdGFydCwgZW5kICkge1xuICAgICAgICAgICAgICAgIHZhciBibG9iID0gdGhpcy5vd25lci5zb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgIHNsaWNlID0gYmxvYi5zbGljZSB8fCBibG9iLndlYmtpdFNsaWNlIHx8IGJsb2IubW96U2xpY2U7XG4gICAgXG4gICAgICAgICAgICAgICAgYmxvYiA9IHNsaWNlLmNhbGwoIGJsb2IsIHN0YXJ0LCBlbmQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJsb2IoIHRoaXMuZ2V0UnVpZCgpLCBibG9iICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRmlsZVBhc3RlXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2RuZCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAnbGliL2ZpbGUnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEh0bWw1UnVudGltZSwgRmlsZSApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICBwcmVmaXggPSAnd2VidXBsb2FkZXItZG5kLSc7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdEcmFnQW5kRHJvcCcsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gdGhpcy5lbGVtID0gdGhpcy5vcHRpb25zLmNvbnRhaW5lcjtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdFbnRlckhhbmRsZXIgPSBCYXNlLmJpbmRGbiggdGhpcy5fZHJhZ0VudGVySGFuZGxlciwgdGhpcyApO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ092ZXJIYW5kbGVyID0gQmFzZS5iaW5kRm4oIHRoaXMuX2RyYWdPdmVySGFuZGxlciwgdGhpcyApO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ0xlYXZlSGFuZGxlciA9IEJhc2UuYmluZEZuKCB0aGlzLl9kcmFnTGVhdmVIYW5kbGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wSGFuZGxlciA9IEJhc2UuYmluZEZuKCB0aGlzLl9kcm9wSGFuZGxlciwgdGhpcyApO1xuICAgICAgICAgICAgICAgIHRoaXMuZG5kT3ZlciA9IGZhbHNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGVsZW0ub24oICdkcmFnZW50ZXInLCB0aGlzLmRyYWdFbnRlckhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9uKCAnZHJhZ292ZXInLCB0aGlzLmRyYWdPdmVySGFuZGxlciApO1xuICAgICAgICAgICAgICAgIGVsZW0ub24oICdkcmFnbGVhdmUnLCB0aGlzLmRyYWdMZWF2ZUhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9uKCAnZHJvcCcsIHRoaXMuZHJvcEhhbmRsZXIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMub3B0aW9ucy5kaXNhYmxlR2xvYmFsRG5kICkge1xuICAgICAgICAgICAgICAgICAgICAkKCBkb2N1bWVudCApLm9uKCAnZHJhZ292ZXInLCB0aGlzLmRyYWdPdmVySGFuZGxlciApO1xuICAgICAgICAgICAgICAgICAgICAkKCBkb2N1bWVudCApLm9uKCAnZHJvcCcsIHRoaXMuZHJvcEhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX2RyYWdFbnRlckhhbmRsZXI6IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGRlbmllZCA9IG1lLl9kZW5pZWQgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zO1xuICAgIFxuICAgICAgICAgICAgICAgIGUgPSBlLm9yaWdpbmFsRXZlbnQgfHwgZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFtZS5kbmRPdmVyICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5kbmRPdmVyID0gdHJ1ZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5rOo5oSP5Y+q5pyJIGNocm9tZSDmlK/mjIHjgIJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMgPSBlLmRhdGFUcmFuc2Zlci5pdGVtcztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpdGVtcyAmJiBpdGVtcy5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fZGVuaWVkID0gZGVuaWVkID0gIW1lLnRyaWdnZXIoICdhY2NlcHQnLCBpdGVtcyApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG1lLmVsZW0uYWRkQ2xhc3MoIHByZWZpeCArICdvdmVyJyApO1xuICAgICAgICAgICAgICAgICAgICBtZS5lbGVtWyBkZW5pZWQgPyAnYWRkQ2xhc3MnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncmVtb3ZlQ2xhc3MnIF0oIHByZWZpeCArICdkZW5pZWQnICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgIFxuICAgICAgICAgICAgICAgIGUuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBkZW5pZWQgPyAnbm9uZScgOiAnY29weSc7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9kcmFnT3ZlckhhbmRsZXI6IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgIC8vIOWPquWkhOeQhuahhuWGheeahOOAglxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRFbGVtID0gdGhpcy5lbGVtLnBhcmVudCgpLmdldCggMCApO1xuICAgICAgICAgICAgICAgIGlmICggcGFyZW50RWxlbSAmJiAhJC5jb250YWlucyggcGFyZW50RWxlbSwgZS5jdXJyZW50VGFyZ2V0ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCB0aGlzLl9sZWF2ZVRpbWVyICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZHJhZ0VudGVySGFuZGxlci5jYWxsKCB0aGlzLCBlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9kcmFnTGVhdmVIYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyO1xuICAgIFxuICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuZG5kT3ZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBtZS5lbGVtLnJlbW92ZUNsYXNzKCBwcmVmaXggKyAnb3ZlciAnICsgcHJlZml4ICsgJ2RlbmllZCcgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggbWUuX2xlYXZlVGltZXIgKTtcbiAgICAgICAgICAgICAgICBtZS5fbGVhdmVUaW1lciA9IHNldFRpbWVvdXQoIGhhbmRsZXIsIDEwMCApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfZHJvcEhhbmRsZXI6IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHJ1aWQgPSBtZS5nZXRSdWlkKCksXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW0gPSBtZS5lbGVtLnBhcmVudCgpLmdldCggMCApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWPquWkhOeQhuahhuWGheeahOOAglxuICAgICAgICAgICAgICAgIGlmICggcGFyZW50RWxlbSAmJiAhJC5jb250YWlucyggcGFyZW50RWxlbSwgZS5jdXJyZW50VGFyZ2V0ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX2dldFRhbnNmZXJGaWxlcyggZSwgZnVuY3Rpb24oIHJlc3VsdHMgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoICdkcm9wJywgJC5tYXAoIHJlc3VsdHMsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGaWxlKCBydWlkLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH0pICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuZG5kT3ZlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIG1lLmVsZW0ucmVtb3ZlQ2xhc3MoIHByZWZpeCArICdvdmVyJyApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDlpoLmnpzkvKDlhaUgY2FsbGJhY2sg5YiZ5Y675p+l55yL5paH5Lu25aS577yM5ZCm5YiZ5Y+q566h5b2T5YmN5paH5Lu25aS544CCXG4gICAgICAgICAgICBfZ2V0VGFuc2ZlckZpbGVzOiBmdW5jdGlvbiggZSwgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgID0gW10sXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLCBmaWxlcywgZGF0YVRyYW5zZmVyLCBmaWxlLCBpdGVtLCBpLCBsZW4sIGNhbkFjY2Vzc0ZvbGRlcjtcbiAgICBcbiAgICAgICAgICAgICAgICBlID0gZS5vcmlnaW5hbEV2ZW50IHx8IGU7XG4gICAgXG4gICAgICAgICAgICAgICAgZGF0YVRyYW5zZmVyID0gZS5kYXRhVHJhbnNmZXI7XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBkYXRhVHJhbnNmZXIuaXRlbXM7XG4gICAgICAgICAgICAgICAgZmlsZXMgPSBkYXRhVHJhbnNmZXIuZmlsZXM7XG4gICAgXG4gICAgICAgICAgICAgICAgY2FuQWNjZXNzRm9sZGVyID0gISEoaXRlbXMgJiYgaXRlbXNbIDAgXS53ZWJraXRHZXRBc0VudHJ5KTtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gZmlsZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlc1sgaSBdO1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbXMgJiYgaXRlbXNbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjYW5BY2Nlc3NGb2xkZXIgJiYgaXRlbS53ZWJraXRHZXRBc0VudHJ5KCkuaXNEaXJlY3RvcnkgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKCB0aGlzLl90cmF2ZXJzZURpcmVjdG9yeVRyZWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ud2Via2l0R2V0QXNFbnRyeSgpLCByZXN1bHRzICkgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCggZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIEJhc2Uud2hlbi5hcHBseSggQmFzZSwgcHJvbWlzZXMgKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoICFyZXN1bHRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayggcmVzdWx0cyApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF90cmF2ZXJzZURpcmVjdG9yeVRyZWU6IGZ1bmN0aW9uKCBlbnRyeSwgcmVzdWx0cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCksXG4gICAgICAgICAgICAgICAgICAgIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGVudHJ5LmlzRmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgZW50cnkuZmlsZShmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCggZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBlbnRyeS5pc0RpcmVjdG9yeSApIHtcbiAgICAgICAgICAgICAgICAgICAgZW50cnkuY3JlYXRlUmVhZGVyKCkucmVhZEVudHJpZXMoZnVuY3Rpb24oIGVudHJpZXMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gZW50cmllcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBbXSwgICAgLy8g5Li65LqG5L+d6K+B6aG65bqP44CCXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaCggbWUuX3RyYXZlcnNlRGlyZWN0b3J5VHJlZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJpZXNbIGkgXSwgYXJyICkgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIEJhc2Uud2hlbi5hcHBseSggQmFzZSwgcHJvbWlzZXMgKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaC5hcHBseSggcmVzdWx0cywgYXJyICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZGVmZXJyZWQucmVqZWN0ICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gdGhpcy5lbGVtO1xuICAgIFxuICAgICAgICAgICAgICAgIGVsZW0ub2ZmKCAnZHJhZ2VudGVyJywgdGhpcy5kcmFnRW50ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgZWxlbS5vZmYoICdkcmFnb3ZlcicsIHRoaXMuZHJhZ0VudGVySGFuZGxlciApO1xuICAgICAgICAgICAgICAgIGVsZW0ub2ZmKCAnZHJhZ2xlYXZlJywgdGhpcy5kcmFnTGVhdmVIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgZWxlbS5vZmYoICdkcm9wJywgdGhpcy5kcm9wSGFuZGxlciApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5vcHRpb25zLmRpc2FibGVHbG9iYWxEbmQgKSB7XG4gICAgICAgICAgICAgICAgICAgICQoIGRvY3VtZW50ICkub2ZmKCAnZHJhZ292ZXInLCB0aGlzLmRyYWdPdmVySGFuZGxlciApO1xuICAgICAgICAgICAgICAgICAgICAkKCBkb2N1bWVudCApLm9mZiggJ2Ryb3AnLCB0aGlzLmRyb3BIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEZpbGVQYXN0ZVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9maWxlcGFzdGUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9odG1sNS9ydW50aW1lJyxcbiAgICAgICAgJ2xpYi9maWxlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBIdG1sNVJ1bnRpbWUsIEZpbGUgKSB7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdGaWxlUGFzdGUnLCB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXMuZWxlbSA9IG9wdHMuY29udGFpbmVyLFxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQgPSAnLionLFxuICAgICAgICAgICAgICAgICAgICBhcnIsIGksIGxlbiwgaXRlbTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBhY2NldHDnmoRtaW1lVHlwZXPkuK3nlJ/miJDljLnphY3mraPliJnjgIJcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuYWNjZXB0ICkge1xuICAgICAgICAgICAgICAgICAgICBhcnIgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGxlbiA9IG9wdHMuYWNjZXB0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IG9wdHMuYWNjZXB0WyBpIF0ubWltZVR5cGVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSAmJiBhcnIucHVzaCggaXRlbSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggYXJyLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdCA9IGFyci5qb2luKCcsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQgPSBhY2NlcHQucmVwbGFjZSggLywvZywgJ3wnICkucmVwbGFjZSggL1xcKi9nLCAnLionICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5hY2NlcHQgPSBhY2NlcHQgPSBuZXcgUmVnRXhwKCBhY2NlcHQsICdpJyApO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGVyID0gQmFzZS5iaW5kRm4oIHRoaXMuX3Bhc3RlSGFuZGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgZWxlbS5vbiggJ3Bhc3RlJywgdGhpcy5oYW5kZXIgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfcGFzdGVIYW5kZXI6IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgIHZhciBhbGxvd2VkID0gW10sXG4gICAgICAgICAgICAgICAgICAgIHJ1aWQgPSB0aGlzLmdldFJ1aWQoKSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMsIGl0ZW0sIGJsb2IsIGksIGxlbjtcbiAgICBcbiAgICAgICAgICAgICAgICBlID0gZS5vcmlnaW5hbEV2ZW50IHx8IGU7XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBlLmNsaXBib2FyZERhdGEuaXRlbXM7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGxlbiA9IGl0ZW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbXNbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpdGVtLmtpbmQgIT09ICdmaWxlJyB8fCAhKGJsb2IgPSBpdGVtLmdldEFzRmlsZSgpKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGFsbG93ZWQucHVzaCggbmV3IEZpbGUoIHJ1aWQsIGJsb2IgKSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGFsbG93ZWQubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAvLyDkuI3pmLvmraLpnZ7mlofku7bnspjotLTvvIjmloflrZfnspjotLTvvInnmoTkuovku7blhpLms6FcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoICdwYXN0ZScsIGFsbG93ZWQgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtLm9mZiggJ3Bhc3RlJywgdGhpcy5oYW5kZXIgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBGaWxlUGlja2VyXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2ZpbGVwaWNrZXInLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9odG1sNS9ydW50aW1lJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBIdG1sNVJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICByZXR1cm4gSHRtbDVSdW50aW1lLnJlZ2lzdGVyKCAnRmlsZVBpY2tlcicsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmdldFJ1bnRpbWUoKS5nZXRDb250YWluZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvd25lciA9IG1lLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgbGFibGUgPSAkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpICksXG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gJCggZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKSApLFxuICAgICAgICAgICAgICAgICAgICBhcnIsIGksIGxlbiwgbW91c2VIYW5kbGVyO1xuICAgIFxuICAgICAgICAgICAgICAgIGlucHV0LmF0dHIoICd0eXBlJywgJ2ZpbGUnICk7XG4gICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ25hbWUnLCBvcHRzLm5hbWUgKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5hZGRDbGFzcygnd2VidXBsb2FkZXItZWxlbWVudC1pbnZpc2libGUnKTtcbiAgICBcbiAgICAgICAgICAgICAgICBsYWJsZS5vbiggJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbGFibGUuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnI2ZmZmZmZidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMubXVsdGlwbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmF0dHIoICdtdWx0aXBsZScsICdtdWx0aXBsZScgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gQHRvZG8gRmlyZWZveOS4jeaUr+aMgeWNleeLrOaMh+WumuWQjue8gFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5hY2NlcHQgJiYgb3B0cy5hY2NlcHQubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyID0gW107XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsZW4gPSBvcHRzLmFjY2VwdC5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKCBvcHRzLmFjY2VwdFsgaSBdLm1pbWVUeXBlcyApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmF0dHIoICdhY2NlcHQnLCBhcnIuam9pbignLCcpICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQoIGlucHV0ICk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZCggbGFibGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBtb3VzZUhhbmRsZXIgPSBmdW5jdGlvbiggZSApIHtcbiAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggZS50eXBlICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbnB1dC5vbiggJ2NoYW5nZScsIGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBhcmd1bWVudHMuY2FsbGVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG1lLmZpbGVzID0gZS50YXJnZXQuZmlsZXM7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc2V0IGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGNsb25lID0gdGhpcy5jbG9uZU5vZGUoIHRydWUgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCggY2xvbmUsIHRoaXMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQub2ZmKCk7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gJCggY2xvbmUgKS5vbiggJ2NoYW5nZScsIGZuIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub24oICdtb3VzZWVudGVyIG1vdXNlbGVhdmUnLCBtb3VzZUhhbmRsZXIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbGFibGUub24oICdtb3VzZWVudGVyIG1vdXNlbGVhdmUnLCBtb3VzZUhhbmRsZXIgKTtcbiAgICBcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICBnZXRGaWxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsZXM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gdG9kb1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBUZXJtczpcbiAgICAgKlxuICAgICAqIFVpbnQ4QXJyYXksIEZpbGVSZWFkZXIsIEJsb2JCdWlsZGVyLCBhdG9iLCBBcnJheUJ1ZmZlclxuICAgICAqIEBmaWxlT3ZlcnZpZXcgSW1hZ2Xmjqfku7ZcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvdXRpbCcsW1xuICAgICAgICAnYmFzZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSApIHtcbiAgICBcbiAgICAgICAgdmFyIHVybEFQSSA9IHdpbmRvdy5jcmVhdGVPYmplY3RVUkwgJiYgd2luZG93IHx8XG4gICAgICAgICAgICAgICAgd2luZG93LlVSTCAmJiBVUkwucmV2b2tlT2JqZWN0VVJMICYmIFVSTCB8fFxuICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRVUkwsXG4gICAgICAgICAgICBjcmVhdGVPYmplY3RVUkwgPSBCYXNlLm5vb3AsXG4gICAgICAgICAgICByZXZva2VPYmplY3RVUkwgPSBjcmVhdGVPYmplY3RVUkw7XG4gICAgXG4gICAgICAgIGlmICggdXJsQVBJICkge1xuICAgIFxuICAgICAgICAgICAgLy8g5pu05a6J5YWo55qE5pa55byP6LCD55So77yM5q+U5aaCYW5kcm9pZOmHjOmdouWwseiDveaKimNvbnRleHTmlLnmiJDlhbbku5bnmoTlr7nosaHjgIJcbiAgICAgICAgICAgIGNyZWF0ZU9iamVjdFVSTCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxBUEkuY3JlYXRlT2JqZWN0VVJMLmFwcGx5KCB1cmxBUEksIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHJldm9rZU9iamVjdFVSTCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxBUEkucmV2b2tlT2JqZWN0VVJMLmFwcGx5KCB1cmxBUEksIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlT2JqZWN0VVJMOiBjcmVhdGVPYmplY3RVUkwsXG4gICAgICAgICAgICByZXZva2VPYmplY3RVUkw6IHJldm9rZU9iamVjdFVSTCxcbiAgICBcbiAgICAgICAgICAgIGRhdGFVUkwyQmxvYjogZnVuY3Rpb24oIGRhdGFVUkkgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ5dGVTdHIsIGludEFycmF5LCBhYiwgaSwgbWltZXR5cGUsIHBhcnRzO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhcnRzID0gZGF0YVVSSS5zcGxpdCgnLCcpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggfnBhcnRzWyAwIF0uaW5kZXhPZignYmFzZTY0JykgKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVTdHIgPSBhdG9iKCBwYXJ0c1sgMSBdICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZVN0ciA9IGRlY29kZVVSSUNvbXBvbmVudCggcGFydHNbIDEgXSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBhYiA9IG5ldyBBcnJheUJ1ZmZlciggYnl0ZVN0ci5sZW5ndGggKTtcbiAgICAgICAgICAgICAgICBpbnRBcnJheSA9IG5ldyBVaW50OEFycmF5KCBhYiApO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgYnl0ZVN0ci5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW50QXJyYXlbIGkgXSA9IGJ5dGVTdHIuY2hhckNvZGVBdCggaSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtaW1ldHlwZSA9IHBhcnRzWyAwIF0uc3BsaXQoJzonKVsgMSBdLnNwbGl0KCc7JylbIDAgXTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcnJheUJ1ZmZlclRvQmxvYiggYWIsIG1pbWV0eXBlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGF0YVVSTDJBcnJheUJ1ZmZlcjogZnVuY3Rpb24oIGRhdGFVUkkgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ5dGVTdHIsIGludEFycmF5LCBpLCBwYXJ0cztcbiAgICBcbiAgICAgICAgICAgICAgICBwYXJ0cyA9IGRhdGFVUkkuc3BsaXQoJywnKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIH5wYXJ0c1sgMCBdLmluZGV4T2YoJ2Jhc2U2NCcpICkge1xuICAgICAgICAgICAgICAgICAgICBieXRlU3RyID0gYXRvYiggcGFydHNbIDEgXSApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVTdHIgPSBkZWNvZGVVUklDb21wb25lbnQoIHBhcnRzWyAxIF0gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgaW50QXJyYXkgPSBuZXcgVWludDhBcnJheSggYnl0ZVN0ci5sZW5ndGggKTtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IGJ5dGVTdHIubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGludEFycmF5WyBpIF0gPSBieXRlU3RyLmNoYXJDb2RlQXQoIGkgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGludEFycmF5LmJ1ZmZlcjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBhcnJheUJ1ZmZlclRvQmxvYjogZnVuY3Rpb24oIGJ1ZmZlciwgdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVpbGRlciA9IHdpbmRvdy5CbG9iQnVpbGRlciB8fCB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIsXG4gICAgICAgICAgICAgICAgICAgIGJiO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGFuZHJvaWTkuI3mlK/mjIHnm7TmjqVuZXcgQmxvYiwg5Y+q6IO95YCf5YqpYmxvYmJ1aWxkZXIuXG4gICAgICAgICAgICAgICAgaWYgKCBidWlsZGVyICkge1xuICAgICAgICAgICAgICAgICAgICBiYiA9IG5ldyBidWlsZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgIGJiLmFwcGVuZCggYnVmZmVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiYi5nZXRCbG9iKCB0eXBlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYihbIGJ1ZmZlciBdLCB0eXBlID8geyB0eXBlOiB0eXBlIH0gOiB7fSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOaKveWHuuadpeS4u+imgeaYr+S4uuS6huino+WGs2FuZHJvaWTkuIvpnaJjYW52YXMudG9EYXRhVXJs5LiN5pSv5oyBanBlZy5cbiAgICAgICAgICAgIC8vIOS9oOW+l+WIsOeahOe7k+aenOaYr3BuZy5cbiAgICAgICAgICAgIGNhbnZhc1RvRGF0YVVybDogZnVuY3Rpb24oIGNhbnZhcywgdHlwZSwgcXVhbGl0eSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCggdHlwZSwgcXVhbGl0eSAvIDEwMCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIGltYWdlbWVhdOS8muWkjeWGmei/meS4quaWueazle+8jOWmguaenOeUqOaIt+mAieaLqeWKoOi9vemCo+S4quaWh+S7tuS6hueahOivneOAglxuICAgICAgICAgICAgcGFyc2VNZXRhOiBmdW5jdGlvbiggYmxvYiwgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soIGZhbHNlLCB7fSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gaW1hZ2VtZWF05Lya5aSN5YaZ6L+Z5Liq5pa55rOV77yM5aaC5p6c55So5oi36YCJ5oup5Yqg6L296YKj5Liq5paH5Lu25LqG55qE6K+d44CCXG4gICAgICAgICAgICB1cGRhdGVJbWFnZUhlYWQ6IGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIFRlcm1zOlxuICAgICAqXG4gICAgICogVWludDhBcnJheSwgRmlsZVJlYWRlciwgQmxvYkJ1aWxkZXIsIGF0b2IsIEFycmF5QnVmZmVyXG4gICAgICogQGZpbGVPdmVydmlldyBJbWFnZeaOp+S7tlxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9pbWFnZW1ldGEnLFtcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvdXRpbCdcbiAgICBdLCBmdW5jdGlvbiggVXRpbCApIHtcbiAgICBcbiAgICAgICAgdmFyIGFwaTtcbiAgICBcbiAgICAgICAgYXBpID0ge1xuICAgICAgICAgICAgcGFyc2Vyczoge1xuICAgICAgICAgICAgICAgIDB4ZmZlMTogW11cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBtYXhNZXRhRGF0YVNpemU6IDI2MjE0NCxcbiAgICBcbiAgICAgICAgICAgIHBhcnNlOiBmdW5jdGlvbiggYmxvYiwgY2IgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIFxuICAgICAgICAgICAgICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjYiggZmFsc2UsIG1lLl9wYXJzZSggdGhpcy5yZXN1bHQgKSApO1xuICAgICAgICAgICAgICAgICAgICBmciA9IGZyLm9ubG9hZCA9IGZyLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgZnIub25lcnJvciA9IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgICAgICBjYiggZS5tZXNzYWdlICk7XG4gICAgICAgICAgICAgICAgICAgIGZyID0gZnIub25sb2FkID0gZnIub25lcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBibG9iID0gYmxvYi5zbGljZSggMCwgbWUubWF4TWV0YURhdGFTaXplICk7XG4gICAgICAgICAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoIGJsb2IuZ2V0U291cmNlKCkgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfcGFyc2U6IGZ1bmN0aW9uKCBidWZmZXIsIG5vUGFyc2UgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBidWZmZXIuYnl0ZUxlbmd0aCA8IDYgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIGRhdGF2aWV3ID0gbmV3IERhdGFWaWV3KCBidWZmZXIgKSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gMixcbiAgICAgICAgICAgICAgICAgICAgbWF4T2Zmc2V0ID0gZGF0YXZpZXcuYnl0ZUxlbmd0aCAtIDQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRMZW5ndGggPSBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIHJldCA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBtYXJrZXJCeXRlcywgbWFya2VyTGVuZ3RoLCBwYXJzZXJzLCBpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZGF0YXZpZXcuZ2V0VWludDE2KCAwICkgPT09IDB4ZmZkOCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCBvZmZzZXQgPCBtYXhPZmZzZXQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJCeXRlcyA9IGRhdGF2aWV3LmdldFVpbnQxNiggb2Zmc2V0ICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG1hcmtlckJ5dGVzID49IDB4ZmZlMCAmJiBtYXJrZXJCeXRlcyA8PSAweGZmZWYgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyQnl0ZXMgPT09IDB4ZmZmZSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJMZW5ndGggPSBkYXRhdmlldy5nZXRVaW50MTYoIG9mZnNldCArIDIgKSArIDI7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBvZmZzZXQgKyBtYXJrZXJMZW5ndGggPiBkYXRhdmlldy5ieXRlTGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VycyA9IGFwaS5wYXJzZXJzWyBtYXJrZXJCeXRlcyBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIW5vUGFyc2UgJiYgcGFyc2VycyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBwYXJzZXJzLmxlbmd0aDsgaSArPSAxICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2Vyc1sgaSBdLmNhbGwoIGFwaSwgZGF0YXZpZXcsIG9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyTGVuZ3RoLCByZXQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gbWFya2VyTGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRMZW5ndGggPSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggaGVhZExlbmd0aCA+IDYgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGJ1ZmZlci5zbGljZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQuaW1hZ2VIZWFkID0gYnVmZmVyLnNsaWNlKCAyLCBoZWFkTGVuZ3RoICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIElFMTAsIHdoaWNoIGRvZXMgbm90IHlldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQgQXJyYXlCdWZmZXIuc2xpY2U6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0LmltYWdlSGVhZCA9IG5ldyBVaW50OEFycmF5KCBidWZmZXIgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YmFycmF5KCAyLCBoZWFkTGVuZ3RoICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICB1cGRhdGVJbWFnZUhlYWQ6IGZ1bmN0aW9uKCBidWZmZXIsIGhlYWQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLl9wYXJzZSggYnVmZmVyLCB0cnVlICksXG4gICAgICAgICAgICAgICAgICAgIGJ1ZjEsIGJ1ZjIsIGJvZHlvZmZzZXQ7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgYm9keW9mZnNldCA9IDI7XG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmltYWdlSGVhZCApIHtcbiAgICAgICAgICAgICAgICAgICAgYm9keW9mZnNldCA9IDIgKyBkYXRhLmltYWdlSGVhZC5ieXRlTGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGJ1ZmZlci5zbGljZSApIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmMiA9IGJ1ZmZlci5zbGljZSggYm9keW9mZnNldCApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZjIgPSBuZXcgVWludDhBcnJheSggYnVmZmVyICkuc3ViYXJyYXkoIGJvZHlvZmZzZXQgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgYnVmMSA9IG5ldyBVaW50OEFycmF5KCBoZWFkLmJ5dGVMZW5ndGggKyAyICsgYnVmMi5ieXRlTGVuZ3RoICk7XG4gICAgXG4gICAgICAgICAgICAgICAgYnVmMVsgMCBdID0gMHhGRjtcbiAgICAgICAgICAgICAgICBidWYxWyAxIF0gPSAweEQ4O1xuICAgICAgICAgICAgICAgIGJ1ZjEuc2V0KCBuZXcgVWludDhBcnJheSggaGVhZCApLCAyICk7XG4gICAgICAgICAgICAgICAgYnVmMS5zZXQoIG5ldyBVaW50OEFycmF5KCBidWYyICksIGhlYWQuYnl0ZUxlbmd0aCArIDIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmMS5idWZmZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIFV0aWwucGFyc2VNZXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYXBpLnBhcnNlLmFwcGx5KCBhcGksIGFyZ3VtZW50cyApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBVdGlsLnVwZGF0ZUltYWdlSGVhZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFwaS51cGRhdGVJbWFnZUhlYWQuYXBwbHkoIGFwaSwgYXJndW1lbnRzICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIHJldHVybiBhcGk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICog5Luj56CB5p2l6Ieq5LqO77yaaHR0cHM6Ly9naXRodWIuY29tL2JsdWVpbXAvSmF2YVNjcmlwdC1Mb2FkLUltYWdlXG4gICAgICog5pqC5pe26aG555uu5Lit5Y+q55So5LqGb3JpZW50YXRpb24uXG4gICAgICpcbiAgICAgKiDljrvpmaTkuoYgRXhpZiBTdWIgSUZEIFBvaW50ZXIsIEdQUyBJbmZvIElGRCBQb2ludGVyLCBFeGlmIFRodW1ibmFpbC5cbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEVYSUbop6PmnpBcbiAgICAgKi9cbiAgICBcbiAgICAvLyBTYW1wbGVcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBNYWtlIDogQXBwbGVcbiAgICAvLyBNb2RlbCA6IGlQaG9uZSA0U1xuICAgIC8vIE9yaWVudGF0aW9uIDogMVxuICAgIC8vIFhSZXNvbHV0aW9uIDogNzIgWzcyLzFdXG4gICAgLy8gWVJlc29sdXRpb24gOiA3MiBbNzIvMV1cbiAgICAvLyBSZXNvbHV0aW9uVW5pdCA6IDJcbiAgICAvLyBTb2Z0d2FyZSA6IFF1aWNrVGltZSA3LjcuMVxuICAgIC8vIERhdGVUaW1lIDogMjAxMzowOTowMSAyMjo1Mzo1NVxuICAgIC8vIEV4aWZJRkRQb2ludGVyIDogMTkwXG4gICAgLy8gRXhwb3N1cmVUaW1lIDogMC4wNTg4MjM1Mjk0MTE3NjQ3MDUgWzEvMTddXG4gICAgLy8gRk51bWJlciA6IDIuNCBbMTIvNV1cbiAgICAvLyBFeHBvc3VyZVByb2dyYW0gOiBOb3JtYWwgcHJvZ3JhbVxuICAgIC8vIElTT1NwZWVkUmF0aW5ncyA6IDgwMFxuICAgIC8vIEV4aWZWZXJzaW9uIDogMDIyMFxuICAgIC8vIERhdGVUaW1lT3JpZ2luYWwgOiAyMDEzOjA5OjAxIDIyOjUyOjUxXG4gICAgLy8gRGF0ZVRpbWVEaWdpdGl6ZWQgOiAyMDEzOjA5OjAxIDIyOjUyOjUxXG4gICAgLy8gQ29tcG9uZW50c0NvbmZpZ3VyYXRpb24gOiBZQ2JDclxuICAgIC8vIFNodXR0ZXJTcGVlZFZhbHVlIDogNC4wNTg4OTM1MTU3NjQ0MjZcbiAgICAvLyBBcGVydHVyZVZhbHVlIDogMi41MjYwNjg4MjE2ODkyNTk3IFs0ODQ1LzE5MThdXG4gICAgLy8gQnJpZ2h0bmVzc1ZhbHVlIDogLTAuMzEyNjY4NjYwMTk5ODM5NVxuICAgIC8vIE1ldGVyaW5nTW9kZSA6IFBhdHRlcm5cbiAgICAvLyBGbGFzaCA6IEZsYXNoIGRpZCBub3QgZmlyZSwgY29tcHVsc29yeSBmbGFzaCBtb2RlXG4gICAgLy8gRm9jYWxMZW5ndGggOiA0LjI4IFsxMDcvMjVdXG4gICAgLy8gU3ViamVjdEFyZWEgOiBbNCB2YWx1ZXNdXG4gICAgLy8gRmxhc2hwaXhWZXJzaW9uIDogMDEwMFxuICAgIC8vIENvbG9yU3BhY2UgOiAxXG4gICAgLy8gUGl4ZWxYRGltZW5zaW9uIDogMjQ0OFxuICAgIC8vIFBpeGVsWURpbWVuc2lvbiA6IDMyNjRcbiAgICAvLyBTZW5zaW5nTWV0aG9kIDogT25lLWNoaXAgY29sb3IgYXJlYSBzZW5zb3JcbiAgICAvLyBFeHBvc3VyZU1vZGUgOiAwXG4gICAgLy8gV2hpdGVCYWxhbmNlIDogQXV0byB3aGl0ZSBiYWxhbmNlXG4gICAgLy8gRm9jYWxMZW5ndGhJbjM1bW1GaWxtIDogMzVcbiAgICAvLyBTY2VuZUNhcHR1cmVUeXBlIDogU3RhbmRhcmRcbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvaW1hZ2VtZXRhL2V4aWYnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9odG1sNS9pbWFnZW1ldGEnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEltYWdlTWV0YSApIHtcbiAgICBcbiAgICAgICAgdmFyIEVYSUYgPSB7fTtcbiAgICBcbiAgICAgICAgRVhJRi5FeGlmTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgRVhJRi5FeGlmTWFwLnByb3RvdHlwZS5tYXAgPSB7XG4gICAgICAgICAgICAnT3JpZW50YXRpb24nOiAweDAxMTJcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgRVhJRi5FeGlmTWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiggaWQgKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1sgaWQgXSB8fCB0aGlzWyB0aGlzLm1hcFsgaWQgXSBdO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBFWElGLmV4aWZUYWdUeXBlcyA9IHtcbiAgICAgICAgICAgIC8vIGJ5dGUsIDgtYml0IHVuc2lnbmVkIGludDpcbiAgICAgICAgICAgIDE6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDgoIGRhdGFPZmZzZXQgKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IDFcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyBhc2NpaSwgOC1iaXQgYnl0ZTpcbiAgICAgICAgICAgIDI6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSggZGF0YVZpZXcuZ2V0VWludDgoIGRhdGFPZmZzZXQgKSApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogMSxcbiAgICAgICAgICAgICAgICBhc2NpaTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHNob3J0LCAxNiBiaXQgaW50OlxuICAgICAgICAgICAgMzoge1xuICAgICAgICAgICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiggZGF0YVZpZXcsIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFWaWV3LmdldFVpbnQxNiggZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiAyXG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gbG9uZywgMzIgYml0IGludDpcbiAgICAgICAgICAgIDQ6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhVmlldy5nZXRVaW50MzIoIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogNFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHJhdGlvbmFsID0gdHdvIGxvbmcgdmFsdWVzLFxuICAgICAgICAgICAgLy8gZmlyc3QgaXMgbnVtZXJhdG9yLCBzZWNvbmQgaXMgZGVub21pbmF0b3I6XG4gICAgICAgICAgICA1OiB7XG4gICAgICAgICAgICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDMyKCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVmlldy5nZXRVaW50MzIoIGRhdGFPZmZzZXQgKyA0LCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IDhcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyBzbG9uZywgMzIgYml0IHNpZ25lZCBpbnQ6XG4gICAgICAgICAgICA5OiB7XG4gICAgICAgICAgICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0SW50MzIoIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogNFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHNyYXRpb25hbCwgdHdvIHNsb25ncywgZmlyc3QgaXMgbnVtZXJhdG9yLCBzZWNvbmQgaXMgZGVub21pbmF0b3I6XG4gICAgICAgICAgICAxMDoge1xuICAgICAgICAgICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiggZGF0YVZpZXcsIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFWaWV3LmdldEludDMyKCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVmlldy5nZXRJbnQzMiggZGF0YU9mZnNldCArIDQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogOFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyB1bmRlZmluZWQsIDgtYml0IGJ5dGUsIHZhbHVlIGRlcGVuZGluZyBvbiBmaWVsZDpcbiAgICAgICAgRVhJRi5leGlmVGFnVHlwZXNbIDcgXSA9IEVYSUYuZXhpZlRhZ1R5cGVzWyAxIF07XG4gICAgXG4gICAgICAgIEVYSUYuZ2V0RXhpZlZhbHVlID0gZnVuY3Rpb24oIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LCBvZmZzZXQsIHR5cGUsIGxlbmd0aCxcbiAgICAgICAgICAgICAgICBsaXR0bGVFbmRpYW4gKSB7XG4gICAgXG4gICAgICAgICAgICB2YXIgdGFnVHlwZSA9IEVYSUYuZXhpZlRhZ1R5cGVzWyB0eXBlIF0sXG4gICAgICAgICAgICAgICAgdGFnU2l6ZSwgZGF0YU9mZnNldCwgdmFsdWVzLCBpLCBzdHIsIGM7XG4gICAgXG4gICAgICAgICAgICBpZiAoICF0YWdUeXBlICkge1xuICAgICAgICAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogSW52YWxpZCB0YWcgdHlwZS4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB0YWdTaXplID0gdGFnVHlwZS5zaXplICogbGVuZ3RoO1xuICAgIFxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIHRoZSB2YWx1ZSBpcyBjb250YWluZWQgaW4gdGhlIGRhdGFPZmZzZXQgYnl0ZXMsXG4gICAgICAgICAgICAvLyBvciBpZiB0aGUgdmFsdWUgYXQgdGhlIGRhdGFPZmZzZXQgaXMgYSBwb2ludGVyIHRvIHRoZSBhY3R1YWwgZGF0YTpcbiAgICAgICAgICAgIGRhdGFPZmZzZXQgPSB0YWdTaXplID4gNCA/IHRpZmZPZmZzZXQgKyBkYXRhVmlldy5nZXRVaW50MzIoIG9mZnNldCArIDgsXG4gICAgICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiApIDogKG9mZnNldCArIDgpO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBkYXRhT2Zmc2V0ICsgdGFnU2l6ZSA+IGRhdGFWaWV3LmJ5dGVMZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIGRhdGEgb2Zmc2V0LicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGlmICggbGVuZ3RoID09PSAxICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0YWdUeXBlLmdldFZhbHVlKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB2YWx1ZXMgPSBbXTtcbiAgICBcbiAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEgKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzWyBpIF0gPSB0YWdUeXBlLmdldFZhbHVlKCBkYXRhVmlldyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFPZmZzZXQgKyBpICogdGFnVHlwZS5zaXplLCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGlmICggdGFnVHlwZS5hc2NpaSApIHtcbiAgICAgICAgICAgICAgICBzdHIgPSAnJztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBDb25jYXRlbmF0ZSB0aGUgY2hhcnM6XG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgIGMgPSB2YWx1ZXNbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gSWdub3JlIHRoZSB0ZXJtaW5hdGluZyBOVUxMIGJ5dGUocyk6XG4gICAgICAgICAgICAgICAgICAgIGlmICggYyA9PT0gJ1xcdTAwMDAnICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IGM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBFWElGLnBhcnNlRXhpZlRhZyA9IGZ1bmN0aW9uKCBkYXRhVmlldywgdGlmZk9mZnNldCwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sXG4gICAgICAgICAgICAgICAgZGF0YSApIHtcbiAgICBcbiAgICAgICAgICAgIHZhciB0YWcgPSBkYXRhVmlldy5nZXRVaW50MTYoIG9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICBkYXRhLmV4aWZbIHRhZyBdID0gRVhJRi5nZXRFeGlmVmFsdWUoIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LCBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWaWV3LmdldFVpbnQxNiggb2Zmc2V0ICsgMiwgbGl0dGxlRW5kaWFuICksICAgIC8vIHRhZyB0eXBlXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWaWV3LmdldFVpbnQzMiggb2Zmc2V0ICsgNCwgbGl0dGxlRW5kaWFuICksICAgIC8vIHRhZyBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEVYSUYucGFyc2VFeGlmVGFncyA9IGZ1bmN0aW9uKCBkYXRhVmlldywgdGlmZk9mZnNldCwgZGlyT2Zmc2V0LFxuICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiwgZGF0YSApIHtcbiAgICBcbiAgICAgICAgICAgIHZhciB0YWdzTnVtYmVyLCBkaXJFbmRPZmZzZXQsIGk7XG4gICAgXG4gICAgICAgICAgICBpZiAoIGRpck9mZnNldCArIDYgPiBkYXRhVmlldy5ieXRlTGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogSW52YWxpZCBkaXJlY3Rvcnkgb2Zmc2V0LicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHRhZ3NOdW1iZXIgPSBkYXRhVmlldy5nZXRVaW50MTYoIGRpck9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICBkaXJFbmRPZmZzZXQgPSBkaXJPZmZzZXQgKyAyICsgMTIgKiB0YWdzTnVtYmVyO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBkaXJFbmRPZmZzZXQgKyA0ID4gZGF0YVZpZXcuYnl0ZUxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IEludmFsaWQgZGlyZWN0b3J5IHNpemUuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0YWdzTnVtYmVyOyBpICs9IDEgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZUV4aWZUYWcoIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyT2Zmc2V0ICsgMiArIDEyICogaSwgICAgLy8gdGFnIG9mZnNldFxuICAgICAgICAgICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuLCBkYXRhICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyBSZXR1cm4gdGhlIG9mZnNldCB0byB0aGUgbmV4dCBkaXJlY3Rvcnk6XG4gICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDMyKCBkaXJFbmRPZmZzZXQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyBFWElGLmdldEV4aWZUaHVtYm5haWwgPSBmdW5jdGlvbihkYXRhVmlldywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgICAgICAgLy8gICAgIHZhciBoZXhEYXRhLFxuICAgICAgICAvLyAgICAgICAgIGksXG4gICAgICAgIC8vICAgICAgICAgYjtcbiAgICAgICAgLy8gICAgIGlmICghbGVuZ3RoIHx8IG9mZnNldCArIGxlbmd0aCA+IGRhdGFWaWV3LmJ5dGVMZW5ndGgpIHtcbiAgICAgICAgLy8gICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IEludmFsaWQgdGh1bWJuYWlsIGRhdGEuJyk7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgaGV4RGF0YSA9IFtdO1xuICAgICAgICAvLyAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8vICAgICAgICAgYiA9IGRhdGFWaWV3LmdldFVpbnQ4KG9mZnNldCArIGkpO1xuICAgICAgICAvLyAgICAgICAgIGhleERhdGEucHVzaCgoYiA8IDE2ID8gJzAnIDogJycpICsgYi50b1N0cmluZygxNikpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgcmV0dXJuICdkYXRhOmltYWdlL2pwZWcsJScgKyBoZXhEYXRhLmpvaW4oJyUnKTtcbiAgICAgICAgLy8gfTtcbiAgICBcbiAgICAgICAgRVhJRi5wYXJzZUV4aWZEYXRhID0gZnVuY3Rpb24oIGRhdGFWaWV3LCBvZmZzZXQsIGxlbmd0aCwgZGF0YSApIHtcbiAgICBcbiAgICAgICAgICAgIHZhciB0aWZmT2Zmc2V0ID0gb2Zmc2V0ICsgMTAsXG4gICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuLCBkaXJPZmZzZXQ7XG4gICAgXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgdGhlIEFTQ0lJIGNvZGUgZm9yIFwiRXhpZlwiICgweDQ1Nzg2OTY2KTpcbiAgICAgICAgICAgIGlmICggZGF0YVZpZXcuZ2V0VWludDMyKCBvZmZzZXQgKyA0ICkgIT09IDB4NDU3ODY5NjYgKSB7XG4gICAgICAgICAgICAgICAgLy8gTm8gRXhpZiBkYXRhLCBtaWdodCBiZSBYTVAgZGF0YSBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCB0aWZmT2Zmc2V0ICsgOCA+IGRhdGFWaWV3LmJ5dGVMZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIHNlZ21lbnQgc2l6ZS4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgdGhlIHR3byBudWxsIGJ5dGVzOlxuICAgICAgICAgICAgaWYgKCBkYXRhVmlldy5nZXRVaW50MTYoIG9mZnNldCArIDggKSAhPT0gMHgwMDAwICkge1xuICAgICAgICAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogTWlzc2luZyBieXRlIGFsaWdubWVudCBvZmZzZXQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJ5dGUgYWxpZ25tZW50OlxuICAgICAgICAgICAgc3dpdGNoICggZGF0YVZpZXcuZ2V0VWludDE2KCB0aWZmT2Zmc2V0ICkgKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAweDQ5NDk6XG4gICAgICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgIGNhc2UgMHg0RDREOlxuICAgICAgICAgICAgICAgICAgICBsaXR0bGVFbmRpYW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIGJ5dGUgYWxpZ25tZW50IG1hcmtlci4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHRoZSBUSUZGIHRhZyBtYXJrZXIgKDB4MDAyQSk6XG4gICAgICAgICAgICBpZiAoIGRhdGFWaWV3LmdldFVpbnQxNiggdGlmZk9mZnNldCArIDIsIGxpdHRsZUVuZGlhbiApICE9PSAweDAwMkEgKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBNaXNzaW5nIFRJRkYgbWFya2VyLicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIFJldHJpZXZlIHRoZSBkaXJlY3Rvcnkgb2Zmc2V0IGJ5dGVzLCB1c3VhbGx5IDB4MDAwMDAwMDggb3IgOCBkZWNpbWFsOlxuICAgICAgICAgICAgZGlyT2Zmc2V0ID0gZGF0YVZpZXcuZ2V0VWludDMyKCB0aWZmT2Zmc2V0ICsgNCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGV4aWYgb2JqZWN0IHRvIHN0b3JlIHRoZSB0YWdzOlxuICAgICAgICAgICAgZGF0YS5leGlmID0gbmV3IEVYSUYuRXhpZk1hcCgpO1xuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIHRhZ3Mgb2YgdGhlIG1haW4gaW1hZ2UgZGlyZWN0b3J5IGFuZCByZXRyaWV2ZSB0aGVcbiAgICAgICAgICAgIC8vIG9mZnNldCB0byB0aGUgbmV4dCBkaXJlY3RvcnksIHVzdWFsbHkgdGhlIHRodW1ibmFpbCBkaXJlY3Rvcnk6XG4gICAgICAgICAgICBkaXJPZmZzZXQgPSBFWElGLnBhcnNlRXhpZlRhZ3MoIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICB0aWZmT2Zmc2V0ICsgZGlyT2Zmc2V0LCBsaXR0bGVFbmRpYW4sIGRhdGEgKTtcbiAgICBcbiAgICAgICAgICAgIC8vIOWwneivleivu+WPlue8qeeVpeWbvlxuICAgICAgICAgICAgLy8gaWYgKCBkaXJPZmZzZXQgKSB7XG4gICAgICAgICAgICAvLyAgICAgdGh1bWJuYWlsRGF0YSA9IHtleGlmOiB7fX07XG4gICAgICAgICAgICAvLyAgICAgZGlyT2Zmc2V0ID0gRVhJRi5wYXJzZUV4aWZUYWdzKFxuICAgICAgICAgICAgLy8gICAgICAgICBkYXRhVmlldyxcbiAgICAgICAgICAgIC8vICAgICAgICAgdGlmZk9mZnNldCxcbiAgICAgICAgICAgIC8vICAgICAgICAgdGlmZk9mZnNldCArIGRpck9mZnNldCxcbiAgICAgICAgICAgIC8vICAgICAgICAgbGl0dGxlRW5kaWFuLFxuICAgICAgICAgICAgLy8gICAgICAgICB0aHVtYm5haWxEYXRhXG4gICAgICAgICAgICAvLyAgICAgKTtcbiAgICBcbiAgICAgICAgICAgIC8vICAgICAvLyBDaGVjayBmb3IgSlBFRyBUaHVtYm5haWwgb2Zmc2V0OlxuICAgICAgICAgICAgLy8gICAgIGlmICh0aHVtYm5haWxEYXRhLmV4aWZbMHgwMjAxXSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBkYXRhLmV4aWYuVGh1bWJuYWlsID0gRVhJRi5nZXRFeGlmVGh1bWJuYWlsKFxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgZGF0YVZpZXcsXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0aWZmT2Zmc2V0ICsgdGh1bWJuYWlsRGF0YS5leGlmWzB4MDIwMV0sXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0aHVtYm5haWxEYXRhLmV4aWZbMHgwMjAyXSAvLyBUaHVtYm5haWwgZGF0YSBsZW5ndGhcbiAgICAgICAgICAgIC8vICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEltYWdlTWV0YS5wYXJzZXJzWyAweGZmZTEgXS5wdXNoKCBFWElGLnBhcnNlRXhpZkRhdGEgKTtcbiAgICAgICAgcmV0dXJuIEVYSUY7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBJbWFnZVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9pbWFnZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAncnVudGltZS9odG1sNS91dGlsJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBIdG1sNVJ1bnRpbWUsIFV0aWwgKSB7XG4gICAgXG4gICAgICAgIHZhciBCTEFOSyA9ICdkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhBUUFCQUFEL0FDd0FBQUFBQVFBQkFBQUNBRHMlM0QnO1xuICAgIFxuICAgICAgICByZXR1cm4gSHRtbDVSdW50aW1lLnJlZ2lzdGVyKCAnSW1hZ2UnLCB7XG4gICAgXG4gICAgICAgICAgICAvLyBmbGFnOiDmoIforrDmmK/lkKbooqvkv67mlLnov4fjgIJcbiAgICAgICAgICAgIG1vZGlmaWVkOiBmYWxzZSxcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xuICAgIFxuICAgICAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuX2luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBtZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOivu+WPlm1ldGHkv6Hmga/jgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhbWUuX21ldGFzICYmICdpbWFnZS9qcGVnJyA9PT0gbWUudHlwZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFV0aWwucGFyc2VNZXRhKCBtZS5fYmxvYiwgZnVuY3Rpb24oIGVycm9yLCByZXQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuX21ldGFzID0gcmV0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ2xvYWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlcignbG9hZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX2ltZyA9IGltZztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBsb2FkRnJvbUJsb2I6IGZ1bmN0aW9uKCBibG9iICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGltZyA9IG1lLl9pbWc7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX2Jsb2IgPSBibG9iO1xuICAgICAgICAgICAgICAgIG1lLnR5cGUgPSBibG9iLnR5cGU7XG4gICAgICAgICAgICAgICAgaW1nLnNyYyA9IFV0aWwuY3JlYXRlT2JqZWN0VVJMKCBibG9iLmdldFNvdXJjZSgpICk7XG4gICAgICAgICAgICAgICAgbWUub3duZXIub25jZSggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5yZXZva2VPYmplY3RVUkwoIGltZy5zcmMgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICByZXNpemU6IGZ1bmN0aW9uKCB3aWR0aCwgaGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSB0aGlzLl9jYW52YXMgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLl9jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXplKCB0aGlzLl9pbWcsIGNhbnZhcywgd2lkdGgsIGhlaWdodCApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2IgPSBudWxsOyAgICAvLyDmsqHnlKjkuobvvIzlj6/ku6XliKDmjonkuobjgIJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLm93bmVyLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0QXNCbG9iOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IHRoaXMuX2Jsb2IsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcztcbiAgICBcbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZSB8fCB0aGlzLnR5cGU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gYmxvYumcgOimgemHjeaWsOeUn+aIkOOAglxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5tb2RpZmllZCB8fCB0aGlzLnR5cGUgIT09IHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcyA9IHRoaXMuX2NhbnZhcztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnaW1hZ2UvanBlZycgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC5jYW52YXNUb0RhdGFVcmwoIGNhbnZhcywgJ2ltYWdlL2pwZWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLnF1YWxpdHkgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggb3B0cy5wcmVzZXJ2ZUhlYWRlcnMgJiYgdGhpcy5fbWV0YXMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWV0YXMuaW1hZ2VIZWFkICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2IgPSBVdGlsLmRhdGFVUkwyQXJyYXlCdWZmZXIoIGJsb2IgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC51cGRhdGVJbWFnZUhlYWQoIGJsb2IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXRhcy5pbWFnZUhlYWQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC5hcnJheUJ1ZmZlclRvQmxvYiggYmxvYiwgdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBibG9iO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvYiA9IFV0aWwuY2FudmFzVG9EYXRhVXJsKCBjYW52YXMsIHR5cGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC5kYXRhVVJMMkJsb2IoIGJsb2IgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJsb2I7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0QXNEYXRhVXJsOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICBcbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZSB8fCB0aGlzLnR5cGU7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnaW1hZ2UvanBlZycgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBVdGlsLmNhbnZhc1RvRGF0YVVybCggdGhpcy5fY2FudmFzLCB0eXBlLCBvcHRzLnF1YWxpdHkgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FudmFzLnRvRGF0YVVSTCggdHlwZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRPcmllbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ldGFzICYmIHRoaXMuX21ldGFzLmV4aWYgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21ldGFzLmV4aWYuZ2V0KCdPcmllbnRhdGlvbicpIHx8IDE7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgaW5mbzogZnVuY3Rpb24oIHZhbCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5mbyA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGdldHRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbmZvO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIG1ldGE6IGZ1bmN0aW9uKCB2YWwgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gc2V0dGVyXG4gICAgICAgICAgICAgICAgaWYgKCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21ldGEgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBnZXR0ZXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWV0YTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5fY2FudmFzO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ltZy5vbmxvYWQgPSBudWxsO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY2FudmFzICkge1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jbGVhclJlY3QoIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCApO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FudmFzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6YeK5pS+5YaF5a2Y44CC6Z2e5bi46YeN6KaB77yM5ZCm5YiZ6YeK5pS+5LiN5LqGaW1hZ2XnmoTlhoXlrZjjgIJcbiAgICAgICAgICAgICAgICB0aGlzLl9pbWcuc3JjID0gQkxBTks7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1nID0gdGhpcy5fYmxvYiA9IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3Jlc2l6ZTogZnVuY3Rpb24oIGltZywgY3ZzLCB3aWR0aCwgaGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBuYXR1cmFsV2lkdGggPSBpbWcud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIG5hdHVyYWxIZWlnaHQgPSBpbWcuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBvcmllbnRhdGlvbiA9IHRoaXMuZ2V0T3JpZW50YXRpb24oKSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGUsIHcsIGgsIHgsIHk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gdmFsdWVzIHRoYXQgcmVxdWlyZSA5MCBkZWdyZWUgcm90YXRpb25cbiAgICAgICAgICAgICAgICBpZiAoIH5bIDUsIDYsIDcsIDggXS5pbmRleE9mKCBvcmllbnRhdGlvbiApICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDkuqTmjaJ3aWR0aCwgaGVpZ2h055qE5YC844CCXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIF49IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IF49IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCBePSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHNjYWxlID0gTWF0aFsgb3B0cy5jcm9wID8gJ21heCcgOiAnbWluJyBdKCB3aWR0aCAvIG5hdHVyYWxXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCAvIG5hdHVyYWxIZWlnaHQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuI3lhYHorrjmlL7lpKfjgIJcbiAgICAgICAgICAgICAgICBvcHRzLmFsbG93TWFnbmlmeSB8fCAoc2NhbGUgPSBNYXRoLm1pbiggMSwgc2NhbGUgKSk7XG4gICAgXG4gICAgICAgICAgICAgICAgdyA9IG5hdHVyYWxXaWR0aCAqIHNjYWxlO1xuICAgICAgICAgICAgICAgIGggPSBuYXR1cmFsSGVpZ2h0ICogc2NhbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLmNyb3AgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN2cy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjdnMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN2cy53aWR0aCA9IHc7XG4gICAgICAgICAgICAgICAgICAgIGN2cy5oZWlnaHQgPSBoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB4ID0gKGN2cy53aWR0aCAtIHcpIC8gMjtcbiAgICAgICAgICAgICAgICB5ID0gKGN2cy5oZWlnaHQgLSBoKSAvIDI7XG4gICAgXG4gICAgICAgICAgICAgICAgb3B0cy5wcmVzZXJ2ZUhlYWRlcnMgfHwgdGhpcy5fcm90YXRlMk9yaWVudGFpb24oIGN2cywgb3JpZW50YXRpb24gKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJJbWFnZVRvQ2FudmFzKCBjdnMsIGltZywgeCwgeSwgdywgaCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9yb3RhdGUyT3JpZW50YWlvbjogZnVuY3Rpb24oIGNhbnZhcywgb3JpZW50YXRpb24gKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gY2FudmFzLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBvcmllbnRhdGlvbiApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIG9yaWVudGF0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6ICAgIC8vIGhvcml6b250YWwgZmxpcFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggd2lkdGgsIDAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZSggLTEsIDEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6ICAgIC8vIDE4MCByb3RhdGUgbGVmdFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggd2lkdGgsIGhlaWdodCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSggTWF0aC5QSSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNDogICAgLy8gdmVydGljYWwgZmxpcFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggMCwgaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc2NhbGUoIDEsIC0xICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA1OiAgICAvLyB2ZXJ0aWNhbCBmbGlwICsgOTAgcm90YXRlIHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKCAwLjUgKiBNYXRoLlBJICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc2NhbGUoIDEsIC0xICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA2OiAgICAvLyA5MCByb3RhdGUgcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoIDAuNSAqIE1hdGguUEkgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoIDAsIC1oZWlnaHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDc6ICAgIC8vIGhvcml6b250YWwgZmxpcCArIDkwIHJvdGF0ZSByaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSggMC41ICogTWF0aC5QSSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggd2lkdGgsIC1oZWlnaHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZSggLTEsIDEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDg6ICAgIC8vIDkwIHJvdGF0ZSBsZWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKCAtMC41ICogTWF0aC5QSSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggLXdpZHRoLCAwICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3N0b21pdGEvaW9zLWltYWdlZmlsZS1tZWdhcGl4ZWwvXG4gICAgICAgICAgICAvLyBibG9iL21hc3Rlci9zcmMvbWVnYXBpeC1pbWFnZS5qc1xuICAgICAgICAgICAgX3JlbmRlckltYWdlVG9DYW52YXM6IChmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzkuI3mmK9pb3MsIOS4jemcgOimgei/meS5iOWkjeadgu+8gVxuICAgICAgICAgICAgICAgIGlmICggIUJhc2Uub3MuaW9zICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGNhbnZhcywgaW1nLCB4LCB5LCB3LCBoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKCBpbWcsIHgsIHksIHcsIGggKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRGV0ZWN0aW5nIHZlcnRpY2FsIHNxdWFzaCBpbiBsb2FkZWQgaW1hZ2UuXG4gICAgICAgICAgICAgICAgICogRml4ZXMgYSBidWcgd2hpY2ggc3F1YXNoIGltYWdlIHZlcnRpY2FsbHkgd2hpbGUgZHJhd2luZyBpbnRvXG4gICAgICAgICAgICAgICAgICogY2FudmFzIGZvciBzb21lIGltYWdlcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkZXRlY3RWZXJ0aWNhbFNxdWFzaCggaW1nLCBpdywgaWggKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3kgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXkgPSBpaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHB5ID0gaWgsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLCBhbHBoYSwgcmF0aW87XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpaDtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSggaW1nLCAwLCAwICk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKCAwLCAwLCAxLCBpaCApLmRhdGE7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlYXJjaCBpbWFnZSBlZGdlIHBpeGVsIHBvc2l0aW9uIGluIGNhc2VcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaXMgc3F1YXNoZWQgdmVydGljYWxseS5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCBweSA+IHN5ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxwaGEgPSBkYXRhWyAocHkgLSAxKSAqIDQgKyAzIF07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGFscGhhID09PSAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV5ID0gcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5ID0gcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBweSA9IChleSArIHN5KSA+PiAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJhdGlvID0gKHB5IC8gaWgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHJhdGlvID09PSAwKSA/IDEgOiByYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZml4IGllNyBidWdcbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExOTI5MDk5L1xuICAgICAgICAgICAgICAgIC8vIGh0bWw1LWNhbnZhcy1kcmF3aW1hZ2UtcmF0aW8tYnVnLWlvc1xuICAgICAgICAgICAgICAgIGlmICggQmFzZS5vcy5pb3MgPj0gNyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBjYW52YXMsIGltZywgeCwgeSwgdywgaCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdyA9IGltZy5uYXR1cmFsV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWggPSBpbWcubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0U3F1YXNoUmF0aW8gPSBkZXRlY3RWZXJ0aWNhbFNxdWFzaCggaW1nLCBpdywgaWggKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoIGltZywgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdyAqIHZlcnRTcXVhc2hSYXRpbywgaWggKiB2ZXJ0U3F1YXNoUmF0aW8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCwgeSwgdywgaCApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBEZXRlY3Qgc3Vic2FtcGxpbmcgaW4gbG9hZGVkIGltYWdlLlxuICAgICAgICAgICAgICAgICAqIEluIGlPUywgbGFyZ2VyIGltYWdlcyB0aGFuIDJNIHBpeGVscyBtYXkgYmVcbiAgICAgICAgICAgICAgICAgKiBzdWJzYW1wbGVkIGluIHJlbmRlcmluZy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkZXRlY3RTdWJzYW1wbGluZyggaW1nICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXcgPSBpbWcubmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWggPSBpbWcubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcywgY3R4O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBzdWJzYW1wbGluZyBtYXkgaGFwcGVuIG92ZXJtZWdhcGl4ZWwgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpdyAqIGloID4gMTAyNCAqIDEwMjQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKCBpbWcsIC1pdyArIDEsIDAgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN1YnNhbXBsZWQgaW1hZ2UgYmVjb21lcyBoYWxmIHNtYWxsZXIgaW4gcmVuZGVyaW5nIHNpemUuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBhbHBoYSBjaGFubmVsIHZhbHVlIHRvIGNvbmZpcm0gaW1hZ2UgaXMgY292ZXJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVkZ2UgcGl4ZWwgb3Igbm90LiBpZiBhbHBoYSB2YWx1ZSBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbWFnZSBpcyBub3QgY292ZXJpbmcsIGhlbmNlIHN1YnNhbXBsZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSggMCwgMCwgMSwgMSApLmRhdGFbIDMgXSA9PT0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGNhbnZhcywgaW1nLCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXcgPSBpbWcubmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWggPSBpbWcubmF0dXJhbEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2FtcGxlZCA9IGRldGVjdFN1YnNhbXBsaW5nKCBpbWcgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvU3F1YXNoID0gdGhpcy50eXBlID09PSAnaW1hZ2UvanBlZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBkID0gMTAyNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcENhbnZhcywgdG1wQ3R4LCB2ZXJ0U3F1YXNoUmF0aW8sIGR3LCBkaCwgc3gsIGR4O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN1YnNhbXBsZWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdyAvPSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWggLz0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB0bXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICAgICAgdG1wQ2FudmFzLndpZHRoID0gdG1wQ2FudmFzLmhlaWdodCA9IGQ7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRtcEN0eCA9IHRtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgICAgICB2ZXJ0U3F1YXNoUmF0aW8gPSBkb1NxdWFzaCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0ZWN0VmVydGljYWxTcXVhc2goIGltZywgaXcsIGloICkgOiAxO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBkdyA9IE1hdGguY2VpbCggZCAqIHdpZHRoIC8gaXcgKTtcbiAgICAgICAgICAgICAgICAgICAgZGggPSBNYXRoLmNlaWwoIGQgKiBoZWlnaHQgLyBpaCAvIHZlcnRTcXVhc2hSYXRpbyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIHN5IDwgaWggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIHN4IDwgaXcgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG1wQ3R4LmNsZWFyUmVjdCggMCwgMCwgZCwgZCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcEN0eC5kcmF3SW1hZ2UoIGltZywgLXN4LCAtc3kgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKCB0bXBDYW52YXMsIDAsIDAsIGQsIGQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ICsgZHgsIHkgKyBkeSwgZHcsIGRoICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ggKz0gZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeCArPSBkdztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN5ICs9IGQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBkeSArPSBkaDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xuICAgICAgICAgICAgICAgICAgICB0bXBDYW52YXMgPSB0bXBDdHggPSBudWxsO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgVHJhbnNwb3J0XG4gICAgICogQHRvZG8g5pSv5oyBY2h1bmtlZOS8oOi+k++8jOS8mOWKv++8mlxuICAgICAqIOWPr+S7peWwhuWkp+aWh+S7tuWIhuaIkOWwj+Wdl++8jOaMqOS4quS8oOi+k++8jOWPr+S7peaPkOmrmOWkp+aWh+S7tuaIkOWKn+eOh++8jOW9k+Wksei0peeahOaXtuWAme+8jOS5n+WPqumcgOimgemHjeS8oOmCo+Wwj+mDqOWIhu+8jFxuICAgICAqIOiAjOS4jemcgOimgemHjeWktOWGjeS8oOS4gOasoeOAguWPpuWkluaWreeCuee7reS8oOS5n+mcgOimgeeUqGNodW5rZWTmlrnlvI/jgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvdHJhbnNwb3J0JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgSHRtbDVSdW50aW1lICkge1xuICAgIFxuICAgICAgICB2YXIgbm9vcCA9IEJhc2Uubm9vcCxcbiAgICAgICAgICAgICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdUcmFuc3BvcnQnLCB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3BvbnNlID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBzZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICB4aHIgPSB0aGlzLl9pbml0QWpheCgpLFxuICAgICAgICAgICAgICAgICAgICBibG9iID0gb3duZXIuX2Jsb2IsXG4gICAgICAgICAgICAgICAgICAgIHNlcnZlciA9IG9wdHMuc2VydmVyLFxuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YSwgYmluYXJ5LCBmcjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuc2VuZEFzQmluYXJ5ICkge1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIgKz0gKC9cXD8vLnRlc3QoIHNlcnZlciApID8gJyYnIDogJz8nKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wYXJhbSggb3duZXIuX2Zvcm1EYXRhICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGJpbmFyeSA9IGJsb2IuZ2V0U291cmNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKCBvd25lci5fZm9ybURhdGEsIGZ1bmN0aW9uKCBrLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKCBrLCB2ICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoIG9wdHMuZmlsZVZhbCwgYmxvYi5nZXRTb3VyY2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmZpbGVuYW1lIHx8IG93bmVyLl9mb3JtRGF0YS5uYW1lIHx8ICcnICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy53aXRoQ3JlZGVudGlhbHMgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3Blbiggb3B0cy5tZXRob2QsIHNlcnZlciwgdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3Blbiggb3B0cy5tZXRob2QsIHNlcnZlciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRSZXF1ZXN0SGVhZGVyKCB4aHIsIG9wdHMuaGVhZGVycyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggYmluYXJ5ICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3ZlcnJpZGVNaW1lVHlwZSgnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZHJvaWTnm7TmjqXlj5HpgIFibG9i5Lya5a+86Ie05pyN5Yqh56uv5o6l5pS25Yiw55qE5piv56m65paH5Lu244CCXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1Z+ivpuaDheOAglxuICAgICAgICAgICAgICAgICAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2FuZHJvaWQvaXNzdWVzL2RldGFpbD9pZD0zOTg4MlxuICAgICAgICAgICAgICAgICAgICAvLyDmiYDku6XlhYjnlKhmaWxlUmVhZGVy6K+75Y+W5Ye65p2l5YaN6YCa6L+HYXJyYXlidWZmZXLnmoTmlrnlvI/lj5HpgIHjgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBCYXNlLm9zLmFuZHJvaWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2VuZCggdGhpcy5yZXN1bHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmciA9IGZyLm9ubG9hZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoIGJpbmFyeSApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoIGJpbmFyeSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoIGZvcm1EYXRhICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzcG9uc2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2VBc0pzb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJzZUpzb24oIHRoaXMuX3Jlc3BvbnNlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0U3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gdGhpcy5feGhyO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggeGhyICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBub29wO1xuICAgICAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gbm9vcDtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3hociA9IHhociA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWJvcnQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfaW5pdEFqYXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy53aXRoQ3JlZGVudGlhbHMgJiYgISgnd2l0aENyZWRlbnRpYWxzJyBpbiB4aHIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgWERvbWFpblJlcXVlc3QgIT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwZXJjZW50YWdlID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlLmxlbmd0aENvbXB1dGFibGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50YWdlID0gZS5sb2FkZWQgLyBlLnRvdGFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS50cmlnZ2VyKCAncHJvZ3Jlc3MnLCBwZXJjZW50YWdlICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggeGhyLnJlYWR5U3RhdGUgIT09IDQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gbm9vcDtcbiAgICAgICAgICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG5vb3A7XG4gICAgICAgICAgICAgICAgICAgIG1lLl94aHIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBtZS5fc3RhdHVzID0geGhyLnN0YXR1cztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Jlc3BvbnNlID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS50cmlnZ2VyKCdsb2FkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHhoci5zdGF0dXMgPj0gNTAwICYmIHhoci5zdGF0dXMgPCA2MDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcmVzcG9uc2UgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdlcnJvcicsICdzZXJ2ZXInICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdlcnJvcicsIG1lLl9zdGF0dXMgPyAnaHR0cCcgOiAnYWJvcnQnICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5feGhyID0geGhyO1xuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3NldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCB4aHIsIGhlYWRlcnMgKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCBoZWFkZXJzLCBmdW5jdGlvbigga2V5LCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCBrZXksIHZhbCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9wYXJzZUpzb246IGZ1bmN0aW9uKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGpzb247XG4gICAgXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UoIHN0ciApO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKCBleCApIHtcbiAgICAgICAgICAgICAgICAgICAganNvbiA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDlj6rmnIlodG1sNeWunueOsOeahOaWh+S7tueJiOacrOOAglxuICAgICAqL1xuICAgIGRlZmluZSgncHJlc2V0L2h0bWw1b25seScsW1xuICAgICAgICAnYmFzZScsXG4gICAgXG4gICAgICAgIC8vIHdpZGdldHNcbiAgICAgICAgJ3dpZGdldHMvZmlsZWRuZCcsXG4gICAgICAgICd3aWRnZXRzL2ZpbGVwYXN0ZScsXG4gICAgICAgICd3aWRnZXRzL2ZpbGVwaWNrZXInLFxuICAgICAgICAnd2lkZ2V0cy9pbWFnZScsXG4gICAgICAgICd3aWRnZXRzL3F1ZXVlJyxcbiAgICAgICAgJ3dpZGdldHMvcnVudGltZScsXG4gICAgICAgICd3aWRnZXRzL3VwbG9hZCcsXG4gICAgICAgICd3aWRnZXRzL3ZhbGlkYXRvcicsXG4gICAgXG4gICAgICAgIC8vIHJ1bnRpbWVzXG4gICAgICAgIC8vIGh0bWw1XG4gICAgICAgICdydW50aW1lL2h0bWw1L2Jsb2InLFxuICAgICAgICAncnVudGltZS9odG1sNS9kbmQnLFxuICAgICAgICAncnVudGltZS9odG1sNS9maWxlcGFzdGUnLFxuICAgICAgICAncnVudGltZS9odG1sNS9maWxlcGlja2VyJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvaW1hZ2VtZXRhL2V4aWYnLFxuICAgICAgICAncnVudGltZS9odG1sNS9pbWFnZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3RyYW5zcG9ydCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSApIHtcbiAgICAgICAgcmV0dXJuIEJhc2U7XG4gICAgfSk7XG4gICAgZGVmaW5lKCd3ZWJ1cGxvYWRlcicsW1xuICAgICAgICAncHJlc2V0L2h0bWw1b25seSdcbiAgICBdLCBmdW5jdGlvbiggcHJlc2V0ICkge1xuICAgICAgICByZXR1cm4gcHJlc2V0O1xuICAgIH0pO1xuICAgIHJldHVybiByZXF1aXJlKCd3ZWJ1cGxvYWRlcicpO1xufSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvdWVkaXRvci90aGlyZC1wYXJ0eS93ZWJ1cGxvYWRlci93ZWJ1cGxvYWRlci5odG1sNW9ubHkuanMifQ==
