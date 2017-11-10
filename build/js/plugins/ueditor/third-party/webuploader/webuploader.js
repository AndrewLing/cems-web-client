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
     * @fileOverview FlashRuntime
     */
    define('runtime/flash/runtime',[
        'base',
        'runtime/runtime',
        'runtime/compbase'
    ], function( Base, Runtime, CompBase ) {
    
        var $ = Base.$,
            type = 'flash',
            components = {};
    
    
        function getFlashVersion() {
            var version;
    
            try {
                version = navigator.plugins[ 'Shockwave Flash' ];
                version = version.description;
            } catch ( ex ) {
                try {
                    version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
                            .GetVariable('$version');
                } catch ( ex2 ) {
                    version = '0.0';
                }
            }
            version = version.match( /\d+/g );
            return parseFloat( version[ 0 ] + '.' + version[ 1 ], 10 );
        }
    
        function FlashRuntime() {
            var pool = {},
                clients = {},
                destory = this.destory,
                me = this,
                jsreciver = Base.guid('webuploader_');
    
            Runtime.apply( me, arguments );
            me.type = type;
    
    
            // 这个方法的调用者，实际上是RuntimeClient
            me.exec = function( comp, fn/*, args...*/ ) {
                var client = this,
                    uid = client.uid,
                    args = Base.slice( arguments, 2 ),
                    instance;
    
                clients[ uid ] = client;
    
                if ( components[ comp ] ) {
                    if ( !pool[ uid ] ) {
                        pool[ uid ] = new components[ comp ]( client, me );
                    }
    
                    instance = pool[ uid ];
    
                    if ( instance[ fn ] ) {
                        return instance[ fn ].apply( instance, args );
                    }
                }
    
                return me.flashExec.apply( client, arguments );
            };
    
            function handler( evt, obj ) {
                var type = evt.type || evt,
                    parts, uid;
    
                parts = type.split('::');
                uid = parts[ 0 ];
                type = parts[ 1 ];
    
                // console.log.apply( console, arguments );
    
                if ( type === 'Ready' && uid === me.uid ) {
                    me.trigger('ready');
                } else if ( clients[ uid ] ) {
                    clients[ uid ].trigger( type.toLowerCase(), evt, obj );
                }
    
                // Base.log( evt, obj );
            }
    
            // flash的接受器。
            window[ jsreciver ] = function() {
                var args = arguments;
    
                // 为了能捕获得到。
                setTimeout(function() {
                    handler.apply( null, args );
                }, 1 );
            };
    
            this.jsreciver = jsreciver;
    
            this.destory = function() {
                // @todo 删除池子中的所有实例
                return destory && destory.apply( this, arguments );
            };
    
            this.flashExec = function( comp, fn ) {
                var flash = me.getFlash(),
                    args = Base.slice( arguments, 2 );
    
                return flash.exec( this.uid, comp, fn, args );
            };
    
            // @todo
        }
    
        Base.inherits( Runtime, {
            constructor: FlashRuntime,
    
            init: function() {
                var container = this.getContainer(),
                    opts = this.options,
                    html;
    
                // if not the minimal height, shims are not initialized
                // in older browsers (e.g FF3.6, IE6,7,8, Safari 4.0,5.0, etc)
                container.css({
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    width: '9px',
                    height: '9px',
                    overflow: 'hidden'
                });
    
                // insert flash object
                html = '<object id="' + this.uid + '" type="application/' +
                        'x-shockwave-flash" data="' +  opts.swf + '" ';
    
                if ( Base.browser.ie ) {
                    html += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ';
                }
    
                html += 'width="100%" height="100%" style="outline:0">'  +
                    '<param name="movie" value="' + opts.swf + '" />' +
                    '<param name="flashvars" value="uid=' + this.uid +
                    '&jsreciver=' + this.jsreciver + '" />' +
                    '<param name="wmode" value="transparent" />' +
                    '<param name="allowscriptaccess" value="always" />' +
                '</object>';
    
                container.html( html );
            },
    
            getFlash: function() {
                if ( this._flash ) {
                    return this._flash;
                }
    
                this._flash = $( '#' + this.uid ).get( 0 );
                return this._flash;
            }
    
        });
    
        FlashRuntime.register = function( name, component ) {
            component = components[ name ] = Base.inherits( CompBase, $.extend({
    
                // @todo fix this later
                flashExec: function() {
                    var owner = this.owner,
                        runtime = this.getRuntime();
    
                    return runtime.flashExec.apply( owner, arguments );
                }
            }, component ) );
    
            return component;
        };
    
        if ( getFlashVersion() >= 11.4 ) {
            Runtime.addRuntime( type, FlashRuntime );
        }
    
        return FlashRuntime;
    });
    /**
     * @fileOverview FilePicker
     */
    define('runtime/flash/filepicker',[
        'base',
        'runtime/flash/runtime'
    ], function( Base, FlashRuntime ) {
        var $ = Base.$;
    
        return FlashRuntime.register( 'FilePicker', {
            init: function( opts ) {
                var copy = $.extend({}, opts ),
                    len, i;
    
                // 修复Flash再没有设置title的情况下无法弹出flash文件选择框的bug.
                len = copy.accept && copy.accept.length;
                for (  i = 0; i < len; i++ ) {
                    if ( !copy.accept[ i ].title ) {
                        copy.accept[ i ].title = 'Files';
                    }
                }
    
                delete copy.button;
                delete copy.container;
    
                this.flashExec( 'FilePicker', 'init', copy );
            },
    
            destroy: function() {
                // todo
            }
        });
    });
    /**
     * @fileOverview 图片压缩
     */
    define('runtime/flash/image',[
        'runtime/flash/runtime'
    ], function( FlashRuntime ) {
    
        return FlashRuntime.register( 'Image', {
            // init: function( options ) {
            //     var owner = this.owner;
    
            //     this.flashExec( 'Image', 'init', options );
            //     owner.on( 'load', function() {
            //         debugger;
            //     });
            // },
    
            loadFromBlob: function( blob ) {
                var owner = this.owner;
    
                owner.info() && this.flashExec( 'Image', 'info', owner.info() );
                owner.meta() && this.flashExec( 'Image', 'meta', owner.meta() );
    
                this.flashExec( 'Image', 'loadFromBlob', blob.uid );
            }
        });
    });
    /**
     * @fileOverview  Transport flash实现
     */
    define('runtime/flash/transport',[
        'base',
        'runtime/flash/runtime',
        'runtime/client'
    ], function( Base, FlashRuntime, RuntimeClient ) {
        var $ = Base.$;
    
        return FlashRuntime.register( 'Transport', {
            init: function() {
                this._status = 0;
                this._response = null;
                this._responseJson = null;
            },
    
            send: function() {
                var owner = this.owner,
                    opts = this.options,
                    xhr = this._initAjax(),
                    blob = owner._blob,
                    server = opts.server,
                    binary;
    
                xhr.connectRuntime( blob.ruid );
    
                if ( opts.sendAsBinary ) {
                    server += (/\?/.test( server ) ? '&' : '?') +
                            $.param( owner._formData );
    
                    binary = blob.uid;
                } else {
                    $.each( owner._formData, function( k, v ) {
                        xhr.exec( 'append', k, v );
                    });
    
                    xhr.exec( 'appendBlob', opts.fileVal, blob.uid,
                            opts.filename || owner._formData.name || '' );
                }
    
                this._setRequestHeader( xhr, opts.headers );
                xhr.exec( 'send', {
                    method: opts.method,
                    url: server
                }, binary );
            },
    
            getStatus: function() {
                return this._status;
            },
    
            getResponse: function() {
                return this._response;
            },
    
            getResponseAsJson: function() {
                return this._responseJson;
            },
    
            abort: function() {
                var xhr = this._xhr;
    
                if ( xhr ) {
                    xhr.exec('abort');
                    xhr.destroy();
                    this._xhr = xhr = null;
                }
            },
    
            destroy: function() {
                this.abort();
            },
    
            _initAjax: function() {
                var me = this,
                    xhr = new RuntimeClient('XMLHttpRequest');
    
                xhr.on( 'uploadprogress progress', function( e ) {
                    return me.trigger( 'progress', e.loaded / e.total );
                });
    
                xhr.on( 'load', function() {
                    var status = xhr.exec('getStatus'),
                        err = '';
    
                    xhr.off();
                    me._xhr = null;
    
                    if ( status >= 200 && status < 300 ) {
                        me._response = xhr.exec('getResponse');
                        me._responseJson = xhr.exec('getResponseAsJson');
                    } else if ( status >= 500 && status < 600 ) {
                        me._response = xhr.exec('getResponse');
                        me._responseJson = xhr.exec('getResponseAsJson');
                        err = 'server';
                    } else {
                        err = 'http';
                    }
    
                    xhr.destroy();
                    xhr = null;
    
                    return err ? me.trigger( 'error', err ) : me.trigger('load');
                });
    
                xhr.on( 'error', function() {
                    xhr.off();
                    me._xhr = null;
                    me.trigger( 'error', 'http' );
                });
    
                me._xhr = xhr;
                return xhr;
            },
    
            _setRequestHeader: function( xhr, headers ) {
                $.each( headers, function( key, val ) {
                    xhr.exec( 'setRequestHeader', key, val );
                });
            }
        });
    });
    /**
     * @fileOverview 完全版本。
     */
    define('preset/all',[
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
        'runtime/html5/androidpatch',
        'runtime/html5/image',
        'runtime/html5/transport',
    
        // flash
        'runtime/flash/filepicker',
        'runtime/flash/image',
        'runtime/flash/transport'
    ], function( Base ) {
        return Base;
    });
    define('webuploader',[
        'preset/all'
    ], function( preset ) {
        return preset;
    });
    return require('webuploader');
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvd2VidXBsb2FkZXIvd2VidXBsb2FkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohIFdlYlVwbG9hZGVyIDAuMS4yICovXG5cblxuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IOiuqeWGhemDqOWQhOS4qumDqOS7tueahOS7o+eggeWPr+S7peeUqFthbWRdKGh0dHBzOi8vZ2l0aHViLmNvbS9hbWRqcy9hbWRqcy1hcGkvd2lraS9BTUQp5qih5Z2X5a6a5LmJ5pa55byP57uE57uH6LW35p2l44CCXG4gKlxuICogQU1EIEFQSSDlhoXpg6jnmoTnroDljZXkuI3lrozlhajlrp7njrDvvIzor7flv73nlaXjgILlj6rmnInlvZNXZWJVcGxvYWRlcuiiq+WQiOW5tuaIkOS4gOS4quaWh+S7tueahOaXtuWAmeaJjeS8muW8leWFpeOAglxuICovXG4oZnVuY3Rpb24oIHJvb3QsIGZhY3RvcnkgKSB7XG4gICAgdmFyIG1vZHVsZXMgPSB7fSxcblxuICAgICAgICAvLyDlhoXpg6hyZXF1aXJlLCDnroDljZXkuI3lrozlhajlrp7njrDjgIJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FtZGpzL2FtZGpzLWFwaS93aWtpL3JlcXVpcmVcbiAgICAgICAgX3JlcXVpcmUgPSBmdW5jdGlvbiggZGVwcywgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICB2YXIgYXJncywgbGVuLCBpO1xuXG4gICAgICAgICAgICAvLyDlpoLmnpxkZXBz5LiN5piv5pWw57uE77yM5YiZ55u05o6l6L+U5Zue5oyH5a6abW9kdWxlXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBkZXBzID09PSAnc3RyaW5nJyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0TW9kdWxlKCBkZXBzICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoIGxlbiA9IGRlcHMubGVuZ3RoLCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goIGdldE1vZHVsZSggZGVwc1sgaSBdICkgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoIG51bGwsIGFyZ3MgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyDlhoXpg6hkZWZpbmXvvIzmmoLml7bkuI3mlK/mjIHkuI3mjIflrpppZC5cbiAgICAgICAgX2RlZmluZSA9IGZ1bmN0aW9uKCBpZCwgZGVwcywgZmFjdG9yeSApIHtcbiAgICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMiApIHtcbiAgICAgICAgICAgICAgICBmYWN0b3J5ID0gZGVwcztcbiAgICAgICAgICAgICAgICBkZXBzID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3JlcXVpcmUoIGRlcHMgfHwgW10sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldE1vZHVsZSggaWQsIGZhY3RvcnksIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g6K6+572ubW9kdWxlLCDlhbzlrrlDb21tb25Kc+WGmeazleOAglxuICAgICAgICBzZXRNb2R1bGUgPSBmdW5jdGlvbiggaWQsIGZhY3RvcnksIGFyZ3MgKSB7XG4gICAgICAgICAgICB2YXIgbW9kdWxlID0ge1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzOiBmYWN0b3J5XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXR1cm5lZDtcblxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yeSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCB8fCAoYXJncyA9IFsgX3JlcXVpcmUsIG1vZHVsZS5leHBvcnRzLCBtb2R1bGUgXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuZWQgPSBmYWN0b3J5LmFwcGx5KCBudWxsLCBhcmdzICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuZWQgIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSByZXR1cm5lZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1vZHVsZXNbIGlkIF0gPSBtb2R1bGUuZXhwb3J0cztcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDmoLnmja5pZOiOt+WPlm1vZHVsZVxuICAgICAgICBnZXRNb2R1bGUgPSBmdW5jdGlvbiggaWQgKSB7XG4gICAgICAgICAgICB2YXIgbW9kdWxlID0gbW9kdWxlc1sgaWQgXSB8fCByb290WyBpZCBdO1xuXG4gICAgICAgICAgICBpZiAoICFtb2R1bGUgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnYCcgKyBpZCArICdgIGlzIHVuZGVmaW5lZCcgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDlsIbmiYDmnIltb2R1bGVz77yM5bCG6Lev5b6EaWRz6KOF5o2i5oiQ5a+56LGh44CCXG4gICAgICAgIGV4cG9ydHNUbyA9IGZ1bmN0aW9uKCBvYmogKSB7XG4gICAgICAgICAgICB2YXIga2V5LCBob3N0LCBwYXJ0cywgcGFydCwgbGFzdCwgdWNGaXJzdDtcblxuICAgICAgICAgICAgLy8gbWFrZSB0aGUgZmlyc3QgY2hhcmFjdGVyIHVwcGVyIGNhc2UuXG4gICAgICAgICAgICB1Y0ZpcnN0ID0gZnVuY3Rpb24oIHN0ciApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyICYmIChzdHIuY2hhckF0KCAwICkudG9VcHBlckNhc2UoKSArIHN0ci5zdWJzdHIoIDEgKSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKCBrZXkgaW4gbW9kdWxlcyApIHtcbiAgICAgICAgICAgICAgICBob3N0ID0gb2JqO1xuXG4gICAgICAgICAgICAgICAgaWYgKCAhbW9kdWxlcy5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhcnRzID0ga2V5LnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgbGFzdCA9IHVjRmlyc3QoIHBhcnRzLnBvcCgpICk7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSggKHBhcnQgPSB1Y0ZpcnN0KCBwYXJ0cy5zaGlmdCgpICkpICkge1xuICAgICAgICAgICAgICAgICAgICBob3N0WyBwYXJ0IF0gPSBob3N0WyBwYXJ0IF0gfHwge307XG4gICAgICAgICAgICAgICAgICAgIGhvc3QgPSBob3N0WyBwYXJ0IF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaG9zdFsgbGFzdCBdID0gbW9kdWxlc1sga2V5IF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXhwb3J0cyA9IGZhY3RvcnkoIHJvb3QsIF9kZWZpbmUsIF9yZXF1aXJlICksXG4gICAgICAgIG9yaWdpbjtcblxuICAgIC8vIGV4cG9ydHMgZXZlcnkgbW9kdWxlLlxuICAgIGV4cG9ydHNUbyggZXhwb3J0cyApO1xuXG4gICAgaWYgKCB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuXG4gICAgICAgIC8vIEZvciBDb21tb25KUyBhbmQgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgd2hlcmUgYSBwcm9wZXIgd2luZG93IGlzIHByZXNlbnQsXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZXhwb3J0cztcbiAgICB9IGVsc2UgaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG5cbiAgICAgICAgLy8gQWxsb3cgdXNpbmcgdGhpcyBidWlsdCBsaWJyYXJ5IGFzIGFuIEFNRCBtb2R1bGVcbiAgICAgICAgLy8gaW4gYW5vdGhlciBwcm9qZWN0LiBUaGF0IG90aGVyIHByb2plY3Qgd2lsbCBvbmx5XG4gICAgICAgIC8vIHNlZSB0aGlzIEFNRCBjYWxsLCBub3QgdGhlIGludGVybmFsIG1vZHVsZXMgaW5cbiAgICAgICAgLy8gdGhlIGNsb3N1cmUgYmVsb3cuXG4gICAgICAgIGRlZmluZShbXSwgZXhwb3J0cyApO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gQnJvd3NlciBnbG9iYWxzIGNhc2UuIEp1c3QgYXNzaWduIHRoZVxuICAgICAgICAvLyByZXN1bHQgdG8gYSBwcm9wZXJ0eSBvbiB0aGUgZ2xvYmFsLlxuICAgICAgICBvcmlnaW4gPSByb290LldlYlVwbG9hZGVyO1xuICAgICAgICByb290LldlYlVwbG9hZGVyID0gZXhwb3J0cztcbiAgICAgICAgcm9vdC5XZWJVcGxvYWRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByb290LldlYlVwbG9hZGVyID0gb3JpZ2luO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCB0aGlzLCBmdW5jdGlvbiggd2luZG93LCBkZWZpbmUsIHJlcXVpcmUgKSB7XG5cblxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgalF1ZXJ5IG9yIFplcHRvXG4gICAgICovXG4gICAgZGVmaW5lKCdkb2xsYXItdGhpcmQnLFtdLGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gd2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG87XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBEb20g5pON5L2c55u45YWzXG4gICAgICovXG4gICAgZGVmaW5lKCdkb2xsYXInLFtcbiAgICAgICAgJ2RvbGxhci10aGlyZCdcbiAgICBdLCBmdW5jdGlvbiggXyApIHtcbiAgICAgICAgcmV0dXJuIF87XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDkvb/nlKhqUXVlcnnnmoRQcm9taXNlXG4gICAgICovXG4gICAgZGVmaW5lKCdwcm9taXNlLXRoaXJkJyxbXG4gICAgICAgICdkb2xsYXInXG4gICAgXSwgZnVuY3Rpb24oICQgKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBEZWZlcnJlZDogJC5EZWZlcnJlZCxcbiAgICAgICAgICAgIHdoZW46ICQud2hlbixcbiAgICBcbiAgICAgICAgICAgIGlzUHJvbWlzZTogZnVuY3Rpb24oIGFueXRoaW5nICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbnl0aGluZyAmJiB0eXBlb2YgYW55dGhpbmcudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFByb21pc2UvQStcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3Byb21pc2UnLFtcbiAgICAgICAgJ3Byb21pc2UtdGhpcmQnXG4gICAgXSwgZnVuY3Rpb24oIF8gKSB7XG4gICAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5Z+656GA57G75pa55rOV44CCXG4gICAgICovXG4gICAgXG4gICAgLyoqXG4gICAgICogV2ViIFVwbG9hZGVy5YaF6YOo57G755qE6K+m57uG6K+05piO77yM5Lul5LiL5o+Q5Y+K55qE5Yqf6IO957G777yM6YO95Y+v5Lul5ZyoYFdlYlVwbG9hZGVyYOi/meS4quWPmOmHj+S4reiuv+mXruWIsOOAglxuICAgICAqXG4gICAgICogQXMgeW91IGtub3csIFdlYiBVcGxvYWRlcueahOavj+S4quaWh+S7tumDveaYr+eUqOi/h1tBTURdKGh0dHBzOi8vZ2l0aHViLmNvbS9hbWRqcy9hbWRqcy1hcGkvd2lraS9BTUQp6KeE6IyD5Lit55qEYGRlZmluZWDnu4Tnu4fotbfmnaXnmoQsIOavj+S4qk1vZHVsZemDveS8muacieS4qm1vZHVsZSBpZC5cbiAgICAgKiDpu5jorqRtb2R1bGUgaWTor6Xmlofku7bnmoTot6/lvoTvvIzogIzmraTot6/lvoTlsIbkvJrovazljJbmiJDlkI3lrZfnqbrpl7TlrZjmlL7lnKhXZWJVcGxvYWRlcuS4reOAguWmgu+8mlxuICAgICAqXG4gICAgICogKiBtb2R1bGUgYGJhc2Vg77yaV2ViVXBsb2FkZXIuQmFzZVxuICAgICAqICogbW9kdWxlIGBmaWxlYDogV2ViVXBsb2FkZXIuRmlsZVxuICAgICAqICogbW9kdWxlIGBsaWIvZG5kYDogV2ViVXBsb2FkZXIuTGliLkRuZFxuICAgICAqICogbW9kdWxlIGBydW50aW1lL2h0bWw1L2RuZGA6IFdlYlVwbG9hZGVyLlJ1bnRpbWUuSHRtbDUuRG5kXG4gICAgICpcbiAgICAgKlxuICAgICAqIOS7peS4i+aWh+aho+WwhuWPr+iDveecgeeVpWBXZWJVcGxvYWRlcmDliY3nvIDjgIJcbiAgICAgKiBAbW9kdWxlIFdlYlVwbG9hZGVyXG4gICAgICogQHRpdGxlIFdlYlVwbG9hZGVyIEFQSeaWh+aho1xuICAgICAqL1xuICAgIGRlZmluZSgnYmFzZScsW1xuICAgICAgICAnZG9sbGFyJyxcbiAgICAgICAgJ3Byb21pc2UnXG4gICAgXSwgZnVuY3Rpb24oICQsIHByb21pc2UgKSB7XG4gICAgXG4gICAgICAgIHZhciBub29wID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIGNhbGwgPSBGdW5jdGlvbi5jYWxsO1xuICAgIFxuICAgICAgICAvLyBodHRwOi8vanNwZXJmLmNvbS91bmN1cnJ5dGhpc1xuICAgICAgICAvLyDlj43np5Hph4zljJZcbiAgICAgICAgZnVuY3Rpb24gdW5jdXJyeVRoaXMoIGZuICkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsLmFwcGx5KCBmbiwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGJpbmRGbiggZm4sIGNvbnRleHQgKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KCBjb250ZXh0LCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlT2JqZWN0KCBwcm90byApIHtcbiAgICAgICAgICAgIHZhciBmO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBPYmplY3QuY3JlYXRlICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuY3JlYXRlKCBwcm90byApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmID0gZnVuY3Rpb24oKSB7fTtcbiAgICAgICAgICAgICAgICBmLnByb3RvdHlwZSA9IHByb3RvO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgXG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDln7rnoYDnsbvvvIzmj5DkvpvkuIDkupvnroDljZXluLjnlKjnmoTmlrnms5XjgIJcbiAgICAgICAgICogQGNsYXNzIEJhc2VcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSB2ZXJzaW9uIOW9k+WJjeeJiOacrOWPt+OAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB2ZXJzaW9uOiAnMC4xLjInLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge2pRdWVyeXxaZXB0b30gJCDlvJXnlKjkvp3otZbnmoRqUXVlcnnmiJbogIVaZXB0b+WvueixoeOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAkOiAkLFxuICAgIFxuICAgICAgICAgICAgRGVmZXJyZWQ6IHByb21pc2UuRGVmZXJyZWQsXG4gICAgXG4gICAgICAgICAgICBpc1Byb21pc2U6IHByb21pc2UuaXNQcm9taXNlLFxuICAgIFxuICAgICAgICAgICAgd2hlbjogcHJvbWlzZS53aGVuLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gIOeugOWNleeahOa1j+iniOWZqOajgOafpee7k+aenOOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICogYHdlYmtpdGAgIHdlYmtpdOeJiOacrOWPt++8jOWmguaenOa1j+iniOWZqOS4uumdnndlYmtpdOWGheaguO+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCXG4gICAgICAgICAgICAgKiAqIGBjaHJvbWVgICBjaHJvbWXmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLpjaHJvbWXvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgaWVgICBpZea1j+iniOWZqOeJiOacrOWPt++8jOWmguaenOa1j+iniOWZqOS4uumdnmll77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIIqKuaaguS4jeaUr+aMgWllMTArKipcbiAgICAgICAgICAgICAqICogYGZpcmVmb3hgICBmaXJlZm945rWP6KeI5Zmo54mI5pys5Y+377yM5aaC5p6c5rWP6KeI5Zmo5Li66Z2eZmlyZWZveO+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCXG4gICAgICAgICAgICAgKiAqIGBzYWZhcmlgICBzYWZhcmnmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ5zYWZhcmnvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgb3BlcmFgICBvcGVyYea1j+iniOWZqOeJiOacrOWPt++8jOWmguaenOa1j+iniOWZqOS4uumdnm9wZXJh77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW2Jyb3dzZXJdXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGJyb3dzZXI6IChmdW5jdGlvbiggdWEgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxuICAgICAgICAgICAgICAgICAgICB3ZWJraXQgPSB1YS5tYXRjaCggL1dlYktpdFxcLyhbXFxkLl0rKS8gKSxcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lID0gdWEubWF0Y2goIC9DaHJvbWVcXC8oW1xcZC5dKykvICkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVhLm1hdGNoKCAvQ3JpT1NcXC8oW1xcZC5dKykvICksXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGllID0gdWEubWF0Y2goIC9NU0lFXFxzKFtcXGRcXC5dKykvICkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVhLm1hdGNoKC8oPzp0cmlkZW50KSg/Oi4qcnY6KFtcXHcuXSspKT8vaSksXG4gICAgICAgICAgICAgICAgICAgIGZpcmVmb3ggPSB1YS5tYXRjaCggL0ZpcmVmb3hcXC8oW1xcZC5dKykvICksXG4gICAgICAgICAgICAgICAgICAgIHNhZmFyaSA9IHVhLm1hdGNoKCAvU2FmYXJpXFwvKFtcXGQuXSspLyApLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYSA9IHVhLm1hdGNoKCAvT1BSXFwvKFtcXGQuXSspLyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHdlYmtpdCAmJiAocmV0LndlYmtpdCA9IHBhcnNlRmxvYXQoIHdlYmtpdFsgMSBdICkpO1xuICAgICAgICAgICAgICAgIGNocm9tZSAmJiAocmV0LmNocm9tZSA9IHBhcnNlRmxvYXQoIGNocm9tZVsgMSBdICkpO1xuICAgICAgICAgICAgICAgIGllICYmIChyZXQuaWUgPSBwYXJzZUZsb2F0KCBpZVsgMSBdICkpO1xuICAgICAgICAgICAgICAgIGZpcmVmb3ggJiYgKHJldC5maXJlZm94ID0gcGFyc2VGbG9hdCggZmlyZWZveFsgMSBdICkpO1xuICAgICAgICAgICAgICAgIHNhZmFyaSAmJiAocmV0LnNhZmFyaSA9IHBhcnNlRmxvYXQoIHNhZmFyaVsgMSBdICkpO1xuICAgICAgICAgICAgICAgIG9wZXJhICYmIChyZXQub3BlcmEgPSBwYXJzZUZsb2F0KCBvcGVyYVsgMSBdICkpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9KSggbmF2aWdhdG9yLnVzZXJBZ2VudCApLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gIOaTjeS9nOezu+e7n+ajgOafpee7k+aenOOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICogYGFuZHJvaWRgICDlpoLmnpzlnKhhbmRyb2lk5rWP6KeI5Zmo546v5aKD5LiL77yM5q2k5YC85Li65a+55bqU55qEYW5kcm9pZOeJiOacrOWPt++8jOWQpuWImeS4umB1bmRlZmluZWRg44CCXG4gICAgICAgICAgICAgKiAqIGBpb3NgIOWmguaenOWcqGlvc+a1j+iniOWZqOeOr+Wig+S4i++8jOatpOWAvOS4uuWvueW6lOeahGlvc+eJiOacrOWPt++8jOWQpuWImeS4umB1bmRlZmluZWRg44CCXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW29zXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvczogKGZ1bmN0aW9uKCB1YSApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0ge30sXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIG9zeCA9ICEhdWEubWF0Y2goIC9cXChNYWNpbnRvc2hcXDsgSW50ZWwgLyApLFxuICAgICAgICAgICAgICAgICAgICBhbmRyb2lkID0gdWEubWF0Y2goIC8oPzpBbmRyb2lkKTs/W1xcc1xcL10rKFtcXGQuXSspPy8gKSxcbiAgICAgICAgICAgICAgICAgICAgaW9zID0gdWEubWF0Y2goIC8oPzppUGFkfGlQb2R8aVBob25lKS4qT1NcXHMoW1xcZF9dKykvICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gb3N4ICYmIChyZXQub3N4ID0gdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYW5kcm9pZCAmJiAocmV0LmFuZHJvaWQgPSBwYXJzZUZsb2F0KCBhbmRyb2lkWyAxIF0gKSk7XG4gICAgICAgICAgICAgICAgaW9zICYmIChyZXQuaW9zID0gcGFyc2VGbG9hdCggaW9zWyAxIF0ucmVwbGFjZSggL18vZywgJy4nICkgKSk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH0pKCBuYXZpZ2F0b3IudXNlckFnZW50ICksXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWunueOsOexu+S4juexu+S5i+mXtOeahOe7p+aJv+OAglxuICAgICAgICAgICAgICogQG1ldGhvZCBpbmhlcml0c1xuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5pbmhlcml0cyggc3VwZXIgKSA9PiBjaGlsZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5pbmhlcml0cyggc3VwZXIsIHByb3RvcyApID0+IGNoaWxkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmluaGVyaXRzKCBzdXBlciwgcHJvdG9zLCBzdGF0aWNzICkgPT4gY2hpbGRcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0NsYXNzfSBzdXBlciDniLbnsbtcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdCB8IEZ1bmN0aW9ufSBbcHJvdG9zXSDlrZDnsbvmiJbogIXlr7nosaHjgILlpoLmnpzlr7nosaHkuK3ljIXlkKtjb25zdHJ1Y3Rvcu+8jOWtkOexu+WwhuaYr+eUqOatpOWxnuaAp+WAvOOAglxuICAgICAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IFtwcm90b3MuY29uc3RydWN0b3JdIOWtkOexu+aehOmAoOWZqO+8jOS4jeaMh+WumueahOivneWwhuWIm+W7uuS4quS4tOaXtueahOebtOaOpeaJp+ihjOeItuexu+aehOmAoOWZqOeahOaWueazleOAglxuICAgICAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBbc3RhdGljc10g6Z2Z5oCB5bGe5oCn5oiW5pa55rOV44CCXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtDbGFzc30g6L+U5Zue5a2Q57G744CCXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogZnVuY3Rpb24gUGVyc29uKCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCAnU3VwZXInICk7XG4gICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgKiBQZXJzb24ucHJvdG90eXBlLmhlbGxvID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coICdoZWxsbycgKTtcbiAgICAgICAgICAgICAqIH07XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogdmFyIE1hbmFnZXIgPSBCYXNlLmluaGVyaXRzKCBQZXJzb24sIHtcbiAgICAgICAgICAgICAqICAgICB3b3JsZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCAnV29ybGQnICk7XG4gICAgICAgICAgICAgKiAgICAgfVxuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8g5Zug5Li65rKh5pyJ5oyH5a6a5p6E6YCg5Zmo77yM54i257G755qE5p6E6YCg5Zmo5bCG5Lya5omn6KGM44CCXG4gICAgICAgICAgICAgKiB2YXIgaW5zdGFuY2UgPSBuZXcgTWFuYWdlcigpOyAgICAvLyA9PiBTdXBlclxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOe7p+aJv+WtkOeItuexu+eahOaWueazlVxuICAgICAgICAgICAgICogaW5zdGFuY2UuaGVsbG8oKTsgICAgLy8gPT4gaGVsbG9cbiAgICAgICAgICAgICAqIGluc3RhbmNlLndvcmxkKCk7ICAgIC8vID0+IFdvcmxkXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8g5a2Q57G755qEX19zdXBlcl9f5bGe5oCn5oyH5ZCR54i257G7XG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggTWFuYWdlci5fX3N1cGVyX18gPT09IFBlcnNvbiApOyAgICAvLyA9PiB0cnVlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGluaGVyaXRzOiBmdW5jdGlvbiggU3VwZXIsIHByb3Rvcywgc3RhdGljUHJvdG9zICkge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZDtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBwcm90b3MgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkID0gcHJvdG9zO1xuICAgICAgICAgICAgICAgICAgICBwcm90b3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHByb3RvcyAmJiBwcm90b3MuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkID0gcHJvdG9zLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3VwZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpI3liLbpnZnmgIHmlrnms5VcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCggdHJ1ZSwgY2hpbGQsIFN1cGVyLCBzdGF0aWNQcm90b3MgfHwge30gKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvKiBqc2hpbnQgY2FtZWxjYXNlOiBmYWxzZSAqL1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOiuqeWtkOexu+eahF9fc3VwZXJfX+WxnuaAp+aMh+WQkeeItuexu+OAglxuICAgICAgICAgICAgICAgIGNoaWxkLl9fc3VwZXJfXyA9IFN1cGVyLnByb3RvdHlwZTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDmnoTlu7rljp/lnovvvIzmt7vliqDljp/lnovmlrnms5XmiJblsZ7mgKfjgIJcbiAgICAgICAgICAgICAgICAvLyDmmoLml7bnlKhPYmplY3QuY3JlYXRl5a6e546w44CCXG4gICAgICAgICAgICAgICAgY2hpbGQucHJvdG90eXBlID0gY3JlYXRlT2JqZWN0KCBTdXBlci5wcm90b3R5cGUgKTtcbiAgICAgICAgICAgICAgICBwcm90b3MgJiYgJC5leHRlbmQoIHRydWUsIGNoaWxkLnByb3RvdHlwZSwgcHJvdG9zICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5LiA5Liq5LiN5YGa5Lu75L2V5LqL5oOF55qE5pa55rOV44CC5Y+v5Lul55So5p2l6LWL5YC857uZ6buY6K6k55qEY2FsbGJhY2suXG4gICAgICAgICAgICAgKiBAbWV0aG9kIG5vb3BcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbm9vcDogbm9vcCxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6L+U5Zue5LiA5Liq5paw55qE5pa55rOV77yM5q2k5pa55rOV5bCG5bey5oyH5a6a55qEYGNvbnRleHRg5p2l5omn6KGM44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmJpbmRGbiggZm4sIGNvbnRleHQgKSA9PiBGdW5jdGlvblxuICAgICAgICAgICAgICogQG1ldGhvZCBiaW5kRm5cbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiB2YXIgZG9Tb21ldGhpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAqICAgICAgICAgY29uc29sZS5sb2coIHRoaXMubmFtZSApO1xuICAgICAgICAgICAgICogICAgIH0sXG4gICAgICAgICAgICAgKiAgICAgb2JqID0ge1xuICAgICAgICAgICAgICogICAgICAgICBuYW1lOiAnT2JqZWN0IE5hbWUnXG4gICAgICAgICAgICAgKiAgICAgfSxcbiAgICAgICAgICAgICAqICAgICBhbGlhc0ZuID0gQmFzZS5iaW5kKCBkb1NvbWV0aGluZywgb2JqICk7XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogIGFsaWFzRm4oKTsgICAgLy8gPT4gT2JqZWN0IE5hbWVcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGJpbmRGbjogYmluZEZuLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlvJXnlKhDb25zb2xlLmxvZ+WmguaenOWtmOWcqOeahOivne+8jOWQpuWImeW8leeUqOS4gOS4qlvnqbrlh73mlbBsb29wXSgjV2ViVXBsb2FkZXI6QmFzZS5sb2cp44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmxvZyggYXJncy4uLiApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQG1ldGhvZCBsb2dcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9nOiAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB3aW5kb3cuY29uc29sZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJpbmRGbiggY29uc29sZS5sb2csIGNvbnNvbGUgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgICAgICAgICB9KSgpLFxuICAgIFxuICAgICAgICAgICAgbmV4dFRpY2s6IChmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGNiICkge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCBjYiwgMSApO1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gQGJ1ZyDlvZPmtY/op4jlmajkuI3lnKjlvZPliY3nqpflj6Pml7blsLHlgZzkuobjgIJcbiAgICAgICAgICAgICAgICAvLyB2YXIgbmV4dCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAvLyAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgIC8vICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgLy8gICAgIGZ1bmN0aW9uKCBjYiApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCBjYiwgMTAwMCAvIDYwICk7XG4gICAgICAgICAgICAgICAgLy8gICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gLy8gZml4OiBVbmNhdWdodCBUeXBlRXJyb3I6IElsbGVnYWwgaW52b2NhdGlvblxuICAgICAgICAgICAgICAgIC8vIHJldHVybiBiaW5kRm4oIG5leHQsIHdpbmRvdyApO1xuICAgICAgICAgICAgfSkoKSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6KKrW3VuY3Vycnl0aGlzXShodHRwOi8vd3d3LjJhbGl0eS5jb20vMjAxMS8xMS91bmN1cnJ5aW5nLXRoaXMuaHRtbCnnmoTmlbDnu4RzbGljZeaWueazleOAglxuICAgICAgICAgICAgICog5bCG55So5p2l5bCG6Z2e5pWw57uE5a+56LGh6L2s5YyW5oiQ5pWw57uE5a+56LGh44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLnNsaWNlKCB0YXJnZXQsIHN0YXJ0WywgZW5kXSApID0+IEFycmF5XG4gICAgICAgICAgICAgKiBAbWV0aG9kIHNsaWNlXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogZnVuY3Rpb24gZG9Tb210aGluZygpIHtcbiAgICAgICAgICAgICAqICAgICB2YXIgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cywgMSApO1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCBhcmdzICk7XG4gICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogZG9Tb210aGluZyggJ2lnbm9yZWQnLCAnYXJnMicsICdhcmczJyApOyAgICAvLyA9PiBBcnJheSBbXCJhcmcyXCIsIFwiYXJnM1wiXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzbGljZTogdW5jdXJyeVRoaXMoIFtdLnNsaWNlICksXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOeUn+aIkOWUr+S4gOeahElEXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGd1aWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZ3VpZCgpID0+IFN0cmluZ1xuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5ndWlkKCBwcmVmeCApID0+IFN0cmluZ1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBndWlkOiAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvdW50ZXIgPSAwO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiggcHJlZml4ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3VpZCA9ICgrbmV3IERhdGUoKSkudG9TdHJpbmcoIDMyICksXG4gICAgICAgICAgICAgICAgICAgICAgICBpID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggOyBpIDwgNTsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3VpZCArPSBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogNjU1MzUgKS50b1N0cmluZyggMzIgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHByZWZpeCB8fCAnd3VfJykgKyBndWlkICsgKGNvdW50ZXIrKykudG9TdHJpbmcoIDMyICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKCksXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOagvOW8j+WMluaWh+S7tuWkp+Wwjywg6L6T5Ye65oiQ5bim5Y2V5L2N55qE5a2X56ym5LiyXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGZvcm1hdFNpemVcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZm9ybWF0U2l6ZSggc2l6ZSApID0+IFN0cmluZ1xuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5mb3JtYXRTaXplKCBzaXplLCBwb2ludExlbmd0aCApID0+IFN0cmluZ1xuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5mb3JtYXRTaXplKCBzaXplLCBwb2ludExlbmd0aCwgdW5pdHMgKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzaXplIOaWh+S7tuWkp+Wwj1xuICAgICAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwb2ludExlbmd0aD0yXSDnsr7noa7liLDnmoTlsI/mlbDngrnmlbDjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IFt1bml0cz1bICdCJywgJ0snLCAnTScsICdHJywgJ1RCJyBdXSDljZXkvY3mlbDnu4TjgILku47lrZfoioLvvIzliLDljYPlrZfoioLvvIzkuIDnm7TlvoDkuIrmjIflrprjgILlpoLmnpzljZXkvY3mlbDnu4Tph4zpnaLlj6rmjIflrprkuobliLDkuoZLKOWNg+Wtl+iKginvvIzlkIzml7bmlofku7blpKflsI/lpKfkuo5NLCDmraTmlrnms5XnmoTovpPlh7rlsIbov5jmmK/mmL7npLrmiJDlpJrlsJFLLlxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMCApICk7ICAgIC8vID0+IDEwMEJcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMjQgKSApOyAgICAvLyA9PiAxLjAwS1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCwgMCApICk7ICAgIC8vID0+IDFLXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDI0ICogMTAyNCApICk7ICAgIC8vID0+IDEuMDBNXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDI0ICogMTAyNCAqIDEwMjQgKSApOyAgICAvLyA9PiAxLjAwR1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCAqIDEwMjQgKiAxMDI0LCAwLCBbJ0InLCAnS0InLCAnTUInXSApICk7ICAgIC8vID0+IDEwMjRNQlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmb3JtYXRTaXplOiBmdW5jdGlvbiggc2l6ZSwgcG9pbnRMZW5ndGgsIHVuaXRzICkge1xuICAgICAgICAgICAgICAgIHZhciB1bml0O1xuICAgIFxuICAgICAgICAgICAgICAgIHVuaXRzID0gdW5pdHMgfHwgWyAnQicsICdLJywgJ00nLCAnRycsICdUQicgXTtcbiAgICBcbiAgICAgICAgICAgICAgICB3aGlsZSAoICh1bml0ID0gdW5pdHMuc2hpZnQoKSkgJiYgc2l6ZSA+IDEwMjQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpemUgPSBzaXplIC8gMTAyNDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuICh1bml0ID09PSAnQicgPyBzaXplIDogc2l6ZS50b0ZpeGVkKCBwb2ludExlbmd0aCB8fCAyICkpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICog5LqL5Lu25aSE55CG57G777yM5Y+v5Lul54us56uL5L2/55So77yM5Lmf5Y+v5Lul5omp5bGV57uZ5a+56LGh5L2/55So44CCXG4gICAgICogQGZpbGVPdmVydmlldyBNZWRpYXRvclxuICAgICAqL1xuICAgIGRlZmluZSgnbWVkaWF0b3InLFtcbiAgICAgICAgJ2Jhc2UnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UgKSB7XG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgc2xpY2UgPSBbXS5zbGljZSxcbiAgICAgICAgICAgIHNlcGFyYXRvciA9IC9cXHMrLyxcbiAgICAgICAgICAgIHByb3RvcztcbiAgICBcbiAgICAgICAgLy8g5qC55o2u5p2h5Lu26L+H5ruk5Ye65LqL5Lu2aGFuZGxlcnMuXG4gICAgICAgIGZ1bmN0aW9uIGZpbmRIYW5kbGVycyggYXJyLCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCApIHtcbiAgICAgICAgICAgIHJldHVybiAkLmdyZXAoIGFyciwgZnVuY3Rpb24oIGhhbmRsZXIgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICghbmFtZSB8fCBoYW5kbGVyLmUgPT09IG5hbWUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoIWNhbGxiYWNrIHx8IGhhbmRsZXIuY2IgPT09IGNhbGxiYWNrIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmNiLl9jYiA9PT0gY2FsbGJhY2spICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoIWNvbnRleHQgfHwgaGFuZGxlci5jdHggPT09IGNvbnRleHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgZnVuY3Rpb24gZWFjaEV2ZW50KCBldmVudHMsIGNhbGxiYWNrLCBpdGVyYXRvciApIHtcbiAgICAgICAgICAgIC8vIOS4jeaUr+aMgeWvueixoe+8jOWPquaUr+aMgeWkmuS4qmV2ZW5055So56m65qC86ZqU5byAXG4gICAgICAgICAgICAkLmVhY2goIChldmVudHMgfHwgJycpLnNwbGl0KCBzZXBhcmF0b3IgKSwgZnVuY3Rpb24oIF8sIGtleSApIHtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcigga2V5LCBjYWxsYmFjayApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgZnVuY3Rpb24gdHJpZ2dlckhhbmRlcnMoIGV2ZW50cywgYXJncyApIHtcbiAgICAgICAgICAgIHZhciBzdG9wZWQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpID0gLTEsXG4gICAgICAgICAgICAgICAgbGVuID0gZXZlbnRzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBoYW5kbGVyO1xuICAgIFxuICAgICAgICAgICAgd2hpbGUgKCArK2kgPCBsZW4gKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlciA9IGV2ZW50c1sgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggaGFuZGxlci5jYi5hcHBseSggaGFuZGxlci5jdHgyLCBhcmdzICkgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgICAgICAgICBzdG9wZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gIXN0b3BlZDtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBwcm90b3MgPSB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe7keWumuS6i+S7tuOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGBjYWxsYmFja2Dmlrnms5XlnKjmiafooYzml7bvvIxhcmd1bWVudHPlsIbkvJrmnaXmupDkuo50cmlnZ2Vy55qE5pe25YCZ5pC65bim55qE5Y+C5pWw44CC5aaCXG4gICAgICAgICAgICAgKiBgYGBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgKiB2YXIgb2JqID0ge307XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8g5L2/5b6Xb2Jq5pyJ5LqL5Lu26KGM5Li6XG4gICAgICAgICAgICAgKiBNZWRpYXRvci5pbnN0YWxsVG8oIG9iaiApO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIG9iai5vbiggJ3Rlc3RhJywgZnVuY3Rpb24oIGFyZzEsIGFyZzIgKSB7XG4gICAgICAgICAgICAgKiAgICAgY29uc29sZS5sb2coIGFyZzEsIGFyZzIgKTsgLy8gPT4gJ2FyZzEnLCAnYXJnMidcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIG9iai50cmlnZ2VyKCAndGVzdGEnLCAnYXJnMScsICdhcmcyJyApO1xuICAgICAgICAgICAgICogYGBgXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICog5aaC5p6cYGNhbGxiYWNrYOS4re+8jOafkOS4gOS4quaWueazlWByZXR1cm4gZmFsc2Vg5LqG77yM5YiZ5ZCO57ut55qE5YW25LuWYGNhbGxiYWNrYOmDveS4jeS8muiiq+aJp+ihjOWIsOOAglxuICAgICAgICAgICAgICog5YiH5Lya5b2x5ZON5YiwYHRyaWdnZXJg5pa55rOV55qE6L+U5Zue5YC877yM5Li6YGZhbHNlYOOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGBvbmDov5jlj6/ku6XnlKjmnaXmt7vliqDkuIDkuKrnibnmrorkuovku7ZgYWxsYCwg6L+Z5qC35omA5pyJ55qE5LqL5Lu26Kem5Y+R6YO95Lya5ZON5bqU5Yiw44CC5ZCM5pe25q2k57G7YGNhbGxiYWNrYOS4reeahGFyZ3VtZW50c+acieS4gOS4quS4jeWQjOWkhO+8jFxuICAgICAgICAgICAgICog5bCx5piv56ys5LiA5Liq5Y+C5pWw5Li6YHR5cGVg77yM6K6w5b2V5b2T5YmN5piv5LuA5LmI5LqL5Lu25Zyo6Kem5Y+R44CC5q2k57G7YGNhbGxiYWNrYOeahOS8mOWFiOe6p+avlOiEmuS9ju+8jOS8muWGjeato+W4uGBjYWxsYmFja2DmiafooYzlrozlkI7op6blj5HjgIJcbiAgICAgICAgICAgICAqIGBgYGphdmFzY3JpcHRcbiAgICAgICAgICAgICAqIG9iai5vbiggJ2FsbCcsIGZ1bmN0aW9uKCB0eXBlLCBhcmcxLCBhcmcyICkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCB0eXBlLCBhcmcxLCBhcmcyICk7IC8vID0+ICd0ZXN0YScsICdhcmcxJywgJ2FyZzInXG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb25cbiAgICAgICAgICAgICAqIEBncmFtbWFyIG9uKCBuYW1lLCBjYWxsYmFja1ssIGNvbnRleHRdICkgPT4gc2VsZlxuICAgICAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSAgIG5hbWUgICAgIOS6i+S7tuWQje+8jOaUr+aMgeWkmuS4quS6i+S7tueUqOepuuagvOmalOW8gFxuICAgICAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIOS6i+S7tuWkhOeQhuWZqFxuICAgICAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSAgIFtjb250ZXh0XSAg5LqL5Lu25aSE55CG5Zmo55qE5LiK5LiL5paH44CCXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzZWxmfSDov5Tlm57oh6rouqvvvIzmlrnkvr/pk77lvI9cbiAgICAgICAgICAgICAqIEBjaGFpbmFibGVcbiAgICAgICAgICAgICAqIEBjbGFzcyBNZWRpYXRvclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvbjogZnVuY3Rpb24oIG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0ICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHNldDtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHNldCA9IHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0gW10pO1xuICAgIFxuICAgICAgICAgICAgICAgIGVhY2hFdmVudCggbmFtZSwgY2FsbGJhY2ssIGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB7IGU6IG5hbWUgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jYiA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmN0eCA9IGNvbnRleHQ7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuY3R4MiA9IGNvbnRleHQgfHwgbWU7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuaWQgPSBzZXQubGVuZ3RoO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBzZXQucHVzaCggaGFuZGxlciApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog57uR5a6a5LqL5Lu277yM5LiU5b2TaGFuZGxlcuaJp+ihjOWujOWQju+8jOiHquWKqOino+mZpOe7keWumuOAglxuICAgICAgICAgICAgICogQG1ldGhvZCBvbmNlXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvbmNlKCBuYW1lLCBjYWxsYmFja1ssIGNvbnRleHRdICkgPT4gc2VsZlxuICAgICAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSAgIG5hbWUgICAgIOS6i+S7tuWQjVxuICAgICAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIOS6i+S7tuWkhOeQhuWZqFxuICAgICAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSAgIFtjb250ZXh0XSAg5LqL5Lu25aSE55CG5Zmo55qE5LiK5LiL5paH44CCXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzZWxmfSDov5Tlm57oh6rouqvvvIzmlrnkvr/pk77lvI9cbiAgICAgICAgICAgICAqIEBjaGFpbmFibGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25jZTogZnVuY3Rpb24oIG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0ICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZWFjaEV2ZW50KCBuYW1lLCBjYWxsYmFjaywgZnVuY3Rpb24oIG5hbWUsIGNhbGxiYWNrICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb25jZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9mZiggbmFtZSwgb25jZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSggY29udGV4dCB8fCBtZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBvbmNlLl9jYiA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgICAgICBtZS5vbiggbmFtZSwgb25jZSwgY29udGV4dCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBtZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOino+mZpOS6i+S7tue7keWumlxuICAgICAgICAgICAgICogQG1ldGhvZCBvZmZcbiAgICAgICAgICAgICAqIEBncmFtbWFyIG9mZiggW25hbWVbLCBjYWxsYmFja1ssIGNvbnRleHRdIF0gXSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBbbmFtZV0gICAgIOS6i+S7tuWQjVxuICAgICAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IFtjYWxsYmFja10g5LqL5Lu25aSE55CG5ZmoXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgW2NvbnRleHRdICDkuovku7blpITnkIblmajnmoTkuIrkuIvmlofjgIJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3NlbGZ9IOi/lOWbnuiHqui6q++8jOaWueS+v+mTvuW8j1xuICAgICAgICAgICAgICogQGNoYWluYWJsZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvZmY6IGZ1bmN0aW9uKCBuYW1lLCBjYiwgY3R4ICkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhZXZlbnRzICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhbmFtZSAmJiAhY2IgJiYgIWN0eCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBlYWNoRXZlbnQoIG5hbWUsIGNiLCBmdW5jdGlvbiggbmFtZSwgY2IgKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZWFjaCggZmluZEhhbmRsZXJzKCBldmVudHMsIG5hbWUsIGNiLCBjdHggKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXZlbnRzWyB0aGlzLmlkIF07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6Kem5Y+R5LqL5Lu2XG4gICAgICAgICAgICAgKiBAbWV0aG9kIHRyaWdnZXJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHRyaWdnZXIoIG5hbWVbLCBhcmdzLi4uXSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICB0eXBlICAgICDkuovku7blkI1cbiAgICAgICAgICAgICAqIEBwYXJhbSAgeyp9IFsuLi5dIOS7u+aEj+WPguaVsFxuICAgICAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0g5aaC5p6caGFuZGxlcuS4rXJldHVybiBmYWxzZeS6hu+8jOWImei/lOWbnmZhbHNlLCDlkKbliJnov5Tlm550cnVlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzLCBldmVudHMsIGFsbEV2ZW50cztcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICF0aGlzLl9ldmVudHMgfHwgIXR5cGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBhcmdzID0gc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICk7XG4gICAgICAgICAgICAgICAgZXZlbnRzID0gZmluZEhhbmRsZXJzKCB0aGlzLl9ldmVudHMsIHR5cGUgKTtcbiAgICAgICAgICAgICAgICBhbGxFdmVudHMgPSBmaW5kSGFuZGxlcnMoIHRoaXMuX2V2ZW50cywgJ2FsbCcgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpZ2dlckhhbmRlcnMoIGV2ZW50cywgYXJncyApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VySGFuZGVycyggYWxsRXZlbnRzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOS4reS7i+iAhe+8jOWug+acrOi6q+aYr+S4quWNleS+i++8jOS9huWPr+S7pemAmui/h1tpbnN0YWxsVG9dKCNXZWJVcGxvYWRlcjpNZWRpYXRvcjppbnN0YWxsVG8p5pa55rOV77yM5L2/5Lu75L2V5a+56LGh5YW35aSH5LqL5Lu26KGM5Li644CCXG4gICAgICAgICAqIOS4u+imgeebrueahOaYr+i0n+i0o+aooeWdl+S4juaooeWdl+S5i+mXtOeahOWQiOS9nO+8jOmZjeS9juiApuWQiOW6puOAglxuICAgICAgICAgKlxuICAgICAgICAgKiBAY2xhc3MgTWVkaWF0b3JcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWPr+S7pemAmui/h+i/meS4quaOpeWPo++8jOS9v+S7u+S9leWvueixoeWFt+Wkh+S6i+S7tuWKn+iDveOAglxuICAgICAgICAgICAgICogQG1ldGhvZCBpbnN0YWxsVG9cbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb2JqIOmcgOimgeWFt+Wkh+S6i+S7tuihjOS4uueahOWvueixoeOAglxuICAgICAgICAgICAgICogQHJldHVybiB7T2JqZWN0fSDov5Tlm55vYmouXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGluc3RhbGxUbzogZnVuY3Rpb24oIG9iaiApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJC5leHRlbmQoIG9iaiwgcHJvdG9zICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0sIHByb3RvcyApO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgVXBsb2FkZXLkuIrkvKDnsbtcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3VwbG9hZGVyJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuIrkvKDlhaXlj6PnsbvjgIJcbiAgICAgICAgICogQGNsYXNzIFVwbG9hZGVyXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAZ3JhbW1hciBuZXcgVXBsb2FkZXIoIG9wdHMgKSA9PiBVcGxvYWRlclxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB2YXIgdXBsb2FkZXIgPSBXZWJVcGxvYWRlci5VcGxvYWRlcih7XG4gICAgICAgICAqICAgICBzd2Y6ICdwYXRoX29mX3N3Zi9VcGxvYWRlci5zd2YnLFxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8g5byA6LW35YiG54mH5LiK5Lyg44CCXG4gICAgICAgICAqICAgICBjaHVua2VkOiB0cnVlXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gVXBsb2FkZXIoIG9wdHMgKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCggdHJ1ZSwge30sIFVwbG9hZGVyLm9wdGlvbnMsIG9wdHMgKTtcbiAgICAgICAgICAgIHRoaXMuX2luaXQoIHRoaXMub3B0aW9ucyApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIC8vIGRlZmF1bHQgT3B0aW9uc1xuICAgICAgICAvLyB3aWRnZXRz5Lit5pyJ55u45bqU5omp5bGVXG4gICAgICAgIFVwbG9hZGVyLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBVcGxvYWRlci5wcm90b3R5cGUgKTtcbiAgICBcbiAgICAgICAgLy8g5om56YeP5re75Yqg57qv5ZG95Luk5byP5pa55rOV44CCXG4gICAgICAgICQuZWFjaCh7XG4gICAgICAgICAgICB1cGxvYWQ6ICdzdGFydC11cGxvYWQnLFxuICAgICAgICAgICAgc3RvcDogJ3N0b3AtdXBsb2FkJyxcbiAgICAgICAgICAgIGdldEZpbGU6ICdnZXQtZmlsZScsXG4gICAgICAgICAgICBnZXRGaWxlczogJ2dldC1maWxlcycsXG4gICAgICAgICAgICBhZGRGaWxlOiAnYWRkLWZpbGUnLFxuICAgICAgICAgICAgYWRkRmlsZXM6ICdhZGQtZmlsZScsXG4gICAgICAgICAgICBzb3J0OiAnc29ydC1maWxlcycsXG4gICAgICAgICAgICByZW1vdmVGaWxlOiAncmVtb3ZlLWZpbGUnLFxuICAgICAgICAgICAgc2tpcEZpbGU6ICdza2lwLWZpbGUnLFxuICAgICAgICAgICAgcmV0cnk6ICdyZXRyeScsXG4gICAgICAgICAgICBpc0luUHJvZ3Jlc3M6ICdpcy1pbi1wcm9ncmVzcycsXG4gICAgICAgICAgICBtYWtlVGh1bWI6ICdtYWtlLXRodW1iJyxcbiAgICAgICAgICAgIGdldERpbWVuc2lvbjogJ2dldC1kaW1lbnNpb24nLFxuICAgICAgICAgICAgYWRkQnV0dG9uOiAnYWRkLWJ0bicsXG4gICAgICAgICAgICBnZXRSdW50aW1lVHlwZTogJ2dldC1ydW50aW1lLXR5cGUnLFxuICAgICAgICAgICAgcmVmcmVzaDogJ3JlZnJlc2gnLFxuICAgICAgICAgICAgZGlzYWJsZTogJ2Rpc2FibGUnLFxuICAgICAgICAgICAgZW5hYmxlOiAnZW5hYmxlJyxcbiAgICAgICAgICAgIHJlc2V0OiAncmVzZXQnXG4gICAgICAgIH0sIGZ1bmN0aW9uKCBmbiwgY29tbWFuZCApIHtcbiAgICAgICAgICAgIFVwbG9hZGVyLnByb3RvdHlwZVsgZm4gXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QoIGNvbW1hbmQsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBVcGxvYWRlci5wcm90b3R5cGUsIHtcbiAgICAgICAgICAgIHN0YXRlOiAncGVuZGluZycsXG4gICAgXG4gICAgICAgICAgICBfaW5pdDogZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5yZXF1ZXN0KCAnaW5pdCcsIG9wdHMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5zdGF0ZSA9ICdyZWFkeSc7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmiJbogIXorr7nva5VcGxvYWRlcumFjee9rumhueOAglxuICAgICAgICAgICAgICogQG1ldGhvZCBvcHRpb25cbiAgICAgICAgICAgICAqIEBncmFtbWFyIG9wdGlvbigga2V5ICkgPT4gKlxuICAgICAgICAgICAgICogQGdyYW1tYXIgb3B0aW9uKCBrZXksIHZhbCApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLy8g5Yid5aeL54q25oCB5Zu+54mH5LiK5Lyg5YmN5LiN5Lya5Y6L57ypXG4gICAgICAgICAgICAgKiB2YXIgdXBsb2FkZXIgPSBuZXcgV2ViVXBsb2FkZXIuVXBsb2FkZXIoe1xuICAgICAgICAgICAgICogICAgIHJlc2l6ZTogbnVsbDtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOS/ruaUueWQjuWbvueJh+S4iuS8oOWJje+8jOWwneivleWwhuWbvueJh+WOi+e8qeWIsDE2MDAgKiAxNjAwXG4gICAgICAgICAgICAgKiB1cGxvYWRlci5vcHRpb25zKCAncmVzaXplJywge1xuICAgICAgICAgICAgICogICAgIHdpZHRoOiAxNjAwLFxuICAgICAgICAgICAgICogICAgIGhlaWdodDogMTYwMFxuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9wdGlvbjogZnVuY3Rpb24oIGtleSwgdmFsICkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIHNldHRlclxuICAgICAgICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA+IDEgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggJC5pc1BsYWluT2JqZWN0KCB2YWwgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuaXNQbGFpbk9iamVjdCggb3B0c1sga2V5IF0gKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKCBvcHRzWyBrZXkgXSwgdmFsICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzWyBrZXkgXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7ICAgIC8vIGdldHRlclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5ID8gb3B0c1sga2V5IF0gOiBvcHRzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiOt+WPluaWh+S7tue7n+iuoeS/oeaBr+OAgui/lOWbnuS4gOS4quWMheWQq+S4gOS4i+S/oeaBr+eahOWvueixoeOAglxuICAgICAgICAgICAgICogKiBgc3VjY2Vzc051bWAg5LiK5Lyg5oiQ5Yqf55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGB1cGxvYWRGYWlsTnVtYCDkuIrkvKDlpLHotKXnmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqICogYGNhbmNlbE51bWAg6KKr5Yig6Zmk55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBpbnZhbGlkTnVtYCDml6DmlYjnmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqICogYHF1ZXVlTnVtYCDov5jlnKjpmJ/liJfkuK3nmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqIEBtZXRob2QgZ2V0U3RhdHNcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGdldFN0YXRzKCkgPT4gT2JqZWN0XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFN0YXRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdGhpcy5fbWdyLmdldFN0YXRzLmFwcGx5KCB0aGlzLl9tZ3IsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIHZhciBzdGF0cyA9IHRoaXMucmVxdWVzdCgnZ2V0LXN0YXRzJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc051bTogc3RhdHMubnVtT2ZTdWNjZXNzLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyB3aG8gY2FyZT9cbiAgICAgICAgICAgICAgICAgICAgLy8gcXVldWVGYWlsTnVtOiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxOdW06IHN0YXRzLm51bU9mQ2FuY2VsLFxuICAgICAgICAgICAgICAgICAgICBpbnZhbGlkTnVtOiBzdGF0cy5udW1PZkludmFsaWQsXG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZEZhaWxOdW06IHN0YXRzLm51bU9mVXBsb2FkRmFpbGVkLFxuICAgICAgICAgICAgICAgICAgICBxdWV1ZU51bTogc3RhdHMubnVtT2ZRdWV1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g6ZyA6KaB6YeN5YaZ5q2k5pa55rOV5p2l5p2l5pSv5oyBb3B0cy5vbkV2ZW505ZKMaW5zdGFuY2Uub25FdmVudOeahOWkhOeQhuWZqFxuICAgICAgICAgICAgdHJpZ2dlcjogZnVuY3Rpb24oIHR5cGUvKiwgYXJncy4uLiovICkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICksXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnb24nICsgdHlwZS5zdWJzdHJpbmcoIDAsIDEgKS50b1VwcGVyQ2FzZSgpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUuc3Vic3RyaW5nKCAxICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6LCD55So6YCa6L+Hb27mlrnms5Xms6jlhoznmoRoYW5kbGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgTWVkaWF0b3IudHJpZ2dlci5hcHBseSggdGhpcywgYXJndW1lbnRzICkgPT09IGZhbHNlIHx8XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDosIPnlKhvcHRzLm9uRXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICQuaXNGdW5jdGlvbiggb3B0c1sgbmFtZSBdICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdHNbIG5hbWUgXS5hcHBseSggdGhpcywgYXJncyApID09PSBmYWxzZSB8fFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6LCD55SodGhpcy5vbkV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmlzRnVuY3Rpb24oIHRoaXNbIG5hbWUgXSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzWyBuYW1lIF0uYXBwbHkoIHRoaXMsIGFyZ3MgKSA9PT0gZmFsc2UgfHxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW5v+aSreaJgOaciXVwbG9hZGVy55qE5LqL5Lu244CCXG4gICAgICAgICAgICAgICAgICAgICAgICBNZWRpYXRvci50cmlnZ2VyLmFwcGx5KCBNZWRpYXRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIFsgdGhpcywgdHlwZSBdLmNvbmNhdCggYXJncyApICkgPT09IGZhbHNlICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHdpZGdldHMvd2lkZ2V0Lmpz5bCG6KGl5YWF5q2k5pa55rOV55qE6K+m57uG5paH5qGj44CCXG4gICAgICAgICAgICByZXF1ZXN0OiBCYXNlLm5vb3BcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDliJvlu7pVcGxvYWRlcuWunuS+i++8jOetieWQjOS6jm5ldyBVcGxvYWRlciggb3B0cyApO1xuICAgICAgICAgKiBAbWV0aG9kIGNyZWF0ZVxuICAgICAgICAgKiBAY2xhc3MgQmFzZVxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBncmFtbWFyIEJhc2UuY3JlYXRlKCBvcHRzICkgPT4gVXBsb2FkZXJcbiAgICAgICAgICovXG4gICAgICAgIEJhc2UuY3JlYXRlID0gVXBsb2FkZXIuY3JlYXRlID0gZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVwbG9hZGVyKCBvcHRzICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOaatOmcslVwbG9hZGVy77yM5Y+v5Lul6YCa6L+H5a6D5p2l5omp5bGV5Lia5Yqh6YC76L6R44CCXG4gICAgICAgIEJhc2UuVXBsb2FkZXIgPSBVcGxvYWRlcjtcbiAgICBcbiAgICAgICAgcmV0dXJuIFVwbG9hZGVyO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgUnVudGltZeeuoeeQhuWZqO+8jOi0n+i0o1J1bnRpbWXnmoTpgInmi6ksIOi/nuaOpVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9ydW50aW1lJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICBmYWN0b3JpZXMgPSB7fSxcbiAgICBcbiAgICAgICAgICAgIC8vIOiOt+WPluWvueixoeeahOesrOS4gOS4qmtleVxuICAgICAgICAgICAgZ2V0Rmlyc3RLZXkgPSBmdW5jdGlvbiggb2JqICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBrZXkgaW4gb2JqICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIG9iai5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgLy8g5o6l5Y+j57G744CCXG4gICAgICAgIGZ1bmN0aW9uIFJ1bnRpbWUoIG9wdGlvbnMgKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyOiBkb2N1bWVudC5ib2R5XG4gICAgICAgICAgICB9LCBvcHRpb25zICk7XG4gICAgICAgICAgICB0aGlzLnVpZCA9IEJhc2UuZ3VpZCgncnRfJyk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFJ1bnRpbWUucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICBnZXRDb250YWluZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQsIGNvbnRhaW5lcjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuX2NvbnRhaW5lciApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcGFyZW50ID0gJCggb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQuYm9keSApO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9ICQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpICk7XG4gICAgXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmF0dHIoICdpZCcsICdydF8nICsgdGhpcy51aWQgKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogJzBweCcsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzFweCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzFweCcsXG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhcmVudC5hcHBlbmQoIGNvbnRhaW5lciApO1xuICAgICAgICAgICAgICAgIHBhcmVudC5hZGRDbGFzcygnd2VidXBsb2FkZXItY29udGFpbmVyJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgaW5pdDogQmFzZS5ub29wLFxuICAgICAgICAgICAgZXhlYzogQmFzZS5ub29wLFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLl9jb250YWluZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKCB0aGlzLl9fY29udGFpbmVyICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMub2ZmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBSdW50aW1lLm9yZGVycyA9ICdodG1sNSxmbGFzaCc7XG4gICAgXG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmt7vliqBSdW50aW1l5a6e546w44CCXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlICAgIOexu+Wei1xuICAgICAgICAgKiBAcGFyYW0ge1J1bnRpbWV9IGZhY3Rvcnkg5YW35L2TUnVudGltZeWunueOsOOAglxuICAgICAgICAgKi9cbiAgICAgICAgUnVudGltZS5hZGRSdW50aW1lID0gZnVuY3Rpb24oIHR5cGUsIGZhY3RvcnkgKSB7XG4gICAgICAgICAgICBmYWN0b3JpZXNbIHR5cGUgXSA9IGZhY3Rvcnk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIFJ1bnRpbWUuaGFzUnVudGltZSA9IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgcmV0dXJuICEhKHR5cGUgPyBmYWN0b3JpZXNbIHR5cGUgXSA6IGdldEZpcnN0S2V5KCBmYWN0b3JpZXMgKSk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIFJ1bnRpbWUuY3JlYXRlID0gZnVuY3Rpb24oIG9wdHMsIG9yZGVycyApIHtcbiAgICAgICAgICAgIHZhciB0eXBlLCBydW50aW1lO1xuICAgIFxuICAgICAgICAgICAgb3JkZXJzID0gb3JkZXJzIHx8IFJ1bnRpbWUub3JkZXJzO1xuICAgICAgICAgICAgJC5lYWNoKCBvcmRlcnMuc3BsaXQoIC9cXHMqLFxccyovZyApLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGZhY3Rvcmllc1sgdGhpcyBdICkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgdHlwZSA9IHR5cGUgfHwgZ2V0Rmlyc3RLZXkoIGZhY3RvcmllcyApO1xuICAgIFxuICAgICAgICAgICAgaWYgKCAhdHlwZSApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1J1bnRpbWUgRXJyb3InKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHJ1bnRpbWUgPSBuZXcgZmFjdG9yaWVzWyB0eXBlIF0oIG9wdHMgKTtcbiAgICAgICAgICAgIHJldHVybiBydW50aW1lO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIFJ1bnRpbWUucHJvdG90eXBlICk7XG4gICAgICAgIHJldHVybiBSdW50aW1lO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgUnVudGltZeeuoeeQhuWZqO+8jOi0n+i0o1J1bnRpbWXnmoTpgInmi6ksIOi/nuaOpVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9jbGllbnQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbWVkaWF0b3InLFxuICAgICAgICAncnVudGltZS9ydW50aW1lJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciwgUnVudGltZSApIHtcbiAgICBcbiAgICAgICAgdmFyIGNhY2hlO1xuICAgIFxuICAgICAgICBjYWNoZSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSB7fTtcbiAgICBcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYWRkOiBmdW5jdGlvbiggcnVudGltZSApIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqWyBydW50aW1lLnVpZCBdID0gcnVudGltZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oIHJ1aWQsIHN0YW5kYWxvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHJ1aWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqWyBydWlkIF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSBpbiBvYmogKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnInkupvnsbvlnovkuI3og73ph43nlKjvvIzmr5TlpoJmaWxlcGlja2VyLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzdGFuZGFsb25lICYmIG9ialsgaSBdLl9fc3RhbmRhbG9uZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpbIGkgXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24oIHJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvYmpbIHJ1bnRpbWUudWlkIF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoKTtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gUnVudGltZUNsaWVudCggY29tcG9uZW50LCBzdGFuZGFsb25lICkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpLFxuICAgICAgICAgICAgICAgIHJ1bnRpbWU7XG4gICAgXG4gICAgICAgICAgICB0aGlzLnVpZCA9IEJhc2UuZ3VpZCgnY2xpZW50XycpO1xuICAgIFxuICAgICAgICAgICAgLy8g5YWB6K64cnVudGltZeayoeacieWIneWni+WMluS5i+WJje+8jOazqOWGjOS4gOS6m+aWueazleWcqOWIneWni+WMluWQjuaJp+ihjOOAglxuICAgICAgICAgICAgdGhpcy5ydW50aW1lUmVhZHkgPSBmdW5jdGlvbiggY2IgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLmRvbmUoIGNiICk7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5jb25uZWN0UnVudGltZSA9IGZ1bmN0aW9uKCBvcHRzLCBjYiApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBhbHJlYWR5IGNvbm5lY3RlZC5cbiAgICAgICAgICAgICAgICBpZiAoIHJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYWxyZWFkeSBjb25uZWN0ZWQhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGRlZmVycmVkLmRvbmUoIGNiICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycgJiYgY2FjaGUuZ2V0KCBvcHRzICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUgPSBjYWNoZS5nZXQoIG9wdHMgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5YOPZmlsZVBpY2tlcuWPquiDveeLrOeri+WtmOWcqO+8jOS4jeiDveWFrOeUqOOAglxuICAgICAgICAgICAgICAgIHJ1bnRpbWUgPSBydW50aW1lIHx8IGNhY2hlLmdldCggbnVsbCwgc3RhbmRhbG9uZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOmcgOimgeWIm+W7ulxuICAgICAgICAgICAgICAgIGlmICggIXJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUgPSBSdW50aW1lLmNyZWF0ZSggb3B0cywgb3B0cy5ydW50aW1lT3JkZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZS5fX3Byb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUub25jZSggJ3JlYWR5JywgZGVmZXJyZWQucmVzb2x2ZSApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuYWRkKCBydW50aW1lICk7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUuX19jbGllbnQgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOadpeiHqmNhY2hlXG4gICAgICAgICAgICAgICAgICAgIEJhc2UuJC5leHRlbmQoIHJ1bnRpbWUub3B0aW9ucywgb3B0cyApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLl9fcHJvbWlzZS50aGVuKCBkZWZlcnJlZC5yZXNvbHZlICk7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUuX19jbGllbnQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgc3RhbmRhbG9uZSAmJiAocnVudGltZS5fX3N0YW5kYWxvbmUgPSBzdGFuZGFsb25lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVudGltZTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmdldFJ1bnRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVudGltZTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RSdW50aW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAhcnVudGltZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBydW50aW1lLl9fY2xpZW50LS07XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBydW50aW1lLl9fY2xpZW50IDw9IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZSggcnVudGltZSApO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcnVudGltZS5fX3Byb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBydW50aW1lID0gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmV4ZWMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoICFydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQmFzZS5zbGljZSggYXJndW1lbnRzICk7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50ICYmIGFyZ3MudW5zaGlmdCggY29tcG9uZW50ICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWUuZXhlYy5hcHBseSggdGhpcywgYXJncyApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuZ2V0UnVpZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBydW50aW1lICYmIHJ1bnRpbWUudWlkO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveSA9IChmdW5jdGlvbiggZGVzdHJveSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlc3Ryb3kgJiYgZGVzdHJveS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcignZGVzdHJveScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4ZWMoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSggdGhpcy5kZXN0cm95ICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBSdW50aW1lQ2xpZW50LnByb3RvdHlwZSApO1xuICAgICAgICByZXR1cm4gUnVudGltZUNsaWVudDtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOmUmeivr+S/oeaBr1xuICAgICAqL1xuICAgIGRlZmluZSgnbGliL2RuZCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcicsXG4gICAgICAgICdydW50aW1lL2NsaWVudCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IsIFJ1bnRpbWVDbGVudCApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIERyYWdBbmREcm9wKCBvcHRzICkge1xuICAgICAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcmFnQW5kRHJvcC5vcHRpb25zLCBvcHRzICk7XG4gICAgXG4gICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9ICQoIG9wdHMuY29udGFpbmVyICk7XG4gICAgXG4gICAgICAgICAgICBpZiAoICFvcHRzLmNvbnRhaW5lci5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgUnVudGltZUNsZW50LmNhbGwoIHRoaXMsICdEcmFnQW5kRHJvcCcgKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBEcmFnQW5kRHJvcC5vcHRpb25zID0ge1xuICAgICAgICAgICAgYWNjZXB0OiBudWxsLFxuICAgICAgICAgICAgZGlzYWJsZUdsb2JhbERuZDogZmFsc2VcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgQmFzZS5pbmhlcml0cyggUnVudGltZUNsZW50LCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogRHJhZ0FuZERyb3AsXG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLmNvbm5lY3RSdW50aW1lKCBtZS5vcHRpb25zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuZXhlYygnaW5pdCcpO1xuICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdFJ1bnRpbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggRHJhZ0FuZERyb3AucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIHJldHVybiBEcmFnQW5kRHJvcDtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOe7hOS7tuWfuuexu+OAglxuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy93aWRnZXQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIF9pbml0ID0gVXBsb2FkZXIucHJvdG90eXBlLl9pbml0LFxuICAgICAgICAgICAgSUdOT1JFID0ge30sXG4gICAgICAgICAgICB3aWRnZXRDbGFzcyA9IFtdO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBpc0FycmF5TGlrZSggb2JqICkge1xuICAgICAgICAgICAgaWYgKCAhb2JqICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHR5cGUgPSAkLnR5cGUoIG9iaiApO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBvYmoubm9kZVR5cGUgPT09IDEgJiYgbGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgcmV0dXJuIHR5cGUgPT09ICdhcnJheScgfHwgdHlwZSAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlICE9PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgICAgICAgICAobGVuZ3RoID09PSAwIHx8IHR5cGVvZiBsZW5ndGggPT09ICdudW1iZXInICYmIGxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgKGxlbmd0aCAtIDEpIGluIG9iaik7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgZnVuY3Rpb24gV2lkZ2V0KCB1cGxvYWRlciApIHtcbiAgICAgICAgICAgIHRoaXMub3duZXIgPSB1cGxvYWRlcjtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHVwbG9hZGVyLm9wdGlvbnM7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFdpZGdldC5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IEJhc2Uubm9vcCxcbiAgICBcbiAgICAgICAgICAgIC8vIOexu0JhY2tib25l55qE5LqL5Lu255uR5ZCs5aOw5piO77yM55uR5ZCsdXBsb2FkZXLlrp7kvovkuIrnmoTkuovku7ZcbiAgICAgICAgICAgIC8vIHdpZGdldOebtOaOpeaXoOazleebkeWQrOS6i+S7tu+8jOS6i+S7tuWPquiDvemAmui/h3VwbG9hZGVy5p2l5Lyg6YCSXG4gICAgICAgICAgICBpbnZva2U6IGZ1bmN0aW9uKCBhcGlOYW1lLCBhcmdzICkge1xuICAgIFxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtYWtlLXRodW1iJzogJ21ha2VUaHVtYidcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLnJlc3BvbnNlTWFwO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOaXoEFQSeWTjeW6lOWjsOaYjuWImeW/veeVpVxuICAgICAgICAgICAgICAgIGlmICggIW1hcCB8fCAhKGFwaU5hbWUgaW4gbWFwKSB8fCAhKG1hcFsgYXBpTmFtZSBdIGluIHRoaXMpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAhJC5pc0Z1bmN0aW9uKCB0aGlzWyBtYXBbIGFwaU5hbWUgXSBdICkgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBJR05PUkU7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzWyBtYXBbIGFwaU5hbWUgXSBdLmFwcGx5KCB0aGlzLCBhcmdzICk7XG4gICAgXG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlj5HpgIHlkb3ku6TjgILlvZPkvKDlhaVgY2FsbGJhY2tg5oiW6ICFYGhhbmRsZXJg5Lit6L+U5ZueYHByb21pc2Vg5pe244CC6L+U5Zue5LiA5Liq5b2T5omA5pyJYGhhbmRsZXJg5Lit55qEcHJvbWlzZemDveWujOaIkOWQjuWujOaIkOeahOaWsGBwcm9taXNlYOOAglxuICAgICAgICAgICAgICogQG1ldGhvZCByZXF1ZXN0XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZXF1ZXN0KCBjb21tYW5kLCBhcmdzICkgPT4gKiB8IFByb21pc2VcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlcXVlc3QoIGNvbW1hbmQsIGFyZ3MsIGNhbGxiYWNrICkgPT4gUHJvbWlzZVxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3duZXIucmVxdWVzdC5hcHBseSggdGhpcy5vd25lciwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvLyDmianlsZVVcGxvYWRlci5cbiAgICAgICAgJC5leHRlbmQoIFVwbG9hZGVyLnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgLy8g6KaG5YaZX2luaXTnlKjmnaXliJ3lp4vljJZ3aWRnZXRzXG4gICAgICAgICAgICBfaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgd2lkZ2V0cyA9IG1lLl93aWRnZXRzID0gW107XG4gICAgXG4gICAgICAgICAgICAgICAgJC5lYWNoKCB3aWRnZXRDbGFzcywgZnVuY3Rpb24oIF8sIGtsYXNzICkge1xuICAgICAgICAgICAgICAgICAgICB3aWRnZXRzLnB1c2goIG5ldyBrbGFzcyggbWUgKSApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBfaW5pdC5hcHBseSggbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHJlcXVlc3Q6IGZ1bmN0aW9uKCBhcGlOYW1lLCBhcmdzLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIHdpZGdldHMgPSB0aGlzLl93aWRnZXRzLFxuICAgICAgICAgICAgICAgICAgICBsZW4gPSB3aWRnZXRzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgcmx0cyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBkZmRzID0gW10sXG4gICAgICAgICAgICAgICAgICAgIHdpZGdldCwgcmx0LCBwcm9taXNlLCBrZXk7XG4gICAgXG4gICAgICAgICAgICAgICAgYXJncyA9IGlzQXJyYXlMaWtlKCBhcmdzICkgPyBhcmdzIDogWyBhcmdzIF07XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpZGdldCA9IHdpZGdldHNbIGkgXTtcbiAgICAgICAgICAgICAgICAgICAgcmx0ID0gd2lkZ2V0Lmludm9rZSggYXBpTmFtZSwgYXJncyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHJsdCAhPT0gSUdOT1JFICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVmZXJyZWTlr7nosaFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggQmFzZS5pc1Byb21pc2UoIHJsdCApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRmZHMucHVzaCggcmx0ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJsdHMucHVzaCggcmx0ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyJY2FsbGJhY2vvvIzliJnnlKjlvILmraXmlrnlvI/jgIJcbiAgICAgICAgICAgICAgICBpZiAoIGNhbGxiYWNrIHx8IGRmZHMubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gQmFzZS53aGVuLmFwcGx5KCBCYXNlLCBkZmRzICk7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IHByb21pc2UucGlwZSA/ICdwaXBlJyA6ICd0aGVuJztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5b6I6YeN6KaB5LiN6IO95Yig6Zmk44CC5Yig6Zmk5LqG5Lya5q275b6q546v44CCXG4gICAgICAgICAgICAgICAgICAgIC8vIOS/neivgeaJp+ihjOmhuuW6j+OAguiuqWNhbGxiYWNr5oC75piv5Zyo5LiL5LiA5LiqdGlja+S4reaJp+ihjOOAglxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZVsga2V5IF0oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlLmFwcGx5KCBkZWZlcnJlZCwgYXJncyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlbIGtleSBdKCBjYWxsYmFjayB8fCBCYXNlLm5vb3AgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmx0c1sgMCBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmt7vliqDnu4Tku7ZcbiAgICAgICAgICogQHBhcmFtICB7b2JqZWN0fSB3aWRnZXRQcm90byDnu4Tku7bljp/lnovvvIzmnoTpgKDlh73mlbDpgJrov4djb25zdHJ1Y3RvcuWxnuaAp+WumuS5iVxuICAgICAgICAgKiBAcGFyYW0gIHtvYmplY3R9IHJlc3BvbnNlTWFwIEFQSeWQjeensOS4juWHveaVsOWunueOsOeahOaYoOWwhFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgVXBsb2FkZXIucmVnaXN0ZXIoIHtcbiAgICAgICAgICogICAgICAgICBpbml0OiBmdW5jdGlvbiggb3B0aW9ucyApIHt9LFxuICAgICAgICAgKiAgICAgICAgIG1ha2VUaHVtYjogZnVuY3Rpb24oKSB7fVxuICAgICAgICAgKiAgICAgfSwge1xuICAgICAgICAgKiAgICAgICAgICdtYWtlLXRodW1iJzogJ21ha2VUaHVtYidcbiAgICAgICAgICogICAgIH0gKTtcbiAgICAgICAgICovXG4gICAgICAgIFVwbG9hZGVyLnJlZ2lzdGVyID0gV2lkZ2V0LnJlZ2lzdGVyID0gZnVuY3Rpb24oIHJlc3BvbnNlTWFwLCB3aWRnZXRQcm90byApIHtcbiAgICAgICAgICAgIHZhciBtYXAgPSB7IGluaXQ6ICdpbml0JyB9LFxuICAgICAgICAgICAgICAgIGtsYXNzO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICkge1xuICAgICAgICAgICAgICAgIHdpZGdldFByb3RvID0gcmVzcG9uc2VNYXA7XG4gICAgICAgICAgICAgICAgd2lkZ2V0UHJvdG8ucmVzcG9uc2VNYXAgPSBtYXA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpZGdldFByb3RvLnJlc3BvbnNlTWFwID0gJC5leHRlbmQoIG1hcCwgcmVzcG9uc2VNYXAgKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGtsYXNzID0gQmFzZS5pbmhlcml0cyggV2lkZ2V0LCB3aWRnZXRQcm90byApO1xuICAgICAgICAgICAgd2lkZ2V0Q2xhc3MucHVzaCgga2xhc3MgKTtcbiAgICBcbiAgICAgICAgICAgIHJldHVybiBrbGFzcztcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFdpZGdldDtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IERyYWdBbmREcm9wIFdpZGdldOOAglxuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9maWxlZG5kJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ2xpYi9kbmQnLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyLCBEbmQgKSB7XG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICBVcGxvYWRlci5vcHRpb25zLmRuZCA9ICcnO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQHByb3BlcnR5IHtTZWxlY3Rvcn0gW2RuZD11bmRlZmluZWRdICDmjIflrppEcmFnIEFuZCBEcm9w5ouW5ou955qE5a655Zmo77yM5aaC5p6c5LiN5oyH5a6a77yM5YiZ5LiN5ZCv5Yqo44CCXG4gICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGV2ZW50IGRuZEFjY2VwdFxuICAgICAgICAgKiBAcGFyYW0ge0RhdGFUcmFuc2Zlckl0ZW1MaXN0fSBpdGVtcyBEYXRhVHJhbnNmZXJJdGVtXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiDpmLvmraLmraTkuovku7blj6/ku6Xmi5Lnu53mn5DkupvnsbvlnovnmoTmlofku7bmi5blhaXov5vmnaXjgILnm67liY3lj6rmnIkgY2hyb21lIOaPkOS+m+i/meagt+eahCBBUEnvvIzkuJTlj6rog73pgJrov4cgbWltZS10eXBlIOmqjOivgeOAglxuICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIW9wdHMuZG5kIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QoJ3ByZWRpY3QtcnVudGltZS10eXBlJykgIT09ICdodG1sNScgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCksXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZUdsb2JhbERuZDogb3B0cy5kaXNhYmxlR2xvYmFsRG5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBvcHRzLmRuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdDogb3B0cy5hY2NlcHRcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIGRuZDtcbiAgICBcbiAgICAgICAgICAgICAgICBkbmQgPSBuZXcgRG5kKCBvcHRpb25zICk7XG4gICAgXG4gICAgICAgICAgICAgICAgZG5kLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICBkbmQub24oICdkcm9wJywgZnVuY3Rpb24oIGZpbGVzICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5yZXF1ZXN0KCAnYWRkLWZpbGUnLCBbIGZpbGVzIF0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOajgOa1i+aWh+S7tuaYr+WQpuWFqOmDqOWFgeiuuOa3u+WKoOOAglxuICAgICAgICAgICAgICAgIGRuZC5vbiggJ2FjY2VwdCcsIGZ1bmN0aW9uKCBpdGVtcyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLm93bmVyLnRyaWdnZXIoICdkbmRBY2NlcHQnLCBpdGVtcyApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGRuZC5pbml0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDplJnor6/kv6Hmga9cbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9maWxlcGFzdGUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbWVkaWF0b3InLFxuICAgICAgICAncnVudGltZS9jbGllbnQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIE1lZGlhdG9yLCBSdW50aW1lQ2xlbnQgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBGaWxlUGFzdGUoIG9wdHMgKSB7XG4gICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIG9wdHMgKTtcbiAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gJCggb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQuYm9keSApO1xuICAgICAgICAgICAgUnVudGltZUNsZW50LmNhbGwoIHRoaXMsICdGaWxlUGFzdGUnICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgQmFzZS5pbmhlcml0cyggUnVudGltZUNsZW50LCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogRmlsZVBhc3RlLFxuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5jb25uZWN0UnVudGltZSggbWUub3B0aW9ucywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmV4ZWMoJ2luaXQnKTtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4ZWMoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggRmlsZVBhc3RlLnByb3RvdHlwZSApO1xuICAgIFxuICAgICAgICByZXR1cm4gRmlsZVBhc3RlO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg57uE5Lu25Z+657G744CCXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL2ZpbGVwYXN0ZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdsaWIvZmlsZXBhc3RlJyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgRmlsZVBhc3RlICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7U2VsZWN0b3J9IFtwYXN0ZT11bmRlZmluZWRdICDmjIflrprnm5HlkKxwYXN0ZeS6i+S7tueahOWuueWZqO+8jOWmguaenOS4jeaMh+Wumu+8jOS4jeWQr+eUqOatpOWKn+iDveOAguatpOWKn+iDveS4uumAmui/h+eymOi0tOadpea3u+WKoOaIquWxj+eahOWbvueJh+OAguW7uuiuruiuvue9ruS4umBkb2N1bWVudC5ib2R5YC5cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiggb3B0cyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFvcHRzLnBhc3RlIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QoJ3ByZWRpY3QtcnVudGltZS10eXBlJykgIT09ICdodG1sNScgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCksXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBvcHRzLnBhc3RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0OiBvcHRzLmFjY2VwdFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgcGFzdGU7XG4gICAgXG4gICAgICAgICAgICAgICAgcGFzdGUgPSBuZXcgRmlsZVBhc3RlKCBvcHRpb25zICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcGFzdGUub25jZSggJ3JlYWR5JywgZGVmZXJyZWQucmVzb2x2ZSApO1xuICAgICAgICAgICAgICAgIHBhc3RlLm9uKCAncGFzdGUnLCBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnJlcXVlc3QoICdhZGQtZmlsZScsIFsgZmlsZXMgXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGFzdGUuaW5pdCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgQmxvYlxuICAgICAqL1xuICAgIGRlZmluZSgnbGliL2Jsb2InLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9jbGllbnQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFJ1bnRpbWVDbGllbnQgKSB7XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIEJsb2IoIHJ1aWQsIHNvdXJjZSApIHtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICBtZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgICAgICBtZS5ydWlkID0gcnVpZDtcbiAgICBcbiAgICAgICAgICAgIFJ1bnRpbWVDbGllbnQuY2FsbCggbWUsICdCbG9iJyApO1xuICAgIFxuICAgICAgICAgICAgdGhpcy51aWQgPSBzb3VyY2UudWlkIHx8IHRoaXMudWlkO1xuICAgICAgICAgICAgdGhpcy50eXBlID0gc291cmNlLnR5cGUgfHwgJyc7XG4gICAgICAgICAgICB0aGlzLnNpemUgPSBzb3VyY2Uuc2l6ZSB8fCAwO1xuICAgIFxuICAgICAgICAgICAgaWYgKCBydWlkICkge1xuICAgICAgICAgICAgICAgIG1lLmNvbm5lY3RSdW50aW1lKCBydWlkICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgQmFzZS5pbmhlcml0cyggUnVudGltZUNsaWVudCwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IEJsb2IsXG4gICAgXG4gICAgICAgICAgICBzbGljZTogZnVuY3Rpb24oIHN0YXJ0LCBlbmQgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYyggJ3NsaWNlJywgc3RhcnQsIGVuZCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFNvdXJjZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIEJsb2I7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICog5Li65LqG57uf5LiA5YyWRmxhc2jnmoRGaWxl5ZKMSFRNTDXnmoRGaWxl6ICM5a2Y5Zyo44CCXG4gICAgICog5Lul6Iez5LqO6KaB6LCD55SoRmxhc2jph4zpnaLnmoRGaWxl77yM5Lmf5Y+v5Lul5YOP6LCD55SoSFRNTDXniYjmnKznmoRGaWxl5LiA5LiL44CCXG4gICAgICogQGZpbGVPdmVydmlldyBGaWxlXG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvZmlsZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdsaWIvYmxvYidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgQmxvYiApIHtcbiAgICBcbiAgICAgICAgdmFyIHVpZCA9IDEsXG4gICAgICAgICAgICByRXh0ID0gL1xcLihbXi5dKykkLztcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gRmlsZSggcnVpZCwgZmlsZSApIHtcbiAgICAgICAgICAgIHZhciBleHQ7XG4gICAgXG4gICAgICAgICAgICBCbG9iLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IGZpbGUubmFtZSB8fCAoJ3VudGl0bGVkJyArIHVpZCsrKTtcbiAgICAgICAgICAgIGV4dCA9IHJFeHQuZXhlYyggZmlsZS5uYW1lICkgPyBSZWdFeHAuJDEudG9Mb3dlckNhc2UoKSA6ICcnO1xuICAgIFxuICAgICAgICAgICAgLy8gdG9kbyDmlK/mjIHlhbbku5bnsbvlnovmlofku7bnmoTovazmjaLjgIJcbiAgICBcbiAgICAgICAgICAgIC8vIOWmguaenOaciW1pbWV0eXBlLCDkvYbmmK/mlofku7blkI3ph4zpnaLmsqHmnInmib7lh7rlkI7nvIDop4TlvotcbiAgICAgICAgICAgIGlmICggIWV4dCAmJiB0aGlzLnR5cGUgKSB7XG4gICAgICAgICAgICAgICAgZXh0ID0gL1xcLyhqcGd8anBlZ3xwbmd8Z2lmfGJtcCkkL2kuZXhlYyggdGhpcy50eXBlICkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgUmVnRXhwLiQxLnRvTG93ZXJDYXNlKCkgOiAnJztcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgKz0gJy4nICsgZXh0O1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8g5aaC5p6c5rKh5pyJ5oyH5a6abWltZXR5cGUsIOS9huaYr+efpemBk+aWh+S7tuWQjue8gOOAglxuICAgICAgICAgICAgaWYgKCAhdGhpcy50eXBlICYmICB+J2pwZyxqcGVnLHBuZyxnaWYsYm1wJy5pbmRleE9mKCBleHQgKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnaW1hZ2UvJyArIChleHQgPT09ICdqcGcnID8gJ2pwZWcnIDogZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHRoaXMuZXh0ID0gZXh0O1xuICAgICAgICAgICAgdGhpcy5sYXN0TW9kaWZpZWREYXRlID0gZmlsZS5sYXN0TW9kaWZpZWREYXRlIHx8XG4gICAgICAgICAgICAgICAgICAgIChuZXcgRGF0ZSgpKS50b0xvY2FsZVN0cmluZygpO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBCYXNlLmluaGVyaXRzKCBCbG9iLCBGaWxlICk7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDplJnor6/kv6Hmga9cbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9maWxlcGlja2VyJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50JyxcbiAgICAgICAgJ2xpYi9maWxlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lQ2xlbnQsIEZpbGUgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBGaWxlUGlja2VyKCBvcHRzICkge1xuICAgICAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBGaWxlUGlja2VyLm9wdGlvbnMsIG9wdHMgKTtcbiAgICBcbiAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gJCggb3B0cy5pZCApO1xuICAgIFxuICAgICAgICAgICAgaWYgKCAhb3B0cy5jb250YWluZXIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5oyJ6ZKu5oyH5a6a6ZSZ6K+vJyk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBvcHRzLmlubmVySFRNTCA9IG9wdHMuaW5uZXJIVE1MIHx8IG9wdHMubGFiZWwgfHxcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5jb250YWluZXIuaHRtbCgpIHx8ICcnO1xuICAgIFxuICAgICAgICAgICAgb3B0cy5idXR0b24gPSAkKCBvcHRzLmJ1dHRvbiB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSApO1xuICAgICAgICAgICAgb3B0cy5idXR0b24uaHRtbCggb3B0cy5pbm5lckhUTUwgKTtcbiAgICAgICAgICAgIG9wdHMuY29udGFpbmVyLmh0bWwoIG9wdHMuYnV0dG9uICk7XG4gICAgXG4gICAgICAgICAgICBSdW50aW1lQ2xlbnQuY2FsbCggdGhpcywgJ0ZpbGVQaWNrZXInLCB0cnVlICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgRmlsZVBpY2tlci5vcHRpb25zID0ge1xuICAgICAgICAgICAgYnV0dG9uOiBudWxsLFxuICAgICAgICAgICAgY29udGFpbmVyOiBudWxsLFxuICAgICAgICAgICAgbGFiZWw6IG51bGwsXG4gICAgICAgICAgICBpbm5lckhUTUw6IG51bGwsXG4gICAgICAgICAgICBtdWx0aXBsZTogdHJ1ZSxcbiAgICAgICAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgICAgICAgIG5hbWU6ICdmaWxlJ1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBCYXNlLmluaGVyaXRzKCBSdW50aW1lQ2xlbnQsIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBGaWxlUGlja2VyLFxuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbiA9IG9wdHMuYnV0dG9uO1xuICAgIFxuICAgICAgICAgICAgICAgIGJ1dHRvbi5hZGRDbGFzcygnd2VidXBsb2FkZXItcGljaycpO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLm9uKCAnYWxsJywgZnVuY3Rpb24oIHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlcztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICggdHlwZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ21vdXNlZW50ZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5hZGRDbGFzcygnd2VidXBsb2FkZXItcGljay1ob3ZlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbW91c2VsZWF2ZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLnJlbW92ZUNsYXNzKCd3ZWJ1cGxvYWRlci1waWNrLWhvdmVyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjaGFuZ2UnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzID0gbWUuZXhlYygnZ2V0RmlsZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCAnc2VsZWN0JywgJC5tYXAoIGZpbGVzLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSA9IG5ldyBGaWxlKCBtZS5nZXRSdWlkKCksIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6K6w5b2V5p2l5rqQ44CCXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuX3JlZmVyID0gb3B0cy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLCBvcHRzLmNvbnRhaW5lciApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuY29ubmVjdFJ1bnRpbWUoIG9wdHMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgICAgIG1lLmV4ZWMoICdpbml0Jywgb3B0cyApO1xuICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICQoIHdpbmRvdyApLm9uKCAncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICByZWZyZXNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2hpbUNvbnRhaW5lciA9IHRoaXMuZ2V0UnVudGltZSgpLmdldENvbnRhaW5lcigpLFxuICAgICAgICAgICAgICAgICAgICBidXR0b24gPSB0aGlzLm9wdGlvbnMuYnV0dG9uLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IGJ1dHRvbi5vdXRlcldpZHRoID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24ub3V0ZXJXaWR0aCgpIDogYnV0dG9uLndpZHRoKCksXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IGJ1dHRvbi5vdXRlckhlaWdodCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLm91dGVySGVpZ2h0KCkgOiBidXR0b24uaGVpZ2h0KCksXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHBvcyA9IGJ1dHRvbi5vZmZzZXQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICB3aWR0aCAmJiBoZWlnaHQgJiYgc2hpbUNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBib3R0b206ICdhdXRvJyxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICdhdXRvJyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgKyAncHgnXG4gICAgICAgICAgICAgICAgfSkub2Zmc2V0KCBwb3MgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBlbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBidG4gPSB0aGlzLm9wdGlvbnMuYnV0dG9uO1xuICAgIFxuICAgICAgICAgICAgICAgIGJ0bi5yZW1vdmVDbGFzcygnd2VidXBsb2FkZXItcGljay1kaXNhYmxlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0biA9IHRoaXMub3B0aW9ucy5idXR0b247XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lKCkuZ2V0Q29udGFpbmVyKCkuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAnLTk5OTk5cHgnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgYnRuLmFkZENsYXNzKCd3ZWJ1cGxvYWRlci1waWNrLWRpc2FibGUnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucnVudGltZSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdFJ1bnRpbWUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICByZXR1cm4gRmlsZVBpY2tlcjtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOaWh+S7tumAieaLqeebuOWFs1xuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9maWxlcGlja2VyJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ2xpYi9maWxlcGlja2VyJyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgRmlsZVBpY2tlciApIHtcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBVcGxvYWRlci5vcHRpb25zLCB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7U2VsZWN0b3IgfCBPYmplY3R9IFtwaWNrPXVuZGVmaW5lZF1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaMh+WumumAieaLqeaWh+S7tueahOaMiemSruWuueWZqO+8jOS4jeaMh+WumuWImeS4jeWIm+W7uuaMiemSruOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICogYGlkYCB7U2VsZXRvcn0g5oyH5a6a6YCJ5oup5paH5Lu255qE5oyJ6ZKu5a655Zmo77yM5LiN5oyH5a6a5YiZ5LiN5Yib5bu65oyJ6ZKu44CCXG4gICAgICAgICAgICAgKiAqIGBsYWJlbGAge1N0cmluZ30g6K+36YeH55SoIGBpbm5lckhUTUxgIOS7o+abv1xuICAgICAgICAgICAgICogKiBgaW5uZXJIVE1MYCB7U3RyaW5nfSDmjIflrprmjInpkq7mloflrZfjgILkuI3mjIflrprml7bkvJjlhYjku47mjIflrprnmoTlrrnlmajkuK3nnIvmmK/lkKboh6rluKbmloflrZfjgIJcbiAgICAgICAgICAgICAqICogYG11bHRpcGxlYCB7Qm9vbGVhbn0g5piv5ZCm5byA6LW35ZCM5pe26YCJ5oup5aSa5Liq5paH5Lu26IO95Yqb44CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHBpY2s6IG51bGwsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7QXJyb3l9IFthY2NlcHQ9bnVsbF1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaMh+WumuaOpeWPl+WTquS6m+exu+Wei+eahOaWh+S7tuOAgiDnlLHkuo7nm67liY3ov5jmnIlleHTovaxtaW1lVHlwZeihqO+8jOaJgOS7pei/memHjOmcgOimgeWIhuW8gOaMh+WumuOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICogYHRpdGxlYCB7U3RyaW5nfSDmloflrZfmj4/ov7BcbiAgICAgICAgICAgICAqICogYGV4dGVuc2lvbnNgIHtTdHJpbmd9IOWFgeiuuOeahOaWh+S7tuWQjue8gO+8jOS4jeW4pueCue+8jOWkmuS4queUqOmAl+WPt+WIhuWJsuOAglxuICAgICAgICAgICAgICogKiBgbWltZVR5cGVzYCB7U3RyaW5nfSDlpJrkuKrnlKjpgJflj7fliIblibLjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiDlpoLvvJpcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgYGBcbiAgICAgICAgICAgICAqIHtcbiAgICAgICAgICAgICAqICAgICB0aXRsZTogJ0ltYWdlcycsXG4gICAgICAgICAgICAgKiAgICAgZXh0ZW5zaW9uczogJ2dpZixqcGcsanBlZyxibXAscG5nJyxcbiAgICAgICAgICAgICAqICAgICBtaW1lVHlwZXM6ICdpbWFnZS8qJ1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICogYGBgXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFjY2VwdDogbnVsbC8qe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSW1hZ2VzJyxcbiAgICAgICAgICAgICAgICBleHRlbnNpb25zOiAnZ2lmLGpwZyxqcGVnLGJtcCxwbmcnLFxuICAgICAgICAgICAgICAgIG1pbWVUeXBlczogJ2ltYWdlLyonXG4gICAgICAgICAgICB9Ki9cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICAnYWRkLWJ0bic6ICdhZGRCdXR0b24nLFxuICAgICAgICAgICAgcmVmcmVzaDogJ3JlZnJlc2gnLFxuICAgICAgICAgICAgZGlzYWJsZTogJ2Rpc2FibGUnLFxuICAgICAgICAgICAgZW5hYmxlOiAnZW5hYmxlJ1xuICAgICAgICB9LCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiggb3B0cyApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBpY2tlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5waWNrICYmIHRoaXMuYWRkQnV0dG9uKCBvcHRzLnBpY2sgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICByZWZyZXNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkLmVhY2goIHRoaXMucGlja2VycywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCBhZGRCdXR0b25cbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGFkZEJ1dHRvbiggcGljayApID0+IFByb21pc2VcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgICAgICog5re75Yqg5paH5Lu26YCJ5oup5oyJ6ZKu77yM5aaC5p6c5LiA5Liq5oyJ6ZKu5LiN5aSf77yM6ZyA6KaB6LCD55So5q2k5pa55rOV5p2l5re75Yqg44CC5Y+C5pWw6LefW29wdGlvbnMucGlja10oI1dlYlVwbG9hZGVyOlVwbG9hZGVyOm9wdGlvbnMp5LiA6Ie044CCXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdXBsb2FkZXIuYWRkQnV0dG9uKHtcbiAgICAgICAgICAgICAqICAgICBpZDogJyNidG5Db250YWluZXInLFxuICAgICAgICAgICAgICogICAgIGlubmVySFRNTDogJ+mAieaLqeaWh+S7tidcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhZGRCdXR0b246IGZ1bmN0aW9uKCBwaWNrICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQgPSBvcHRzLmFjY2VwdCxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucywgcGlja2VyLCBkZWZlcnJlZDtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFwaWNrICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgICAgICQuaXNQbGFpbk9iamVjdCggcGljayApIHx8IChwaWNrID0ge1xuICAgICAgICAgICAgICAgICAgICBpZDogcGlja1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgcGljaywge1xuICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6ICQuaXNQbGFpbk9iamVjdCggYWNjZXB0ICkgPyBbIGFjY2VwdCBdIDogYWNjZXB0LFxuICAgICAgICAgICAgICAgICAgICBzd2Y6IG9wdHMuc3dmLFxuICAgICAgICAgICAgICAgICAgICBydW50aW1lT3JkZXI6IG9wdHMucnVudGltZU9yZGVyXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgcGlja2VyID0gbmV3IEZpbGVQaWNrZXIoIG9wdGlvbnMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBwaWNrZXIub25jZSggJ3JlYWR5JywgZGVmZXJyZWQucmVzb2x2ZSApO1xuICAgICAgICAgICAgICAgIHBpY2tlci5vbiggJ3NlbGVjdCcsIGZ1bmN0aW9uKCBmaWxlcyApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUub3duZXIucmVxdWVzdCggJ2FkZC1maWxlJywgWyBmaWxlcyBdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBwaWNrZXIuaW5pdCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucGlja2Vycy5wdXNoKCBwaWNrZXIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQuZWFjaCggdGhpcy5waWNrZXJzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkLmVhY2goIHRoaXMucGlja2VycywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgSW1hZ2VcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9pbWFnZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCcsXG4gICAgICAgICdsaWIvYmxvYidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZUNsaWVudCwgQmxvYiApIHtcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIC8vIOaehOmAoOWZqOOAglxuICAgICAgICBmdW5jdGlvbiBJbWFnZSggb3B0cyApIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBJbWFnZS5vcHRpb25zLCBvcHRzICk7XG4gICAgICAgICAgICBSdW50aW1lQ2xpZW50LmNhbGwoIHRoaXMsICdJbWFnZScgKTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMub24oICdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5mbyA9IHRoaXMuZXhlYygnaW5mbycpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21ldGEgPSB0aGlzLmV4ZWMoJ21ldGEnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIC8vIOm7mOiupOmAiemhueOAglxuICAgICAgICBJbWFnZS5vcHRpb25zID0ge1xuICAgIFxuICAgICAgICAgICAgLy8g6buY6K6k55qE5Zu+54mH5aSE55CG6LSo6YePXG4gICAgICAgICAgICBxdWFsaXR5OiA5MCxcbiAgICBcbiAgICAgICAgICAgIC8vIOaYr+WQpuijgeWJqlxuICAgICAgICAgICAgY3JvcDogZmFsc2UsXG4gICAgXG4gICAgICAgICAgICAvLyDmmK/lkKbkv53nlZnlpLTpg6jkv6Hmga9cbiAgICAgICAgICAgIHByZXNlcnZlSGVhZGVyczogdHJ1ZSxcbiAgICBcbiAgICAgICAgICAgIC8vIOaYr+WQpuWFgeiuuOaUvuWkp+OAglxuICAgICAgICAgICAgYWxsb3dNYWduaWZ5OiB0cnVlXG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOe7p+aJv1J1bnRpbWVDbGllbnQuXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGllbnQsIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBJbWFnZSxcbiAgICBcbiAgICAgICAgICAgIGluZm86IGZ1bmN0aW9uKCB2YWwgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gc2V0dGVyXG4gICAgICAgICAgICAgICAgaWYgKCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZm8gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBnZXR0ZXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faW5mbztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBtZXRhOiBmdW5jdGlvbiggdmFsICkge1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIHNldHRlclxuICAgICAgICAgICAgICAgIGlmICggdmFsICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXRhID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZ2V0dGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ldGE7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgbG9hZEZyb21CbG9iOiBmdW5jdGlvbiggYmxvYiApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBydWlkID0gYmxvYi5nZXRSdWlkKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0UnVudGltZSggcnVpZCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmV4ZWMoICdpbml0JywgbWUub3B0aW9ucyApO1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCAnbG9hZEZyb21CbG9iJywgYmxvYiApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBCYXNlLnNsaWNlKCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjLmFwcGx5KCB0aGlzLCBbICdyZXNpemUnIF0uY29uY2F0KCBhcmdzICkgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRBc0RhdGFVcmw6IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMoICdnZXRBc0RhdGFVcmwnLCB0eXBlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0QXNCbG9iOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IHRoaXMuZXhlYyggJ2dldEFzQmxvYicsIHR5cGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJsb2IoIHRoaXMuZ2V0UnVpZCgpLCBibG9iICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICByZXR1cm4gSW1hZ2U7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDlm77niYfmk43kvZwsIOi0n+i0o+mihOiniOWbvueJh+WSjOS4iuS8oOWJjeWOi+e8qeWbvueJh1xuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9pbWFnZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdsaWIvaW1hZ2UnLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyLCBJbWFnZSApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICB0aHJvdHRsZTtcbiAgICBcbiAgICAgICAgLy8g5qC55o2u6KaB5aSE55CG55qE5paH5Lu25aSn5bCP5p2l6IqC5rWB77yM5LiA5qyh5LiN6IO95aSE55CG5aSq5aSa77yM5Lya5Y2h44CCXG4gICAgICAgIHRocm90dGxlID0gKGZ1bmN0aW9uKCBtYXggKSB7XG4gICAgICAgICAgICB2YXIgb2NjdXBpZWQgPSAwLFxuICAgICAgICAgICAgICAgIHdhaXRpbmcgPSBbXSxcbiAgICAgICAgICAgICAgICB0aWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIHdhaXRpbmcubGVuZ3RoICYmIG9jY3VwaWVkIDwgbWF4ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHdhaXRpbmcuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9jY3VwaWVkICs9IGl0ZW1bIDAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1bIDEgXSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiggZW1pdGVyLCBzaXplLCBjYiApIHtcbiAgICAgICAgICAgICAgICB3YWl0aW5nLnB1c2goWyBzaXplLCBjYiBdKTtcbiAgICAgICAgICAgICAgICBlbWl0ZXIub25jZSggJ2Rlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgb2NjdXBpZWQgLT0gc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggdGljaywgMSApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoIHRpY2ssIDEgKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKCA1ICogMTAyNCAqIDEwMjQgKTtcbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFVwbG9hZGVyLm9wdGlvbnMsIHtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFt0aHVtYl1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOmFjee9rueUn+aIkOe8qeeVpeWbvueahOmAiemhueOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIOm7mOiupOS4uu+8mlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGBgYGphdmFzY3JpcHRcbiAgICAgICAgICAgICAqIHtcbiAgICAgICAgICAgICAqICAgICB3aWR0aDogMTEwLFxuICAgICAgICAgICAgICogICAgIGhlaWdodDogMTEwLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDlm77niYfotKjph4/vvIzlj6rmnIl0eXBl5Li6YGltYWdlL2pwZWdg55qE5pe25YCZ5omN5pyJ5pWI44CCXG4gICAgICAgICAgICAgKiAgICAgcXVhbGl0eTogNzAsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOaYr+WQpuWFgeiuuOaUvuWkp++8jOWmguaenOaDs+imgeeUn+aIkOWwj+WbvueahOaXtuWAmeS4jeWkseecn++8jOatpOmAiemhueW6lOivpeiuvue9ruS4umZhbHNlLlxuICAgICAgICAgICAgICogICAgIGFsbG93TWFnbmlmeTogdHJ1ZSxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5piv5ZCm5YWB6K646KOB5Ymq44CCXG4gICAgICAgICAgICAgKiAgICAgY3JvcDogdHJ1ZSxcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgLy8g5piv5ZCm5L+d55WZ5aS06YOobWV0YeS/oeaBr+OAglxuICAgICAgICAgICAgICogICAgIHByZXNlcnZlSGVhZGVyczogZmFsc2UsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOS4uuepuueahOivneWImeS/neeVmeWOn+acieWbvueJh+agvOW8j+OAglxuICAgICAgICAgICAgICogICAgIC8vIOWQpuWImeW8uuWItui9rOaNouaIkOaMh+WumueahOexu+Wei+OAglxuICAgICAgICAgICAgICogICAgIHR5cGU6ICdpbWFnZS9qcGVnJ1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICogYGBgXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRodW1iOiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDExMCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDExMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiA3MCxcbiAgICAgICAgICAgICAgICBhbGxvd01hZ25pZnk6IHRydWUsXG4gICAgICAgICAgICAgICAgY3JvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBwcmVzZXJ2ZUhlYWRlcnM6IGZhbHNlLFxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOS4uuepuueahOivneWImeS/neeVmeWOn+acieWbvueJh+agvOW8j+OAglxuICAgICAgICAgICAgICAgIC8vIOWQpuWImeW8uuWItui9rOaNouaIkOaMh+WumueahOexu+Wei+OAglxuICAgICAgICAgICAgICAgIC8vIElFIDjkuIvpnaIgYmFzZTY0IOWkp+Wwj+S4jeiDvei2hei/hyAzMksg5ZCm5YiZ6aKE6KeI5aSx6LSl77yM6ICM6Z2eIGpwZWcg57yW56CB55qE5Zu+54mH5b6I5Y+vXG4gICAgICAgICAgICAgICAgLy8g6IO95Lya6LaF6L+HIDMyaywg5omA5Lul6L+Z6YeM6K6+572u5oiQ6aKE6KeI55qE5pe25YCZ6YO95pivIGltYWdlL2pwZWdcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvanBlZydcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbY29tcHJlc3NdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDphY3nva7ljovnvKnnmoTlm77niYfnmoTpgInpobnjgILlpoLmnpzmraTpgInpobnkuLpgZmFsc2VgLCDliJnlm77niYflnKjkuIrkvKDliY3kuI3ov5vooYzljovnvKnjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiDpu5jorqTkuLrvvJpcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgYGBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgKiB7XG4gICAgICAgICAgICAgKiAgICAgd2lkdGg6IDE2MDAsXG4gICAgICAgICAgICAgKiAgICAgaGVpZ2h0OiAxNjAwLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDlm77niYfotKjph4/vvIzlj6rmnIl0eXBl5Li6YGltYWdlL2pwZWdg55qE5pe25YCZ5omN5pyJ5pWI44CCXG4gICAgICAgICAgICAgKiAgICAgcXVhbGl0eTogOTAsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOaYr+WQpuWFgeiuuOaUvuWkp++8jOWmguaenOaDs+imgeeUn+aIkOWwj+WbvueahOaXtuWAmeS4jeWkseecn++8jOatpOmAiemhueW6lOivpeiuvue9ruS4umZhbHNlLlxuICAgICAgICAgICAgICogICAgIGFsbG93TWFnbmlmeTogZmFsc2UsXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAgIC8vIOaYr+WQpuWFgeiuuOijgeWJquOAglxuICAgICAgICAgICAgICogICAgIGNyb3A6IGZhbHNlLFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgICAvLyDmmK/lkKbkv53nlZnlpLTpg6htZXRh5L+h5oGv44CCXG4gICAgICAgICAgICAgKiAgICAgcHJlc2VydmVIZWFkZXJzOiB0cnVlXG4gICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgKiBgYGBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogMTYwMCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDE2MDAsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogOTAsXG4gICAgICAgICAgICAgICAgYWxsb3dNYWduaWZ5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjcm9wOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBwcmVzZXJ2ZUhlYWRlcnM6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICAnbWFrZS10aHVtYic6ICdtYWtlVGh1bWInLFxuICAgICAgICAgICAgJ2JlZm9yZS1zZW5kLWZpbGUnOiAnY29tcHJlc3NJbWFnZSdcbiAgICAgICAgfSwge1xuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnlJ/miJDnvKnnlaXlm77vvIzmraTov4fnqIvkuLrlvILmraXvvIzmiYDku6XpnIDopoHkvKDlhaVgY2FsbGJhY2tg44CCXG4gICAgICAgICAgICAgKiDpgJrluLjmg4XlhrXlnKjlm77niYfliqDlhaXpmJ/ph4zlkI7osIPnlKjmraTmlrnms5XmnaXnlJ/miJDpooTop4jlm77ku6Xlop7lvLrkuqTkupLmlYjmnpzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgY2FsbGJhY2tg5Lit5Y+v5Lul5o6l5pS25Yiw5Lik5Liq5Y+C5pWw44CCXG4gICAgICAgICAgICAgKiAqIOesrOS4gOS4quS4umVycm9y77yM5aaC5p6c55Sf5oiQ57yp55Wl5Zu+5pyJ6ZSZ6K+v77yM5q2kZXJyb3LlsIbkuLrnnJ/jgIJcbiAgICAgICAgICAgICAqICog56ys5LqM5Liq5Li6cmV0LCDnvKnnlaXlm77nmoREYXRhIFVSTOWAvOOAglxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICoq5rOo5oSPKipcbiAgICAgICAgICAgICAqIERhdGUgVVJM5ZyoSUU2LzfkuK3kuI3mlK/mjIHvvIzmiYDku6XkuI3nlKjosIPnlKjmraTmlrnms5XkuobvvIznm7TmjqXmmL7npLrkuIDlvKDmmoLkuI3mlK/mjIHpooTop4jlm77niYflpb3kuobjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1ldGhvZCBtYWtlVGh1bWJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIG1ha2VUaHVtYiggZmlsZSwgY2FsbGJhY2sgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIG1ha2VUaHVtYiggZmlsZSwgY2FsbGJhY2ssIHdpZHRoLCBoZWlnaHQgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogdXBsb2FkZXIub24oICdmaWxlUXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgKiAgICAgdmFyICRsaSA9IC4uLjtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgICAgdXBsb2FkZXIubWFrZVRodW1iKCBmaWxlLCBmdW5jdGlvbiggZXJyb3IsIHJldCApIHtcbiAgICAgICAgICAgICAqICAgICAgICAgaWYgKCBlcnJvciApIHtcbiAgICAgICAgICAgICAqICAgICAgICAgICAgICRsaS50ZXh0KCfpooTop4jplJnor68nKTtcbiAgICAgICAgICAgICAqICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAqICAgICAgICAgICAgICRsaS5hcHBlbmQoJzxpbWcgYWx0PVwiXCIgc3JjPVwiJyArIHJldCArICdcIiAvPicpO1xuICAgICAgICAgICAgICogICAgICAgICB9XG4gICAgICAgICAgICAgKiAgICAgfSk7XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG1ha2VUaHVtYjogZnVuY3Rpb24oIGZpbGUsIGNiLCB3aWR0aCwgaGVpZ2h0ICkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzLCBpbWFnZTtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlID0gdGhpcy5yZXF1ZXN0KCAnZ2V0LWZpbGUnLCBmaWxlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Y+q6aKE6KeI5Zu+54mH5qC85byP44CCXG4gICAgICAgICAgICAgICAgaWYgKCAhZmlsZS50eXBlLm1hdGNoKCAvXmltYWdlLyApICkge1xuICAgICAgICAgICAgICAgICAgICBjYiggdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG9wdHMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLnRodW1iICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5Lyg5YWl55qE5pivb2JqZWN0LlxuICAgICAgICAgICAgICAgIGlmICggJC5pc1BsYWluT2JqZWN0KCB3aWR0aCApICkge1xuICAgICAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoIG9wdHMsIHdpZHRoICk7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgd2lkdGggPSB3aWR0aCB8fCBvcHRzLndpZHRoO1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IGhlaWdodCB8fCBvcHRzLmhlaWdodDtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZSA9IG5ldyBJbWFnZSggb3B0cyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlLm9uY2UoICdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuX2luZm8gPSBmaWxlLl9pbmZvIHx8IGltYWdlLmluZm8oKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5fbWV0YSA9IGZpbGUuX21ldGEgfHwgaW1hZ2UubWV0YSgpO1xuICAgICAgICAgICAgICAgICAgICBpbWFnZS5yZXNpemUoIHdpZHRoLCBoZWlnaHQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZS5vbmNlKCAnY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoIGZhbHNlLCBpbWFnZS5nZXRBc0RhdGFVcmwoIG9wdHMudHlwZSApICk7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZS5vbmNlKCAnZXJyb3InLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoIHRydWUgKTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHRocm90dGxlKCBpbWFnZSwgZmlsZS5zb3VyY2Uuc2l6ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuX2luZm8gJiYgaW1hZ2UuaW5mbyggZmlsZS5faW5mbyApO1xuICAgICAgICAgICAgICAgICAgICBmaWxlLl9tZXRhICYmIGltYWdlLm1ldGEoIGZpbGUuX21ldGEgKTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UubG9hZEZyb21CbG9iKCBmaWxlLnNvdXJjZSApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGNvbXByZXNzSW1hZ2U6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLmNvbXByZXNzIHx8IHRoaXMub3B0aW9ucy5yZXNpemUsXG4gICAgICAgICAgICAgICAgICAgIGNvbXByZXNzU2l6ZSA9IG9wdHMgJiYgb3B0cy5jb21wcmVzc1NpemUgfHwgMzAwICogMTAyNCxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UsIGRlZmVycmVkO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUgPSB0aGlzLnJlcXVlc3QoICdnZXQtZmlsZScsIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlj6rpooTop4jlm77niYfmoLzlvI/jgIJcbiAgICAgICAgICAgICAgICBpZiAoICFvcHRzIHx8ICF+J2ltYWdlL2pwZWcsaW1hZ2UvanBnJy5pbmRleE9mKCBmaWxlLnR5cGUgKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zaXplIDwgY29tcHJlc3NTaXplIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLl9jb21wcmVzc2VkICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0cyApO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlID0gbmV3IEltYWdlKCBvcHRzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpbWFnZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpbWFnZS5vbmNlKCAnZXJyb3InLCBkZWZlcnJlZC5yZWplY3QgKTtcbiAgICAgICAgICAgICAgICBpbWFnZS5vbmNlKCAnbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlLl9pbmZvID0gZmlsZS5faW5mbyB8fCBpbWFnZS5pbmZvKCk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuX21ldGEgPSBmaWxlLl9tZXRhIHx8IGltYWdlLm1ldGEoKTtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UucmVzaXplKCBvcHRzLndpZHRoLCBvcHRzLmhlaWdodCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlLm9uY2UoICdjb21wbGV0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmxvYiwgc2l6ZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g56e75Yqo56uvIFVDIC8gcXEg5rWP6KeI5Zmo55qE5peg5Zu+5qih5byP5LiLXG4gICAgICAgICAgICAgICAgICAgIC8vIGN0eC5nZXRJbWFnZURhdGEg5aSE55CG5aSn5Zu+55qE5pe25YCZ5Lya5oqlIEV4Y2VwdGlvblxuICAgICAgICAgICAgICAgICAgICAvLyBJTkRFWF9TSVpFX0VSUjogRE9NIEV4Y2VwdGlvbiAxXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gaW1hZ2UuZ2V0QXNCbG9iKCBvcHRzLnR5cGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemUgPSBmaWxlLnNpemU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzljovnvKnlkI7vvIzmr5Tljp/mnaXov5jlpKfliJnkuI3nlKjljovnvKnlkI7nmoTjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYmxvYi5zaXplIDwgc2l6ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWxlLnNvdXJjZS5kZXN0cm95ICYmIGZpbGUuc291cmNlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNvdXJjZSA9IGJsb2I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zaXplID0gYmxvYi5zaXplO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUudHJpZ2dlciggJ3Jlc2l6ZScsIGJsb2Iuc2l6ZSwgc2l6ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5qCH6K6w77yM6YG/5YWN6YeN5aSN5Y6L57yp44CCXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLl9jb21wcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlh7rplJnkuobnm7TmjqXnu6fnu63vvIzorqnlhbbkuIrkvKDljp/lp4vlm77niYdcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUuX2luZm8gJiYgaW1hZ2UuaW5mbyggZmlsZS5faW5mbyApO1xuICAgICAgICAgICAgICAgIGZpbGUuX21ldGEgJiYgaW1hZ2UubWV0YSggZmlsZS5fbWV0YSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlLmxvYWRGcm9tQmxvYiggZmlsZS5zb3VyY2UgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOaWh+S7tuWxnuaAp+WwgeijhVxuICAgICAqL1xuICAgIGRlZmluZSgnZmlsZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgaWRQcmVmaXggPSAnV1VfRklMRV8nLFxuICAgICAgICAgICAgaWRTdWZmaXggPSAwLFxuICAgICAgICAgICAgckV4dCA9IC9cXC4oW14uXSspJC8sXG4gICAgICAgICAgICBzdGF0dXNNYXAgPSB7fTtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gZ2lkKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlkUHJlZml4ICsgaWRTdWZmaXgrKztcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5paH5Lu257G7XG4gICAgICAgICAqIEBjbGFzcyBGaWxlXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvciDmnoTpgKDlh73mlbBcbiAgICAgICAgICogQGdyYW1tYXIgbmV3IEZpbGUoIHNvdXJjZSApID0+IEZpbGVcbiAgICAgICAgICogQHBhcmFtIHtMaWIuRmlsZX0gc291cmNlIFtsaWIuRmlsZV0oI0xpYi5GaWxlKeWunuS+iywg5q2kc291cmNl5a+56LGh5piv5bim5pyJUnVudGltZeS/oeaBr+eahOOAglxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gV1VGaWxlKCBzb3VyY2UgKSB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuWQje+8jOWMheaLrOaJqeWxleWQje+8iOWQjue8gO+8iVxuICAgICAgICAgICAgICogQHByb3BlcnR5IG5hbWVcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMubmFtZSA9IHNvdXJjZS5uYW1lIHx8ICdVbnRpdGxlZCc7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuS9k+enr++8iOWtl+iKgu+8iVxuICAgICAgICAgICAgICogQHByb3BlcnR5IHNpemVcbiAgICAgICAgICAgICAqIEB0eXBlIHt1aW50fVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnNpemUgPSBzb3VyY2Uuc2l6ZSB8fCAwO1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlofku7ZNSU1FVFlQReexu+Wei++8jOS4juaWh+S7tuexu+Wei+eahOWvueW6lOWFs+ezu+ivt+WPguiAg1todHRwOi8vdC5jbi96OFpuRm55XShodHRwOi8vdC5jbi96OFpuRm55KVxuICAgICAgICAgICAgICogQHByb3BlcnR5IHR5cGVcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCAnYXBwbGljYXRpb24nXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHNvdXJjZS50eXBlIHx8ICdhcHBsaWNhdGlvbic7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuacgOWQjuS/ruaUueaXpeacn1xuICAgICAgICAgICAgICogQHByb3BlcnR5IGxhc3RNb2RpZmllZERhdGVcbiAgICAgICAgICAgICAqIEB0eXBlIHtpbnR9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCDlvZPliY3ml7bpl7TmiLNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5sYXN0TW9kaWZpZWREYXRlID0gc291cmNlLmxhc3RNb2RpZmllZERhdGUgfHwgKG5ldyBEYXRlKCkgKiAxKTtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5Lu2SUTvvIzmr4/kuKrlr7nosaHlhbfmnInllK/kuIBJRO+8jOS4juaWh+S7tuWQjeaXoOWFs1xuICAgICAgICAgICAgICogQHByb3BlcnR5IGlkXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmlkID0gZ2lkKCk7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuaJqeWxleWQje+8jOmAmui/h+aWh+S7tuWQjeiOt+WPlu+8jOS+i+WmgnRlc3QucG5n55qE5omp5bGV5ZCN5Li6cG5nXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgZXh0XG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmV4dCA9IHJFeHQuZXhlYyggdGhpcy5uYW1lICkgPyBSZWdFeHAuJDEgOiAnJztcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog54q25oCB5paH5a2X6K+05piO44CC5Zyo5LiN5ZCM55qEc3RhdHVz6K+t5aKD5LiL5pyJ5LiN5ZCM55qE55So6YCU44CCXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgc3RhdHVzVGV4dFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gJyc7XG4gICAgXG4gICAgICAgICAgICAvLyDlrZjlgqjmlofku7bnirbmgIHvvIzpmLLmraLpgJrov4flsZ7mgKfnm7TmjqXkv67mlLlcbiAgICAgICAgICAgIHN0YXR1c01hcFsgdGhpcy5pZCBdID0gV1VGaWxlLlN0YXR1cy5JTklURUQ7XG4gICAgXG4gICAgICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgICAgIHRoaXMubG9hZGVkID0gMDtcbiAgICBcbiAgICAgICAgICAgIHRoaXMub24oICdlcnJvcicsIGZ1bmN0aW9uKCBtc2cgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoIFdVRmlsZS5TdGF0dXMuRVJST1IsIG1zZyApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFdVRmlsZS5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6+572u54q25oCB77yM54q25oCB5Y+Y5YyW5pe25Lya6Kem5Y+RYGNoYW5nZWDkuovku7bjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc2V0U3RhdHVzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBzZXRTdGF0dXMoIHN0YXR1c1ssIHN0YXR1c1RleHRdICk7XG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGUuU3RhdHVzfFN0cmluZ30gc3RhdHVzIFvmlofku7bnirbmgIHlgLxdKCNXZWJVcGxvYWRlcjpGaWxlOkZpbGUuU3RhdHVzKVxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtzdGF0dXNUZXh0PScnXSDnirbmgIHor7TmmI7vvIzluLjlnKhlcnJvcuaXtuS9v+eUqO+8jOeUqGh0dHAsIGFib3J0LHNlcnZlcuetieadpeagh+iusOaYr+eUseS6juS7gOS5iOWOn+WboOWvvOiHtOaWh+S7tumUmeivr+OAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMsIHRleHQgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIHByZXZTdGF0dXMgPSBzdGF0dXNNYXBbIHRoaXMuaWQgXTtcbiAgICBcbiAgICAgICAgICAgICAgICB0eXBlb2YgdGV4dCAhPT0gJ3VuZGVmaW5lZCcgJiYgKHRoaXMuc3RhdHVzVGV4dCA9IHRleHQpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggc3RhdHVzICE9PSBwcmV2U3RhdHVzICkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNNYXBbIHRoaXMuaWQgXSA9IHN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIOaWh+S7tueKtuaAgeWPmOWMllxuICAgICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgc3RhdHVzY2hhbmdlXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoICdzdGF0dXNjaGFuZ2UnLCBzdGF0dXMsIHByZXZTdGF0dXMgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7bnirbmgIFcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0ZpbGUuU3RhdHVzfVxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAgICAgICAgIOaWh+S7tueKtuaAgeWFt+S9k+WMheaLrOS7peS4i+WHoOenjeexu+Wei++8mlxuICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWIneWni+WMllxuICAgICAgICAgICAgICAgICAgICAgICAgSU5JVEVEOiAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW3suWFpemYn+WIl1xuICAgICAgICAgICAgICAgICAgICAgICAgUVVFVUVEOiAgICAgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOato+WcqOS4iuS8oFxuICAgICAgICAgICAgICAgICAgICAgICAgUFJPR1JFU1M6ICAgICAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LiK5Lyg5Ye66ZSZXG4gICAgICAgICAgICAgICAgICAgICAgICBFUlJPUjogICAgICAgICAzLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LiK5Lyg5oiQ5YqfXG4gICAgICAgICAgICAgICAgICAgICAgICBDT01QTEVURTogICAgIDQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkuIrkvKDlj5bmtohcbiAgICAgICAgICAgICAgICAgICAgICAgIENBTkNFTExFRDogICAgIDVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0dXNNYXBbIHRoaXMuaWQgXTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiOt+WPluaWh+S7tuWOn+Wni+S/oeaBr+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0U291cmNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdG9yeTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHN0YXR1c01hcFsgdGhpcy5pZCBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBXVUZpbGUucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmlofku7bnirbmgIHlgLzvvIzlhbfkvZPljIXmi6zku6XkuIvlh6Dnp43nsbvlnovvvJpcbiAgICAgICAgICogKiBgaW5pdGVkYCDliJ3lp4vnirbmgIFcbiAgICAgICAgICogKiBgcXVldWVkYCDlt7Lnu4/ov5vlhaXpmJ/liJcsIOetieW+heS4iuS8oFxuICAgICAgICAgKiAqIGBwcm9ncmVzc2Ag5LiK5Lyg5LitXG4gICAgICAgICAqICogYGNvbXBsZXRlYCDkuIrkvKDlrozmiJDjgIJcbiAgICAgICAgICogKiBgZXJyb3JgIOS4iuS8oOWHuumUme+8jOWPr+mHjeivlVxuICAgICAgICAgKiAqIGBpbnRlcnJ1cHRgIOS4iuS8oOS4reaWre+8jOWPr+e7reS8oOOAglxuICAgICAgICAgKiAqIGBpbnZhbGlkYCDmlofku7bkuI3lkIjmoLzvvIzkuI3og73ph43or5XkuIrkvKDjgILkvJroh6rliqjku47pmJ/liJfkuK3np7vpmaTjgIJcbiAgICAgICAgICogKiBgY2FuY2VsbGVkYCDmlofku7booqvnp7vpmaTjgIJcbiAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFN0YXR1c1xuICAgICAgICAgKiBAbmFtZXNwYWNlIEZpbGVcbiAgICAgICAgICogQGNsYXNzIEZpbGVcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKi9cbiAgICAgICAgV1VGaWxlLlN0YXR1cyA9IHtcbiAgICAgICAgICAgIElOSVRFRDogICAgICdpbml0ZWQnLCAgICAvLyDliJ3lp4vnirbmgIFcbiAgICAgICAgICAgIFFVRVVFRDogICAgICdxdWV1ZWQnLCAgICAvLyDlt7Lnu4/ov5vlhaXpmJ/liJcsIOetieW+heS4iuS8oFxuICAgICAgICAgICAgUFJPR1JFU1M6ICAgJ3Byb2dyZXNzJywgICAgLy8g5LiK5Lyg5LitXG4gICAgICAgICAgICBFUlJPUjogICAgICAnZXJyb3InLCAgICAvLyDkuIrkvKDlh7rplJnvvIzlj6/ph43or5VcbiAgICAgICAgICAgIENPTVBMRVRFOiAgICdjb21wbGV0ZScsICAgIC8vIOS4iuS8oOWujOaIkOOAglxuICAgICAgICAgICAgQ0FOQ0VMTEVEOiAgJ2NhbmNlbGxlZCcsICAgIC8vIOS4iuS8oOWPlua2iOOAglxuICAgICAgICAgICAgSU5URVJSVVBUOiAgJ2ludGVycnVwdCcsICAgIC8vIOS4iuS8oOS4reaWre+8jOWPr+e7reS8oOOAglxuICAgICAgICAgICAgSU5WQUxJRDogICAgJ2ludmFsaWQnICAgIC8vIOaWh+S7tuS4jeWQiOagvO+8jOS4jeiDvemHjeivleS4iuS8oOOAglxuICAgICAgICB9O1xuICAgIFxuICAgICAgICByZXR1cm4gV1VGaWxlO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5paH5Lu26Zif5YiXXG4gICAgICovXG4gICAgZGVmaW5lKCdxdWV1ZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcicsXG4gICAgICAgICdmaWxlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciwgV1VGaWxlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIFNUQVRVUyA9IFdVRmlsZS5TdGF0dXM7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmlofku7bpmJ/liJcsIOeUqOadpeWtmOWCqOWQhOS4queKtuaAgeS4reeahOaWh+S7tuOAglxuICAgICAgICAgKiBAY2xhc3MgUXVldWVcbiAgICAgICAgICogQGV4dGVuZHMgTWVkaWF0b3JcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFF1ZXVlKCkge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnu5/orqHmlofku7bmlbDjgIJcbiAgICAgICAgICAgICAqICogYG51bU9mUXVldWVgIOmYn+WIl+S4reeahOaWh+S7tuaVsOOAglxuICAgICAgICAgICAgICogKiBgbnVtT2ZTdWNjZXNzYCDkuIrkvKDmiJDlip/nmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqICogYG51bU9mQ2FuY2VsYCDooqvnp7vpmaTnmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqICogYG51bU9mUHJvZ3Jlc3NgIOato+WcqOS4iuS8oOS4reeahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgbnVtT2ZVcGxvYWRGYWlsZWRgIOS4iuS8oOmUmeivr+eahOaWh+S7tuaVsOOAglxuICAgICAgICAgICAgICogKiBgbnVtT2ZJbnZhbGlkYCDml6DmlYjnmoTmlofku7bmlbDjgIJcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBzdGF0c1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnN0YXRzID0ge1xuICAgICAgICAgICAgICAgIG51bU9mUXVldWU6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZTdWNjZXNzOiAwLFxuICAgICAgICAgICAgICAgIG51bU9mQ2FuY2VsOiAwLFxuICAgICAgICAgICAgICAgIG51bU9mUHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZVcGxvYWRGYWlsZWQ6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZJbnZhbGlkOiAwXG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8g5LiK5Lyg6Zif5YiX77yM5LuF5YyF5ous562J5b6F5LiK5Lyg55qE5paH5Lu2XG4gICAgICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgIFxuICAgICAgICAgICAgLy8g5a2Y5YKo5omA5pyJ5paH5Lu2XG4gICAgICAgICAgICB0aGlzLl9tYXAgPSB7fTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAkLmV4dGVuZCggUXVldWUucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWwhuaWsOaWh+S7tuWKoOWFpeWvuemYn+WIl+WwvumDqFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZXRob2QgYXBwZW5kXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtGaWxlfSBmaWxlICAg5paH5Lu25a+56LGhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFwcGVuZDogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcXVldWUucHVzaCggZmlsZSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVBZGRlZCggZmlsZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5bCG5paw5paH5Lu25Yqg5YWl5a+56Zif5YiX5aS06YOoXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1ldGhvZCBwcmVwZW5kXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtGaWxlfSBmaWxlICAg5paH5Lu25a+56LGhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZXBlbmQ6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnVuc2hpZnQoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWxlQWRkZWQoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiOt+WPluaWh+S7tuWvueixoVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZXRob2QgZ2V0RmlsZVxuICAgICAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlSWQgICDmlofku7ZJRFxuICAgICAgICAgICAgICogQHJldHVybiB7RmlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RmlsZTogZnVuY3Rpb24oIGZpbGVJZCApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBmaWxlSWQgIT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZUlkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFwWyBmaWxlSWQgXTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOS7jumYn+WIl+S4reWPluWHuuS4gOS4quaMh+WumueKtuaAgeeahOaWh+S7tuOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgZmV0Y2goIHN0YXR1cyApID0+IEZpbGVcbiAgICAgICAgICAgICAqIEBtZXRob2QgZmV0Y2hcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdGF0dXMgW+aWh+S7tueKtuaAgeWAvF0oI1dlYlVwbG9hZGVyOkZpbGU6RmlsZS5TdGF0dXMpXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtGaWxlfSBbRmlsZV0oI1dlYlVwbG9hZGVyOkZpbGUpXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZldGNoOiBmdW5jdGlvbiggc3RhdHVzICkge1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLl9xdWV1ZS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGksIGZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgc3RhdHVzID0gc3RhdHVzIHx8IFNUQVRVUy5RVUVVRUQ7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHRoaXMuX3F1ZXVlWyBpIF07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggc3RhdHVzID09PSBmaWxlLmdldFN0YXR1cygpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlr7npmJ/liJfov5vooYzmjpLluo/vvIzog73lpJ/mjqfliLbmlofku7bkuIrkvKDpobrluo/jgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHNvcnQoIGZuICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHNvcnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIOaOkuW6j+aWueazlVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzb3J0OiBmdW5jdGlvbiggZm4gKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNvcnQoIGZuICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5oyH5a6a57G75Z6L55qE5paH5Lu25YiX6KGoLCDliJfooajkuK3mr4/kuIDkuKrmiJDlkZjkuLpbRmlsZV0oI1dlYlVwbG9hZGVyOkZpbGUp5a+56LGh44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRGaWxlcyggW3N0YXR1czFbLCBzdGF0dXMyIC4uLl1dICkgPT4gQXJyYXlcbiAgICAgICAgICAgICAqIEBtZXRob2QgZ2V0RmlsZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbc3RhdHVzXSBb5paH5Lu254q25oCB5YC8XSgjV2ViVXBsb2FkZXI6RmlsZTpGaWxlLlN0YXR1cylcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RmlsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBzdHMgPSBbXS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDAgKSxcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLl9xdWV1ZS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSB0aGlzLl9xdWV1ZVsgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN0cy5sZW5ndGggJiYgIX4kLmluQXJyYXkoIGZpbGUuZ2V0U3RhdHVzKCksIHN0cyApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goIGZpbGUgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfZmlsZUFkZGVkOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBleGlzdGluZyA9IHRoaXMuX21hcFsgZmlsZS5pZCBdO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWV4aXN0aW5nICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXBbIGZpbGUuaWQgXSA9IGZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZpbGUub24oICdzdGF0dXNjaGFuZ2UnLCBmdW5jdGlvbiggY3VyLCBwcmUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fb25GaWxlU3RhdHVzQ2hhbmdlKCBjdXIsIHByZSApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFNUQVRVUy5RVUVVRUQgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfb25GaWxlU3RhdHVzQ2hhbmdlOiBmdW5jdGlvbiggY3VyU3RhdHVzLCBwcmVTdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRzID0gdGhpcy5zdGF0cztcbiAgICBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBwcmVTdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLlBST0dSRVNTOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZQcm9ncmVzcy0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLlFVRVVFRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mUXVldWUgLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuRVJST1I6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlVwbG9hZEZhaWxlZC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLklOVkFMSUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZkludmFsaWQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBjdXJTdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLlFVRVVFRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mUXVldWUrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5QUk9HUkVTUzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mUHJvZ3Jlc3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5FUlJPUjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mVXBsb2FkRmFpbGVkKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuQ09NUExFVEU6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlN1Y2Nlc3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5DQU5DRUxMRUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZkNhbmNlbCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLklOVkFMSUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZkludmFsaWQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggUXVldWUucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIHJldHVybiBRdWV1ZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOmYn+WIl1xuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9xdWV1ZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdxdWV1ZScsXG4gICAgICAgICdmaWxlJyxcbiAgICAgICAgJ2xpYi9maWxlJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50JyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgUXVldWUsIFdVRmlsZSwgRmlsZSwgUnVudGltZUNsaWVudCApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICByRXh0ID0gL1xcLlxcdyskLyxcbiAgICAgICAgICAgIFN0YXR1cyA9IFdVRmlsZS5TdGF0dXM7XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICAnc29ydC1maWxlcyc6ICdzb3J0RmlsZXMnLFxuICAgICAgICAgICAgJ2FkZC1maWxlJzogJ2FkZEZpbGVzJyxcbiAgICAgICAgICAgICdnZXQtZmlsZSc6ICdnZXRGaWxlJyxcbiAgICAgICAgICAgICdmZXRjaC1maWxlJzogJ2ZldGNoRmlsZScsXG4gICAgICAgICAgICAnZ2V0LXN0YXRzJzogJ2dldFN0YXRzJyxcbiAgICAgICAgICAgICdnZXQtZmlsZXMnOiAnZ2V0RmlsZXMnLFxuICAgICAgICAgICAgJ3JlbW92ZS1maWxlJzogJ3JlbW92ZUZpbGUnLFxuICAgICAgICAgICAgJ3JldHJ5JzogJ3JldHJ5JyxcbiAgICAgICAgICAgICdyZXNldCc6ICdyZXNldCcsXG4gICAgICAgICAgICAnYWNjZXB0LWZpbGUnOiAnYWNjZXB0RmlsZSdcbiAgICAgICAgfSwge1xuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQsIGxlbiwgaSwgaXRlbSwgYXJyLCBhY2NlcHQsIHJ1bnRpbWU7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAkLmlzUGxhaW5PYmplY3QoIG9wdHMuYWNjZXB0ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuYWNjZXB0ID0gWyBvcHRzLmFjY2VwdCBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBhY2NlcHTkuK3nmoTkuK3nlJ/miJDljLnphY3mraPliJnjgIJcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuYWNjZXB0ICkge1xuICAgICAgICAgICAgICAgICAgICBhcnIgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGxlbiA9IG9wdHMuYWNjZXB0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IG9wdHMuYWNjZXB0WyBpIF0uZXh0ZW5zaW9ucztcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gJiYgYXJyLnB1c2goIGl0ZW0gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGFyci5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQgPSAnXFxcXC4nICsgYXJyLmpvaW4oJywnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSggLywvZywgJyR8XFxcXC4nIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoIC9cXCovZywgJy4qJyApICsgJyQnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG1lLmFjY2VwdCA9IG5ldyBSZWdFeHAoIGFjY2VwdCwgJ2knICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnF1ZXVlID0gbmV3IFF1ZXVlKCk7XG4gICAgICAgICAgICAgICAgbWUuc3RhdHMgPSBtZS5xdWV1ZS5zdGF0cztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzlvZPliY3kuI3mmK9odG1sNei/kOihjOaXtu+8jOmCo+Wwseeul+S6huOAglxuICAgICAgICAgICAgICAgIC8vIOS4jeaJp+ihjOWQjue7reaTjeS9nFxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5yZXF1ZXN0KCdwcmVkaWN0LXJ1bnRpbWUtdHlwZScpICE9PSAnaHRtbDUnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWIm+W7uuS4gOS4qiBodG1sNSDov5DooYzml7bnmoQgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgICAgICAvLyDku6Xoh7Pkuo7lpJbpg6jmt7vliqDljp/nlJ8gRmlsZSDlr7nosaHnmoTml7blgJnog73mraPnoa7ljIXoo7nkuIDkuIvkvpsgd2VidXBsb2FkZXIg5L2/55So44CCXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCk7XG4gICAgICAgICAgICAgICAgcnVudGltZSA9IG5ldyBSdW50aW1lQ2xpZW50KCdQbGFjZWhvbGRlcicpO1xuICAgICAgICAgICAgICAgIHJ1bnRpbWUuY29ubmVjdFJ1bnRpbWUoe1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lT3JkZXI6ICdodG1sNSdcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3J1aWQgPSBydW50aW1lLmdldFJ1aWQoKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgIFxuICAgICAgICAgICAgLy8g5Li65LqG5pSv5oyB5aSW6YOo55u05o6l5re75Yqg5LiA5Liq5Y6f55SfRmlsZeWvueixoeOAglxuICAgICAgICAgICAgX3dyYXBGaWxlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICBpZiAoICEoZmlsZSBpbnN0YW5jZW9mIFdVRmlsZSkgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggIShmaWxlIGluc3RhbmNlb2YgRmlsZSkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICF0aGlzLl9ydWlkICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBhZGQgZXh0ZXJuYWwgZmlsZXMuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlID0gbmV3IEZpbGUoIHRoaXMuX3J1aWQsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gbmV3IFdVRmlsZSggZmlsZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDliKTmlq3mlofku7bmmK/lkKblj6/ku6XooqvliqDlhaXpmJ/liJdcbiAgICAgICAgICAgIGFjY2VwdEZpbGU6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBpbnZhbGlkID0gIWZpbGUgfHwgZmlsZS5zaXplIDwgNiB8fCB0aGlzLmFjY2VwdCAmJlxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5ZCN5a2X5Lit5pyJ5ZCO57yA77yM5omN5YGa5ZCO57yA55m95ZCN5Y2V5aSE55CG44CCXG4gICAgICAgICAgICAgICAgICAgICAgICByRXh0LmV4ZWMoIGZpbGUubmFtZSApICYmICF0aGlzLmFjY2VwdC50ZXN0KCBmaWxlLm5hbWUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gIWludmFsaWQ7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgYmVmb3JlRmlsZVF1ZXVlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmlofku7booqvliqDlhaXpmJ/liJfkuYvliY3op6blj5HvvIzmraTkuovku7bnmoRoYW5kbGVy6L+U5Zue5YC85Li6YGZhbHNlYO+8jOWImeatpOaWh+S7tuS4jeS8muiiq+a3u+WKoOi/m+WFpemYn+WIl+OAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgZmlsZVF1ZXVlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmlofku7booqvliqDlhaXpmJ/liJfku6XlkI7op6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIF9hZGRGaWxlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUgPSBtZS5fd3JhcEZpbGUoIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuI3ov4fnsbvlnovliKTmlq3lhYHorrjkuI3lhYHorrjvvIzlhYjmtL7pgIEgYGJlZm9yZUZpbGVRdWV1ZWRgXG4gICAgICAgICAgICAgICAgaWYgKCAhbWUub3duZXIudHJpZ2dlciggJ2JlZm9yZUZpbGVRdWV1ZWQnLCBmaWxlICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g57G75Z6L5LiN5Yy56YWN77yM5YiZ5rS+6YCB6ZSZ6K+v5LqL5Lu277yM5bm26L+U5Zue44CCXG4gICAgICAgICAgICAgICAgaWYgKCAhbWUuYWNjZXB0RmlsZSggZmlsZSApICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAnZXJyb3InLCAnUV9UWVBFX0RFTklFRCcsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5xdWV1ZS5hcHBlbmQoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAnZmlsZVF1ZXVlZCcsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRGaWxlOiBmdW5jdGlvbiggZmlsZUlkICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLmdldEZpbGUoIGZpbGVJZCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IGZpbGVzUXVldWVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGVzIOaVsOe7hO+8jOWGheWuueS4uuWOn+Wni0ZpbGUobGliL0ZpbGXvvInlr7nosaHjgIJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPkuIDmibnmlofku7bmt7vliqDov5vpmJ/liJfku6XlkI7op6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCBhZGRGaWxlc1xuICAgICAgICAgICAgICogQGdyYW1tYXIgYWRkRmlsZXMoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGFkZEZpbGVzKCBbZmlsZTEsIGZpbGUyIC4uLl0gKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7QXJyYXkgb2YgRmlsZSBvciBGaWxlfSBbZmlsZXNdIEZpbGVzIOWvueixoSDmlbDnu4RcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmt7vliqDmlofku7bliLDpmJ/liJdcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFkZEZpbGVzOiBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFmaWxlcy5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVzID0gWyBmaWxlcyBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlcyA9ICQubWFwKCBmaWxlcywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5fYWRkRmlsZSggZmlsZSApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICdmaWxlc1F1ZXVlZCcsIGZpbGVzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5vcHRpb25zLmF1dG8gKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnJlcXVlc3QoJ3N0YXJ0LXVwbG9hZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTdGF0czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgZmlsZURlcXVldWVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aWh+S7tuiiq+enu+mZpOmYn+WIl+WQjuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHJlbW92ZUZpbGVcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlbW92ZUZpbGUoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlbW92ZUZpbGUoIGlkICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV8aWR9IGZpbGUgRmlsZeWvueixoeaIlui/mUZpbGXlr7nosaHnmoRpZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOenu+mZpOafkOS4gOaWh+S7tuOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogJGxpLm9uKCdjbGljaycsICcucmVtb3ZlLXRoaXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAqICAgICB1cGxvYWRlci5yZW1vdmVGaWxlKCBmaWxlICk7XG4gICAgICAgICAgICAgKiB9KVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZW1vdmVGaWxlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlLmlkID8gZmlsZSA6IG1lLnF1ZXVlLmdldEZpbGUoIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkNBTkNFTExFRCApO1xuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICdmaWxlRGVxdWV1ZWQnLCBmaWxlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGdldEZpbGVzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRGaWxlcygpID0+IEFycmF5XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRGaWxlcyggc3RhdHVzMSwgc3RhdHVzMiwgc3RhdHVzLi4uICkgPT4gQXJyYXlcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDov5Tlm57mjIflrprnirbmgIHnmoTmlofku7bpm4blkIjvvIzkuI3kvKDlj4LmlbDlsIbov5Tlm57miYDmnInnirbmgIHnmoTmlofku7bjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogY29uc29sZS5sb2coIHVwbG9hZGVyLmdldEZpbGVzKCkgKTsgICAgLy8gPT4gYWxsIGZpbGVzXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggdXBsb2FkZXIuZ2V0RmlsZXMoJ2Vycm9yJykgKSAgICAvLyA9PiBhbGwgZXJyb3IgZmlsZXMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEZpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5nZXRGaWxlcy5hcHBseSggdGhpcy5xdWV1ZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZmV0Y2hGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5mZXRjaC5hcHBseSggdGhpcy5xdWV1ZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHJldHJ5XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZXRyeSgpID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmV0cnkoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDph43or5XkuIrkvKDvvIzph43or5XmjIflrprmlofku7bvvIzmiJbogIXku47lh7rplJnnmoTmlofku7blvIDlp4vph43mlrDkuIrkvKDjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogZnVuY3Rpb24gcmV0cnkoKSB7XG4gICAgICAgICAgICAgKiAgICAgdXBsb2FkZXIucmV0cnkoKTtcbiAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmV0cnk6IGZ1bmN0aW9uKCBmaWxlLCBub0ZvcmNlU3RhcnQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMsIGksIGxlbjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlLmlkID8gZmlsZSA6IG1lLnF1ZXVlLmdldEZpbGUoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5RVUVVRUQgKTtcbiAgICAgICAgICAgICAgICAgICAgbm9Gb3JjZVN0YXJ0IHx8IG1lLnJlcXVlc3QoJ3N0YXJ0LXVwbG9hZCcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZpbGVzID0gbWUucXVldWUuZ2V0RmlsZXMoIFN0YXR1cy5FUlJPUiApO1xuICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgIGxlbiA9IGZpbGVzLmxlbmd0aDtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGZpbGVzWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuUVVFVUVEICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnJlcXVlc3QoJ3N0YXJ0LXVwbG9hZCcpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCBzb3J0XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBzb3J0KCBmbiApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaOkuW6j+mYn+WIl+S4reeahOaWh+S7tu+8jOWcqOS4iuS8oOS5i+WJjeiwg+aVtOWPr+S7peaOp+WItuS4iuS8oOmhuuW6j+OAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc29ydEZpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5zb3J0LmFwcGx5KCB0aGlzLnF1ZXVlLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgcmVzZXRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlc2V0KCkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6YeN572udXBsb2FkZXLjgILnm67liY3lj6rph43nva7kuobpmJ/liJfjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdXBsb2FkZXIucmVzZXQoKTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucXVldWUgPSBuZXcgUXVldWUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRzID0gdGhpcy5xdWV1ZS5zdGF0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDmt7vliqDojrflj5ZSdW50aW1l55u45YWz5L+h5oGv55qE5pa55rOV44CCXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL3J1bnRpbWUnLFtcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZScsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggVXBsb2FkZXIsIFJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIFVwbG9hZGVyLnN1cHBvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBSdW50aW1lLmhhc1J1bnRpbWUuYXBwbHkoIFJ1bnRpbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgJ3ByZWRpY3QtcnVudGltZS10eXBlJzogJ3ByZWRpY3RSdW50bWVUeXBlJ1xuICAgICAgICB9LCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoICF0aGlzLnByZWRpY3RSdW50bWVUeXBlKCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdSdW50aW1lIEVycm9yJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6aKE5rWLVXBsb2FkZXLlsIbph4fnlKjlk6rkuKpgUnVudGltZWBcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHByZWRpY3RSdW50bWVUeXBlKCkgPT4gU3RyaW5nXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHByZWRpY3RSdW50bWVUeXBlXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwcmVkaWN0UnVudG1lVHlwZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9yZGVycyA9IHRoaXMub3B0aW9ucy5ydW50aW1lT3JkZXIgfHwgUnVudGltZS5vcmRlcnMsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0aGlzLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGksIGxlbjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICF0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcnMgPSBvcmRlcnMuc3BsaXQoIC9cXHMqLFxccyovZyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gb3JkZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBSdW50aW1lLmhhc1J1bnRpbWUoIG9yZGVyc1sgaSBdICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlID0gdHlwZSA9IG9yZGVyc1sgaSBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFRyYW5zcG9ydFxuICAgICAqL1xuICAgIGRlZmluZSgnbGliL3RyYW5zcG9ydCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCcsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZUNsaWVudCwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBUcmFuc3BvcnQoIG9wdHMgKSB7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMgPSAkLmV4dGVuZCggdHJ1ZSwge30sIFRyYW5zcG9ydC5vcHRpb25zLCBvcHRzIHx8IHt9ICk7XG4gICAgICAgICAgICBSdW50aW1lQ2xpZW50LmNhbGwoIHRoaXMsICdUcmFuc3BvcnQnICk7XG4gICAgXG4gICAgICAgICAgICB0aGlzLl9ibG9iID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1EYXRhID0gb3B0cy5mb3JtRGF0YSB8fCB7fTtcbiAgICAgICAgICAgIHRoaXMuX2hlYWRlcnMgPSBvcHRzLmhlYWRlcnMgfHwge307XG4gICAgXG4gICAgICAgICAgICB0aGlzLm9uKCAncHJvZ3Jlc3MnLCB0aGlzLl90aW1lb3V0ICk7XG4gICAgICAgICAgICB0aGlzLm9uKCAnbG9hZCBlcnJvcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoICdwcm9ncmVzcycsIDEgKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIG1lLl90aW1lciApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgVHJhbnNwb3J0Lm9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzZXJ2ZXI6ICcnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgXG4gICAgICAgICAgICAvLyDot6jln5/ml7bvvIzmmK/lkKblhYHorrjmkLrluKZjb29raWUsIOWPquaciWh0bWw1IHJ1bnRpbWXmiY3mnInmlYhcbiAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogZmFsc2UsXG4gICAgICAgICAgICBmaWxlVmFsOiAnZmlsZScsXG4gICAgICAgICAgICB0aW1lb3V0OiAyICogNjAgKiAxMDAwLCAgICAvLyAy5YiG6ZKfXG4gICAgICAgICAgICBmb3JtRGF0YToge30sXG4gICAgICAgICAgICBoZWFkZXJzOiB7fSxcbiAgICAgICAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2VcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFRyYW5zcG9ydC5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoEJsb2IsIOWPquiDvea3u+WKoOS4gOasoe+8jOacgOWQjuS4gOasoeacieaViOOAglxuICAgICAgICAgICAgYXBwZW5kQmxvYjogZnVuY3Rpb24oIGtleSwgYmxvYiwgZmlsZW5hbWUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5nZXRSdWlkKCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOi/nuaOpeWIsGJsb2LlvZLlsZ7nmoTlkIzkuIDkuKpydW50aW1lLlxuICAgICAgICAgICAgICAgIG1lLmNvbm5lY3RSdW50aW1lKCBibG9iLnJ1aWQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCdpbml0Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX2Jsb2IgPSBibG9iO1xuICAgICAgICAgICAgICAgIG9wdHMuZmlsZVZhbCA9IGtleSB8fCBvcHRzLmZpbGVWYWw7XG4gICAgICAgICAgICAgICAgb3B0cy5maWxlbmFtZSA9IGZpbGVuYW1lIHx8IG9wdHMuZmlsZW5hbWU7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg5YW25LuW5a2X5q61XG4gICAgICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKCBrZXksIHZhbHVlICkge1xuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGtleSA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKCB0aGlzLl9mb3JtRGF0YSwga2V5ICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZm9ybURhdGFbIGtleSBdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHNldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCBrZXksIHZhbHVlICkge1xuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGtleSA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKCB0aGlzLl9oZWFkZXJzLCBrZXkgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oZWFkZXJzWyBrZXkgXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBzZW5kOiBmdW5jdGlvbiggbWV0aG9kICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXhlYyggJ3NlbmQnLCBtZXRob2QgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl90aW1lb3V0KCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgYWJvcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggdGhpcy5fdGltZXIgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCdhYm9ydCcpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcignZGVzdHJveScpO1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCdnZXRSZXNwb25zZScpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlQXNKc29uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCdnZXRSZXNwb25zZUFzSnNvbicpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYygnZ2V0U3RhdHVzJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3RpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gbWUub3B0aW9ucy50aW1lb3V0O1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWR1cmF0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggbWUuX3RpbWVyICk7XG4gICAgICAgICAgICAgICAgbWUuX3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ2Vycm9yJywgJ3RpbWVvdXQnICk7XG4gICAgICAgICAgICAgICAgfSwgZHVyYXRpb24gKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8vIOiuqVRyYW5zcG9ydOWFt+Wkh+S6i+S7tuWKn+iDveOAglxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIFRyYW5zcG9ydC5wcm90b3R5cGUgKTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFRyYW5zcG9ydDtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOi0n+i0o+aWh+S7tuS4iuS8oOebuOWFs+OAglxuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy91cGxvYWQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAnZmlsZScsXG4gICAgICAgICdsaWIvdHJhbnNwb3J0JyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgV1VGaWxlLCBUcmFuc3BvcnQgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgaXNQcm9taXNlID0gQmFzZS5pc1Byb21pc2UsXG4gICAgICAgICAgICBTdGF0dXMgPSBXVUZpbGUuU3RhdHVzO1xuICAgIFxuICAgICAgICAvLyDmt7vliqDpu5jorqTphY3nva7poblcbiAgICAgICAgJC5leHRlbmQoIFVwbG9hZGVyLm9wdGlvbnMsIHtcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCb29sZWFufSBbcHJlcGFyZU5leHRGaWxlPWZhbHNlXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5piv5ZCm5YWB6K645Zyo5paH5Lu25Lyg6L6T5pe25o+Q5YmN5oqK5LiL5LiA5Liq5paH5Lu25YeG5aSH5aW944CCXG4gICAgICAgICAgICAgKiDlr7nkuo7kuIDkuKrmlofku7bnmoTlh4blpIflt6XkvZzmr5TovoPogJfml7bvvIzmr5TlpoLlm77niYfljovnvKnvvIxtZDXluo/liJfljJbjgIJcbiAgICAgICAgICAgICAqIOWmguaenOiDveaPkOWJjeWcqOW9k+WJjeaWh+S7tuS8oOi+k+acn+WkhOeQhu+8jOWPr+S7peiKguecgeaAu+S9k+iAl+aXtuOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwcmVwYXJlTmV4dEZpbGU6IGZhbHNlLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFtjaHVua2VkPWZhbHNlXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5piv5ZCm6KaB5YiG54mH5aSE55CG5aSn5paH5Lu25LiK5Lyg44CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNodW5rZWQ6IGZhbHNlLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFtjaHVua1NpemU9NTI0Mjg4MF1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOWmguaenOimgeWIhueJh++8jOWIhuWkmuWkp+S4gOeJh++8nyDpu5jorqTlpKflsI/kuLo1TS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2h1bmtTaXplOiA1ICogMTAyNCAqIDEwMjQsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gW2NodW5rUmV0cnk9Ml1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOWmguaenOafkOS4quWIhueJh+eUseS6jue9kee7nOmXrumimOWHuumUme+8jOWFgeiuuOiHquWKqOmHjeS8oOWkmuWwkeasoe+8n1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjaHVua1JldHJ5OiAyLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFt0aHJlYWRzPTNdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDkuIrkvKDlubblj5HmlbDjgILlhYHorrjlkIzml7bmnIDlpKfkuIrkvKDov5vnqIvmlbDjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhyZWFkczogMyxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtmb3JtRGF0YV1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaWh+S7tuS4iuS8oOivt+axgueahOWPguaVsOihqO+8jOavj+asoeWPkemAgemDveS8muWPkemAgeatpOWvueixoeS4reeahOWPguaVsOOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmb3JtRGF0YTogbnVsbFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW2ZpbGVWYWw9J2ZpbGUnXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6K6+572u5paH5Lu25LiK5Lyg5Z+f55qEbmFtZeOAglxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbbWV0aG9kPSdQT1NUJ11cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaWh+S7tuS4iuS8oOaWueW8j++8jGBQT1NUYOaIluiAhWBHRVRg44CCXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtzZW5kQXNCaW5hcnk9ZmFsc2VdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmmK/lkKblt7Lkuozov5vliLbnmoTmtYHnmoTmlrnlvI/lj5HpgIHmlofku7bvvIzov5nmoLfmlbTkuKrkuIrkvKDlhoXlrrlgcGhwOi8vaW5wdXRg6YO95Li65paH5Lu25YaF5a6577yMXG4gICAgICAgICAgICAgKiDlhbbku5blj4LmlbDlnKgkX0dFVOaVsOe7hOS4reOAglxuICAgICAgICAgICAgICovXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvLyDotJ/otKPlsIbmlofku7bliIfniYfjgIJcbiAgICAgICAgZnVuY3Rpb24gQ3V0ZUZpbGUoIGZpbGUsIGNodW5rU2l6ZSApIHtcbiAgICAgICAgICAgIHZhciBwZW5kaW5nID0gW10sXG4gICAgICAgICAgICAgICAgYmxvYiA9IGZpbGUuc291cmNlLFxuICAgICAgICAgICAgICAgIHRvdGFsID0gYmxvYi5zaXplLFxuICAgICAgICAgICAgICAgIGNodW5rcyA9IGNodW5rU2l6ZSA/IE1hdGguY2VpbCggdG90YWwgLyBjaHVua1NpemUgKSA6IDEsXG4gICAgICAgICAgICAgICAgc3RhcnQgPSAwLFxuICAgICAgICAgICAgICAgIGluZGV4ID0gMCxcbiAgICAgICAgICAgICAgICBsZW47XG4gICAgXG4gICAgICAgICAgICB3aGlsZSAoIGluZGV4IDwgY2h1bmtzICkge1xuICAgICAgICAgICAgICAgIGxlbiA9IE1hdGgubWluKCBjaHVua1NpemUsIHRvdGFsIC0gc3RhcnQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBwZW5kaW5nLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIGVuZDogY2h1bmtTaXplID8gKHN0YXJ0ICsgbGVuKSA6IHRvdGFsLFxuICAgICAgICAgICAgICAgICAgICB0b3RhbDogdG90YWwsXG4gICAgICAgICAgICAgICAgICAgIGNodW5rczogY2h1bmtzLFxuICAgICAgICAgICAgICAgICAgICBjaHVuazogaW5kZXgrK1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0YXJ0ICs9IGxlbjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGZpbGUuYmxvY2tzID0gcGVuZGluZy5jb25jYXQoKTtcbiAgICAgICAgICAgIGZpbGUucmVtYW5pbmcgPSBwZW5kaW5nLmxlbmd0aDtcbiAgICBcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZmlsZTogZmlsZSxcbiAgICBcbiAgICAgICAgICAgICAgICBoYXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISFwZW5kaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgICAgIGZldGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBlbmRpbmcuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICdzdGFydC11cGxvYWQnOiAnc3RhcnQnLFxuICAgICAgICAgICAgJ3N0b3AtdXBsb2FkJzogJ3N0b3AnLFxuICAgICAgICAgICAgJ3NraXAtZmlsZSc6ICdza2lwRmlsZScsXG4gICAgICAgICAgICAnaXMtaW4tcHJvZ3Jlc3MnOiAnaXNJblByb2dyZXNzJ1xuICAgICAgICB9LCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucnVuaW5nID0gZmFsc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6K6w5b2V5b2T5YmN5q2j5Zyo5Lyg55qE5pWw5o2u77yM6LefdGhyZWFkc+ebuOWFs1xuICAgICAgICAgICAgICAgIHRoaXMucG9vbCA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOe8k+WtmOWNs+WwhuS4iuS8oOeahOaWh+S7tuOAglxuICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZyA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOi3n+i4qui/mOacieWkmuWwkeWIhueJh+ayoeacieWujOaIkOS4iuS8oOOAglxuICAgICAgICAgICAgICAgIHRoaXMucmVtYW5pbmcgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX190aWNrID0gQmFzZS5iaW5kRm4oIHRoaXMuX3RpY2ssIHRoaXMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBvd25lci5vbiggJ3VwbG9hZENvbXBsZXRlJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaKiuWFtuS7luWdl+WPlua2iOS6huOAglxuICAgICAgICAgICAgICAgICAgICBmaWxlLmJsb2NrcyAmJiAkLmVhY2goIGZpbGUuYmxvY2tzLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYudHJhbnNwb3J0ICYmICh2LnRyYW5zcG9ydC5hYm9ydCgpLCB2LnRyYW5zcG9ydC5kZXN0cm95KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYudHJhbnNwb3J0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGZpbGUuYmxvY2tzO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZmlsZS5yZW1hbmluZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCBzdGFydFVwbG9hZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+W8gOWni+S4iuS8oOa1geeoi+aXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlvIDlp4vkuIrkvKDjgILmraTmlrnms5Xlj6/ku6Xku47liJ3lp4vnirbmgIHosIPnlKjlvIDlp4vkuIrkvKDmtYHnqIvvvIzkuZ/lj6/ku6Xku47mmoLlgZznirbmgIHosIPnlKjvvIznu6fnu63kuIrkvKDmtYHnqIvjgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHVwbG9hZCgpID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQG1ldGhvZCB1cGxvYWRcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOenu+WHumludmFsaWTnmoTmlofku7ZcbiAgICAgICAgICAgICAgICAkLmVhY2goIG1lLnJlcXVlc3QoICdnZXQtZmlsZXMnLCBTdGF0dXMuSU5WQUxJRCApLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVxdWVzdCggJ3JlbW92ZS1maWxlJywgdGhpcyApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggbWUucnVuaW5nICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnJ1bmluZyA9IHRydWU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyJ5pqC5YGc55qE77yM5YiZ57ut5LygXG4gICAgICAgICAgICAgICAgJC5lYWNoKCBtZS5wb29sLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGUgPSB2LmZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLklOVEVSUlVQVCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuUFJPR1JFU1MgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl90cmlnZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB2LnRyYW5zcG9ydCAmJiB2LnRyYW5zcG9ydC5zZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ3N0YXJ0VXBsb2FkJyk7XG4gICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgc3RvcFVwbG9hZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+W8gOWni+S4iuS8oOa1geeoi+aaguWBnOaXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmmoLlgZzkuIrkvKDjgILnrKzkuIDkuKrlj4LmlbDkuLrmmK/lkKbkuK3mlq3kuIrkvKDlvZPliY3mraPlnKjkuIrkvKDnmoTmlofku7bjgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHN0b3AoKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHN0b3AoIHRydWUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc3RvcFxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24oIGludGVycnVwdCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggbWUucnVuaW5nID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5ydW5pbmcgPSBmYWxzZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbnRlcnJ1cHQgJiYgJC5lYWNoKCBtZS5wb29sLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgdi50cmFuc3BvcnQgJiYgdi50cmFuc3BvcnQuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgdi5maWxlLnNldFN0YXR1cyggU3RhdHVzLklOVEVSUlVQVCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ3N0b3BVcGxvYWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWIpOaWrWBVcGxhb2RlYHLmmK/lkKbmraPlnKjkuIrkvKDkuK3jgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGlzSW5Qcm9ncmVzcygpID0+IEJvb2xlYW5cbiAgICAgICAgICAgICAqIEBtZXRob2QgaXNJblByb2dyZXNzXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0luUHJvZ3Jlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIXRoaXMucnVuaW5nO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFN0YXRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCdnZXQtc3RhdHMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaOiei/h+S4gOS4quaWh+S7tuS4iuS8oO+8jOebtOaOpeagh+iusOaMh+WumuaWh+S7tuS4uuW3suS4iuS8oOeKtuaAgeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgc2tpcEZpbGUoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc2tpcEZpbGVcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNraXBGaWxlOiBmdW5jdGlvbiggZmlsZSwgc3RhdHVzICkge1xuICAgICAgICAgICAgICAgIGZpbGUgPSB0aGlzLnJlcXVlc3QoICdnZXQtZmlsZScsIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggc3RhdHVzIHx8IFN0YXR1cy5DT01QTEVURSApO1xuICAgICAgICAgICAgICAgIGZpbGUuc2tpcHBlZCA9IHRydWU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5q2j5Zyo5LiK5Lyg44CCXG4gICAgICAgICAgICAgICAgZmlsZS5ibG9ja3MgJiYgJC5lYWNoKCBmaWxlLmJsb2NrcywgZnVuY3Rpb24oIF8sIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfdHIgPSB2LnRyYW5zcG9ydDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBfdHIgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdHIuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90ci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdi50cmFuc3BvcnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLm93bmVyLnRyaWdnZXIoICd1cGxvYWRTa2lwJywgZmlsZSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZEZpbmlzaGVkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5omA5pyJ5paH5Lu25LiK5Lyg57uT5p2f5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBfdGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGZuLCB2YWw7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5LiK5LiA5LiqcHJvbWlzZei/mOayoeaciee7k+adn++8jOWImeetieW+heWujOaIkOWQjuWGjeaJp+ihjOOAglxuICAgICAgICAgICAgICAgIGlmICggbWUuX3Byb21pc2UgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5fcHJvbWlzZS5hbHdheXMoIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDov5jmnInkvY3nva7vvIzkuJTov5jmnInmlofku7bopoHlpITnkIbnmoTor53jgIJcbiAgICAgICAgICAgICAgICBpZiAoIG1lLnBvb2wubGVuZ3RoIDwgb3B0cy50aHJlYWRzICYmICh2YWwgPSBtZS5fbmV4dEJsb2NrKCkpICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCA9IGZhbHNlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmbiA9IGZ1bmN0aW9uKCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcHJvbWlzZSA9IG51bGw7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnInlj6/og73mmK9yZWplY3Tov4fmnaXnmoTvvIzmiYDku6XopoHmo4DmtYt2YWznmoTnsbvlnovjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCAmJiB2YWwuZmlsZSAmJiBtZS5fc3RhcnRTZW5kKCB2YWwgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEJhc2UubmV4dFRpY2soIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBtZS5fcHJvbWlzZSA9IGlzUHJvbWlzZSggdmFsICkgPyB2YWwuYWx3YXlzKCBmbiApIDogZm4oIHZhbCApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOayoeacieimgeS4iuS8oOeahOS6hu+8jOS4lOayoeacieato+WcqOS8oOi+k+eahOS6huOAglxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoICFtZS5yZW1hbmluZyAmJiAhbWUuZ2V0U3RhdHMoKS5udW1PZlF1ZXVlICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5ydW5pbmcgPSBmYWxzZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuX3RyaWdnZWQgfHwgQmFzZS5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ3VwbG9hZEZpbmlzaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9uZXh0QmxvY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGFjdCA9IG1lLl9hY3QsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBuZXh0LCBkb25lO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOW9k+WJjeaWh+S7tui/mOacieayoeaciemcgOimgeS8oOi+k+eahO+8jOWImeebtOaOpei/lOWbnuWJqeS4i+eahOOAglxuICAgICAgICAgICAgICAgIGlmICggYWN0ICYmIGFjdC5oYXMoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0LmZpbGUuZ2V0U3RhdHVzKCkgPT09IFN0YXR1cy5QUk9HUkVTUyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5piv5ZCm5o+Q5YmN5YeG5aSH5LiL5LiA5Liq5paH5Lu2XG4gICAgICAgICAgICAgICAgICAgIGlmICggb3B0cy5wcmVwYXJlTmV4dEZpbGUgJiYgIW1lLnBlbmRpbmcubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3ByZXBhcmVOZXh0RmlsZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3QuZmV0Y2goKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlkKbliJnvvIzlpoLmnpzmraPlnKjov5DooYzvvIzliJnlh4blpIfkuIvkuIDkuKrmlofku7bvvIzlubbnrYnlvoXlrozmiJDlkI7ov5Tlm57kuIvkuKrliIbniYfjgIJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBtZS5ydW5pbmcgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOe8k+WtmOS4reacie+8jOWImeebtOaOpeWcqOe8k+WtmOS4reWPlu+8jOayoeacieWImeWOu3F1ZXVl5Lit5Y+W44CCXG4gICAgICAgICAgICAgICAgICAgIGlmICggIW1lLnBlbmRpbmcubGVuZ3RoICYmIG1lLmdldFN0YXRzKCkubnVtT2ZRdWV1ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wcmVwYXJlTmV4dEZpbGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBuZXh0ID0gbWUucGVuZGluZy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBkb25lID0gZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0ID0gQ3V0ZUZpbGUoIGZpbGUsIG9wdHMuY2h1bmtlZCA/IG9wdHMuY2h1bmtTaXplIDogMCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX2FjdCA9IGFjdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3QuZmV0Y2goKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5paH5Lu25Y+v6IO96L+Y5ZyocHJlcGFyZeS4re+8jOS5n+acieWPr+iDveW3sue7j+WujOWFqOWHhuWkh+WlveS6huOAglxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNQcm9taXNlKCBuZXh0ICkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRbIG5leHQucGlwZSA/ICdwaXBlJyA6ICd0aGVuJ10oIGRvbmUgKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZSggbmV4dCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRTdGFydFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmn5DkuKrmlofku7blvIDlp4vkuIrkvKDliY3op6blj5HvvIzkuIDkuKrmlofku7blj6rkvJrop6blj5HkuIDmrKHjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIF9wcmVwYXJlTmV4dEZpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBtZS5yZXF1ZXN0KCdmZXRjaC1maWxlJyksXG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmcgPSBtZS5wZW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSA9IG1lLnJlcXVlc3QoICdiZWZvcmUtc2VuZC1maWxlJywgZmlsZSwgZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnInlj6/og73mlofku7booqtza2lw5o6J5LqG44CC5paH5Lu26KKrc2tpcOaOieWQju+8jOeKtuaAgeWdkeWumuS4jeaYr1F1ZXVlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLlFVRVVFRCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAndXBsb2FkU3RhcnQnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5QUk9HUkVTUyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLl9maW5pc2hGaWxlKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzov5jlnKhwZW5kaW5n5Lit77yM5YiZ5pu/5o2i5oiQ5paH5Lu25pys6Lqr44CCXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZHggPSAkLmluQXJyYXkoIHByb21pc2UsIHBlbmRpbmcgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH5pZHggJiYgcGVuZGluZy5zcGxpY2UoIGlkeCwgMSwgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gYmVmZW9yZS1zZW5kLWZpbGXnmoTpkqnlrZDlsLHmnInplJnor6/lj5HnlJ/jgIJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5mYWlsKGZ1bmN0aW9uKCByZWFzb24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkVSUk9SLCByZWFzb24gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICd1cGxvYWRFcnJvcicsIGZpbGUsIHJlYXNvbiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ3VwbG9hZENvbXBsZXRlJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZy5wdXNoKCBwcm9taXNlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOiuqeWHuuS9jee9ruS6hu+8jOWPr+S7peiuqeWFtuS7luWIhueJh+W8gOWni+S4iuS8oFxuICAgICAgICAgICAgX3BvcEJsb2NrOiBmdW5jdGlvbiggYmxvY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9ICQuaW5BcnJheSggYmxvY2ssIHRoaXMucG9vbCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucG9vbC5zcGxpY2UoIGlkeCwgMSApO1xuICAgICAgICAgICAgICAgIGJsb2NrLmZpbGUucmVtYW5pbmctLTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbWFuaW5nLS07XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g5byA5aeL5LiK5Lyg77yM5Y+v5Lul6KKr5o6J6L+H44CC5aaC5p6ccHJvbWlzZeiiq3JlamVjdOS6hu+8jOWImeihqOekuui3s+i/h+atpOWIhueJh+OAglxuICAgICAgICAgICAgX3N0YXJ0U2VuZDogZnVuY3Rpb24oIGJsb2NrICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBibG9jay5maWxlLFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLnBvb2wucHVzaCggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICBtZS5yZW1hbmluZysrO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOayoeacieWIhueJh++8jOWImeebtOaOpeS9v+eUqOWOn+Wni+eahOOAglxuICAgICAgICAgICAgICAgIC8vIOS4jeS8muS4ouWksWNvbnRlbnQtdHlwZeS/oeaBr+OAglxuICAgICAgICAgICAgICAgIGJsb2NrLmJsb2IgPSBibG9jay5jaHVua3MgPT09IDEgPyBmaWxlLnNvdXJjZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNvdXJjZS5zbGljZSggYmxvY2suc3RhcnQsIGJsb2NrLmVuZCApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGhvb2ssIOavj+S4quWIhueJh+WPkemAgeS5i+WJjeWPr+iDveimgeWBmuS6m+W8guatpeeahOS6i+aDheOAglxuICAgICAgICAgICAgICAgIHByb21pc2UgPSBtZS5yZXF1ZXN0KCAnYmVmb3JlLXNlbmQnLCBibG9jaywgZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOacieWPr+iDveaWh+S7tuW3sue7j+S4iuS8oOWHuumUmeS6hu+8jOaJgOS7peS4jemcgOimgeWGjeS8oOi+k+S6huOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoIGZpbGUuZ2V0U3RhdHVzKCkgPT09IFN0YXR1cy5QUk9HUkVTUyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9kb1NlbmQoIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcG9wQmxvY2soIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBCYXNlLm5leHRUaWNrKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOS4umZhaWzkuobvvIzliJnot7Pov4fmraTliIbniYfjgIJcbiAgICAgICAgICAgICAgICBwcm9taXNlLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5yZW1hbmluZyA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9maW5pc2hGaWxlKCBmaWxlICkuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnBlcmNlbnRhZ2UgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wb3BCbG9jayggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAndXBsb2FkQ29tcGxldGUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnBlcmNlbnRhZ2UgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3BvcEJsb2NrKCBibG9jayApO1xuICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRCZWZvcmVTZW5kXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSDpu5jorqTnmoTkuIrkvKDlj4LmlbDvvIzlj6/ku6XmianlsZXmraTlr7nosaHmnaXmjqfliLbkuIrkvKDlj4LmlbDjgIJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmn5DkuKrmlofku7bnmoTliIblnZflnKjlj5HpgIHliY3op6blj5HvvIzkuLvopoHnlKjmnaXor6Lpl67mmK/lkKbopoHmt7vliqDpmYTluKblj4LmlbDvvIzlpKfmlofku7blnKjlvIDotbfliIbniYfkuIrkvKDnmoTliY3mj5DkuIvmraTkuovku7blj6/og73kvJrop6blj5HlpJrmrKHjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZEFjY2VwdFxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHJldCDmnI3liqHnq6/nmoTov5Tlm57mlbDmja7vvIxqc29u5qC85byP77yM5aaC5p6c5pyN5Yqh56uv5LiN5pivanNvbuagvOW8j++8jOS7jnJldC5fcmF35Lit5Y+W5pWw5o2u77yM6Ieq6KGM6Kej5p6Q44CCXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5p+Q5Liq5paH5Lu25LiK5Lyg5Yiw5pyN5Yqh56uv5ZON5bqU5ZCO77yM5Lya5rS+6YCB5q2k5LqL5Lu25p2l6K+i6Zeu5pyN5Yqh56uv5ZON5bqU5piv5ZCm5pyJ5pWI44CC5aaC5p6c5q2k5LqL5Lu2aGFuZGxlcui/lOWbnuWAvOS4umBmYWxzZWAsIOWImeatpOaWh+S7tuWwhua0vumAgWBzZXJ2ZXJg57G75Z6L55qEYHVwbG9hZEVycm9yYOS6i+S7tuOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkUHJvZ3Jlc3NcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gcGVyY2VudGFnZSDkuIrkvKDov5vluqZcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDkuIrkvKDov4fnqIvkuK3op6blj5HvvIzmkLrluKbkuIrkvKDov5vluqbjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZEVycm9yXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHJlYXNvbiDlh7rplJnnmoRjb2RlXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5paH5Lu25LiK5Lyg5Ye66ZSZ5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRTdWNjZXNzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIOacjeWKoeerr+i/lOWbnueahOaVsOaNrlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aWh+S7tuS4iuS8oOaIkOWKn+aXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkQ29tcGxldGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gW2ZpbGVdIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDkuI3nrqHmiJDlip/miJbogIXlpLHotKXvvIzmlofku7bkuIrkvKDlrozmiJDml7bop6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8vIOWBmuS4iuS8oOaTjeS9nOOAglxuICAgICAgICAgICAgX2RvU2VuZDogZnVuY3Rpb24oIGJsb2NrICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG93bmVyID0gbWUub3duZXIsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gYmxvY2suZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgdHIgPSBuZXcgVHJhbnNwb3J0KCBvcHRzICksXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZCh7fSwgb3B0cy5mb3JtRGF0YSApLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzID0gJC5leHRlbmQoe30sIG9wdHMuaGVhZGVycyApLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0QWNjZXB0LCByZXQ7XG4gICAgXG4gICAgICAgICAgICAgICAgYmxvY2sudHJhbnNwb3J0ID0gdHI7XG4gICAgXG4gICAgICAgICAgICAgICAgdHIub24oICdkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBibG9jay50cmFuc3BvcnQ7XG4gICAgICAgICAgICAgICAgICAgIG1lLl9wb3BCbG9jayggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5bm/5pKt5LiK5Lyg6L+b5bqm44CC5Lul5paH5Lu25Li65Y2V5L2N44CCXG4gICAgICAgICAgICAgICAgdHIub24oICdwcm9ncmVzcycsIGZ1bmN0aW9uKCBwZXJjZW50YWdlICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG90YWxQZXJjZW50ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGVkID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y+v6IO95rKh5pyJYWJvcnTmjonvvIxwcm9ncmVzc+i/mOaYr+aJp+ihjOi/m+adpeS6huOAglxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoICFmaWxlLmJsb2NrcyApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB0b3RhbFBlcmNlbnQgPSBibG9jay5wZXJjZW50YWdlID0gcGVyY2VudGFnZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBibG9jay5jaHVua3MgPiAxICkgeyAgICAvLyDorqHnrpfmlofku7bnmoTmlbTkvZPpgJ/luqbjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCggZmlsZS5ibG9ja3MsIGZ1bmN0aW9uKCBfLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGVkICs9ICh2LnBlcmNlbnRhZ2UgfHwgMCkgKiAodi5lbmQgLSB2LnN0YXJ0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxQZXJjZW50ID0gdXBsb2FkZWQgLyBmaWxlLnNpemU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZFByb2dyZXNzJywgZmlsZSwgdG90YWxQZXJjZW50IHx8IDAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDnlKjmnaXor6Lpl67vvIzmmK/lkKbov5Tlm57nmoTnu5PmnpzmmK/mnInplJnor6/nmoTjgIJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QWNjZXB0ID0gZnVuY3Rpb24oIHJlamVjdCApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXQgPSB0ci5nZXRSZXNwb25zZUFzSnNvbigpIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICByZXQuX3JhdyA9IHRyLmdldFJlc3BvbnNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGZuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOacjeWKoeerr+WTjeW6lOS6hu+8jOS4jeS7o+ihqOaIkOWKn+S6hu+8jOivoumXruaYr+WQpuWTjeW6lOato+ehruOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoICFvd25lci50cmlnZ2VyKCAndXBsb2FkQWNjZXB0JywgYmxvY2ssIHJldCwgZm4gKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCA9IHJlamVjdCB8fCAnc2VydmVyJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5bCd6K+V6YeN6K+V77yM54S25ZCO5bm/5pKt5paH5Lu25LiK5Lyg5Ye66ZSZ44CCXG4gICAgICAgICAgICAgICAgdHIub24oICdlcnJvcicsIGZ1bmN0aW9uKCB0eXBlLCBmbGFnICkge1xuICAgICAgICAgICAgICAgICAgICBibG9jay5yZXRyaWVkID0gYmxvY2sucmV0cmllZCB8fCAwO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDoh6rliqjph43or5VcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBibG9jay5jaHVua3MgPiAxICYmIH4naHR0cCxhYm9ydCcuaW5kZXhPZiggdHlwZSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2sucmV0cmllZCA8IG9wdHMuY2h1bmtSZXRyeSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnJldHJpZWQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyLnNlbmQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHAgc3RhdHVzIDUwMCB+IDYwMFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhZmxhZyAmJiB0eXBlID09PSAnc2VydmVyJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gcmVxdWVzdEFjY2VwdCggdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5FUlJPUiwgdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZEVycm9yJywgZmlsZSwgdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZENvbXBsZXRlJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5LiK5Lyg5oiQ5YqfXG4gICAgICAgICAgICAgICAgdHIub24oICdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWFzb247XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOmdnumihOacn++8jOi9rOWQkeS4iuS8oOWHuumUmeOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoIChyZWFzb24gPSByZXF1ZXN0QWNjZXB0KCkpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHIudHJpZ2dlciggJ2Vycm9yJywgcmVhc29uLCB0cnVlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5YWo6YOo5LiK5Lyg5a6M5oiQ44CCXG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5yZW1hbmluZyA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9maW5pc2hGaWxlKCBmaWxlLCByZXQgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOmFjee9rum7mOiupOeahOS4iuS8oOWtl+auteOAglxuICAgICAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZCggZGF0YSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWxlLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGxhc3RNb2RpZmllZERhdGU6IGZpbGUubGFzdE1vZGlmaWVkRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgYmxvY2suY2h1bmtzID4gMSAmJiAkLmV4dGVuZCggZGF0YSwge1xuICAgICAgICAgICAgICAgICAgICBjaHVua3M6IGJsb2NrLmNodW5rcyxcbiAgICAgICAgICAgICAgICAgICAgY2h1bms6IGJsb2NrLmNodW5rXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Zyo5Y+R6YCB5LmL6Ze05Y+v5Lul5re75Yqg5a2X5q615LuA5LmI55qE44CC44CC44CCXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c6buY6K6k55qE5a2X5q615LiN5aSf5L2/55So77yM5Y+v5Lul6YCa6L+H55uR5ZCs5q2k5LqL5Lu25p2l5omp5bGVXG4gICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZEJlZm9yZVNlbmQnLCBibG9jaywgZGF0YSwgaGVhZGVycyApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOW8gOWni+WPkemAgeOAglxuICAgICAgICAgICAgICAgIHRyLmFwcGVuZEJsb2IoIG9wdHMuZmlsZVZhbCwgYmxvY2suYmxvYiwgZmlsZS5uYW1lICk7XG4gICAgICAgICAgICAgICAgdHIuYXBwZW5kKCBkYXRhICk7XG4gICAgICAgICAgICAgICAgdHIuc2V0UmVxdWVzdEhlYWRlciggaGVhZGVycyApO1xuICAgICAgICAgICAgICAgIHRyLnNlbmQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDlrozmiJDkuIrkvKDjgIJcbiAgICAgICAgICAgIF9maW5pc2hGaWxlOiBmdW5jdGlvbiggZmlsZSwgcmV0LCBoZHMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG93bmVyID0gdGhpcy5vd25lcjtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gb3duZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXF1ZXN0KCAnYWZ0ZXItc2VuZC1maWxlJywgYXJndW1lbnRzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkNPTVBMRVRFICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZFN1Y2Nlc3MnLCBmaWxlLCByZXQsIGhkcyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKCByZWFzb24gKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5aSW6YOo5bey57uP5qCH6K6w5Li6aW52YWxpZOS7gOS5iOeahO+8jOS4jeWGjeaUueeKtuaAgeOAglxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLlBST0dSRVNTICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkVSUk9SLCByZWFzb24gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZEVycm9yJywgZmlsZSwgcmVhc29uICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkQ29tcGxldGUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDlkITnp43pqozor4HvvIzljIXmi6zmlofku7bmgLvlpKflsI/mmK/lkKbotoXlh7rjgIHljZXmlofku7bmmK/lkKbotoXlh7rlkozmlofku7bmmK/lkKbph43lpI3jgIJcbiAgICAgKi9cbiAgICBcbiAgICBkZWZpbmUoJ3dpZGdldHMvdmFsaWRhdG9yJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ2ZpbGUnLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyLCBXVUZpbGUgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgdmFsaWRhdG9ycyA9IHt9LFxuICAgICAgICAgICAgYXBpO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGV2ZW50IGVycm9yXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIOmUmeivr+exu+Wei+OAglxuICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2TdmFsaWRhdGXkuI3pgJrov4fml7bvvIzkvJrku6XmtL7pgIHplJnor6/kuovku7bnmoTlvaLlvI/pgJrnn6XosIPnlKjogIXjgILpgJrov4dgdXBsb2FkLm9uKCdlcnJvcicsIGhhbmRsZXIpYOWPr+S7peaNleiOt+WIsOatpOexu+mUmeivr++8jOebruWJjeacieS7peS4i+mUmeivr+S8muWcqOeJueWumueahOaDheWGteS4i+a0vumAgemUmeadpeOAglxuICAgICAgICAgKlxuICAgICAgICAgKiAqIGBRX0VYQ0VFRF9OVU1fTElNSVRgIOWcqOiuvue9ruS6hmBmaWxlTnVtTGltaXRg5LiU5bCd6K+V57uZYHVwbG9hZGVyYOa3u+WKoOeahOaWh+S7tuaVsOmHj+i2heWHuui/meS4quWAvOaXtua0vumAgeOAglxuICAgICAgICAgKiAqIGBRX0VYQ0VFRF9TSVpFX0xJTUlUYCDlnKjorr7nva7kuoZgUV9FWENFRURfU0laRV9MSU1JVGDkuJTlsJ3or5Xnu5lgdXBsb2FkZXJg5re75Yqg55qE5paH5Lu25oC75aSn5bCP6LaF5Ye66L+Z5Liq5YC85pe25rS+6YCB44CCXG4gICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgIFxuICAgICAgICAvLyDmmrTpnLLnu5nlpJbpnaLnmoRhcGlcbiAgICAgICAgYXBpID0ge1xuICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg6aqM6K+B5ZmoXG4gICAgICAgICAgICBhZGRWYWxpZGF0b3I6IGZ1bmN0aW9uKCB0eXBlLCBjYiApIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzWyB0eXBlIF0gPSBjYjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDnp7vpmaTpqozor4HlmahcbiAgICAgICAgICAgIHJlbW92ZVZhbGlkYXRvcjogZnVuY3Rpb24oIHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHZhbGlkYXRvcnNbIHR5cGUgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgLy8g5ZyoVXBsb2FkZXLliJ3lp4vljJbnmoTml7blgJnlkK/liqhWYWxpZGF0b3Jz55qE5Yid5aeL5YyWXG4gICAgICAgIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCB2YWxpZGF0b3JzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsKCBtZS5vd25lciApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7aW50fSBbZmlsZU51bUxpbWl0PXVuZGVmaW5lZF1cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOmqjOivgeaWh+S7tuaAu+aVsOmHjywg6LaF5Ye65YiZ5LiN5YWB6K645Yqg5YWl6Zif5YiX44CCXG4gICAgICAgICAqL1xuICAgICAgICBhcGkuYWRkVmFsaWRhdG9yKCAnZmlsZU51bUxpbWl0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLFxuICAgICAgICAgICAgICAgIG9wdHMgPSB1cGxvYWRlci5vcHRpb25zLFxuICAgICAgICAgICAgICAgIGNvdW50ID0gMCxcbiAgICAgICAgICAgICAgICBtYXggPSBvcHRzLmZpbGVOdW1MaW1pdCA+PiAwLFxuICAgICAgICAgICAgICAgIGZsYWcgPSB0cnVlO1xuICAgIFxuICAgICAgICAgICAgaWYgKCAhbWF4ICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnYmVmb3JlRmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY291bnQgPj0gbWF4ICYmIGZsYWcgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCAnZXJyb3InLCAnUV9FWENFRURfTlVNX0xJTUlUJywgbWF4LCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gY291bnQgPj0gbWF4ID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVRdWV1ZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVEZXF1ZXVlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvdW50LS07XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAndXBsb2FkRmluaXNoZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb3VudCA9IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgXG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge2ludH0gW2ZpbGVTaXplTGltaXQ9dW5kZWZpbmVkXVxuICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgKiBAZGVzY3JpcHRpb24g6aqM6K+B5paH5Lu25oC75aSn5bCP5piv5ZCm6LaF5Ye66ZmQ5Yi2LCDotoXlh7rliJnkuI3lhYHorrjliqDlhaXpmJ/liJfjgIJcbiAgICAgICAgICovXG4gICAgICAgIGFwaS5hZGRWYWxpZGF0b3IoICdmaWxlU2l6ZUxpbWl0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLFxuICAgICAgICAgICAgICAgIG9wdHMgPSB1cGxvYWRlci5vcHRpb25zLFxuICAgICAgICAgICAgICAgIGNvdW50ID0gMCxcbiAgICAgICAgICAgICAgICBtYXggPSBvcHRzLmZpbGVTaXplTGltaXQgPj4gMCxcbiAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIW1heCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2JlZm9yZUZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgaW52YWxpZCA9IGNvdW50ICsgZmlsZS5zaXplID4gbWF4O1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggaW52YWxpZCAmJiBmbGFnICkge1xuICAgICAgICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ2Vycm9yJywgJ1FfRVhDRUVEX1NJWkVfTElNSVQnLCBtYXgsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9LCAxICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpbnZhbGlkID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICBjb3VudCArPSBmaWxlLnNpemU7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnZmlsZURlcXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgY291bnQgLT0gZmlsZS5zaXplO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ3VwbG9hZEZpbmlzaGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY291bnQgPSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQHByb3BlcnR5IHtpbnR9IFtmaWxlU2luZ2xlU2l6ZUxpbWl0PXVuZGVmaW5lZF1cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOmqjOivgeWNleS4quaWh+S7tuWkp+Wwj+aYr+WQpui2heWHuumZkOWItiwg6LaF5Ye65YiZ5LiN5YWB6K645Yqg5YWl6Zif5YiX44CCXG4gICAgICAgICAqL1xuICAgICAgICBhcGkuYWRkVmFsaWRhdG9yKCAnZmlsZVNpbmdsZVNpemVMaW1pdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcyxcbiAgICAgICAgICAgICAgICBvcHRzID0gdXBsb2FkZXIub3B0aW9ucyxcbiAgICAgICAgICAgICAgICBtYXggPSBvcHRzLmZpbGVTaW5nbGVTaXplTGltaXQ7XG4gICAgXG4gICAgICAgICAgICBpZiAoICFtYXggKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgdXBsb2FkZXIub24oICdiZWZvcmVGaWxlUXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBmaWxlLnNpemUgPiBtYXggKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBXVUZpbGUuU3RhdHVzLklOVkFMSUQsICdleGNlZWRfc2l6ZScgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCAnZXJyb3InLCAnRl9FWENFRURfU0laRScsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7aW50fSBbZHVwbGljYXRlPXVuZGVmaW5lZF1cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOWOu+mHje+8jCDmoLnmja7mlofku7blkI3lrZfjgIHmlofku7blpKflsI/lkozmnIDlkI7kv67mlLnml7bpl7TmnaXnlJ/miJBoYXNoIEtleS5cbiAgICAgICAgICovXG4gICAgICAgIGFwaS5hZGRWYWxpZGF0b3IoICdkdXBsaWNhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMsXG4gICAgICAgICAgICAgICAgb3B0cyA9IHVwbG9hZGVyLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgbWFwcGluZyA9IHt9O1xuICAgIFxuICAgICAgICAgICAgaWYgKCBvcHRzLmR1cGxpY2F0ZSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBoYXNoU3RyaW5nKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSAwLFxuICAgICAgICAgICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gc3RyLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgX2NoYXI7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIF9jaGFyID0gc3RyLmNoYXJDb2RlQXQoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgaGFzaCA9IF9jaGFyICsgKGhhc2ggPDwgNikgKyAoaGFzaCA8PCAxNikgLSBoYXNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnYmVmb3JlRmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gZmlsZS5fX2hhc2ggfHwgKGZpbGUuX19oYXNoID0gaGFzaFN0cmluZyggZmlsZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2l6ZSArIGZpbGUubGFzdE1vZGlmaWVkRGF0ZSApKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlt7Lnu4/ph43lpI3kuoZcbiAgICAgICAgICAgICAgICBpZiAoIG1hcHBpbmdbIGhhc2ggXSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCAnZXJyb3InLCAnRl9EVVBMSUNBVEUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnZmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gZmlsZS5fX2hhc2g7XG4gICAgXG4gICAgICAgICAgICAgICAgaGFzaCAmJiAobWFwcGluZ1sgaGFzaCBdID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnZmlsZURlcXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBmaWxlLl9faGFzaDtcbiAgICBcbiAgICAgICAgICAgICAgICBoYXNoICYmIChkZWxldGUgbWFwcGluZ1sgaGFzaCBdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIGFwaTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvY29tcGJhc2UnLFtdLGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBDb21wQmFzZSggb3duZXIsIHJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgICAgICB0aGlzLm93bmVyID0gb3duZXI7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvd25lci5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdWlkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWUudWlkO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvd25lci50cmlnZ2VyLmFwcGx5KCBvd25lciwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBDb21wQmFzZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEh0bWw1UnVudGltZVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9ydW50aW1lJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZScsXG4gICAgICAgICdydW50aW1lL2NvbXBiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lLCBDb21wQmFzZSApIHtcbiAgICBcbiAgICAgICAgdmFyIHR5cGUgPSAnaHRtbDUnLFxuICAgICAgICAgICAgY29tcG9uZW50cyA9IHt9O1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBIdG1sNVJ1bnRpbWUoKSB7XG4gICAgICAgICAgICB2YXIgcG9vbCA9IHt9LFxuICAgICAgICAgICAgICAgIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICBkZXN0b3J5ID0gdGhpcy5kZXN0b3J5O1xuICAgIFxuICAgICAgICAgICAgUnVudGltZS5hcHBseSggbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgbWUudHlwZSA9IHR5cGU7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAvLyDov5nkuKrmlrnms5XnmoTosIPnlKjogIXvvIzlrp7pmYXkuIrmmK9SdW50aW1lQ2xpZW50XG4gICAgICAgICAgICBtZS5leGVjID0gZnVuY3Rpb24oIGNvbXAsIGZuLyosIGFyZ3MuLi4qLykge1xuICAgICAgICAgICAgICAgIHZhciBjbGllbnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB1aWQgPSBjbGllbnQudWlkLFxuICAgICAgICAgICAgICAgICAgICBhcmdzID0gQmFzZS5zbGljZSggYXJndW1lbnRzLCAyICksXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY29tcG9uZW50c1sgY29tcCBdICkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IHBvb2xbIHVpZCBdID0gcG9vbFsgdWlkIF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgY29tcG9uZW50c1sgY29tcCBdKCBjbGllbnQsIG1lICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5zdGFuY2VbIGZuIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VbIGZuIF0uYXBwbHkoIGluc3RhbmNlLCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgbWUuZGVzdG9yeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEB0b2RvIOWIoOmZpOaxoOWtkOS4reeahOaJgOacieWunuS+i1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXN0b3J5ICYmIGRlc3RvcnkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBCYXNlLmluaGVyaXRzKCBSdW50aW1lLCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogSHRtbDVSdW50aW1lLFxuICAgIFxuICAgICAgICAgICAgLy8g5LiN6ZyA6KaB6L+e5o6l5YW25LuW56iL5bqP77yM55u05o6l5omn6KGMY2FsbGJhY2tcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9LCAxICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvLyDms6jlhoxDb21wb25lbnRzXG4gICAgICAgIEh0bWw1UnVudGltZS5yZWdpc3RlciA9IGZ1bmN0aW9uKCBuYW1lLCBjb21wb25lbnQgKSB7XG4gICAgICAgICAgICB2YXIga2xhc3MgPSBjb21wb25lbnRzWyBuYW1lIF0gPSBCYXNlLmluaGVyaXRzKCBDb21wQmFzZSwgY29tcG9uZW50ICk7XG4gICAgICAgICAgICByZXR1cm4ga2xhc3M7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOazqOWGjGh0bWw16L+Q6KGM5pe244CCXG4gICAgICAgIC8vIOWPquacieWcqOaUr+aMgeeahOWJjeaPkOS4i+azqOWGjOOAglxuICAgICAgICBpZiAoIHdpbmRvdy5CbG9iICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5EYXRhVmlldyApIHtcbiAgICAgICAgICAgIFJ1bnRpbWUuYWRkUnVudGltZSggdHlwZSwgSHRtbDVSdW50aW1lICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEJsb2IgSHRtbOWunueOsFxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9ibG9iJyxbXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAnbGliL2Jsb2InXG4gICAgXSwgZnVuY3Rpb24oIEh0bWw1UnVudGltZSwgQmxvYiApIHtcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ0Jsb2InLCB7XG4gICAgICAgICAgICBzbGljZTogZnVuY3Rpb24oIHN0YXJ0LCBlbmQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsb2IgPSB0aGlzLm93bmVyLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgc2xpY2UgPSBibG9iLnNsaWNlIHx8IGJsb2Iud2Via2l0U2xpY2UgfHwgYmxvYi5tb3pTbGljZTtcbiAgICBcbiAgICAgICAgICAgICAgICBibG9iID0gc2xpY2UuY2FsbCggYmxvYiwgc3RhcnQsIGVuZCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYiggdGhpcy5nZXRSdWlkKCksIGJsb2IgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBGaWxlUGFzdGVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvZG5kJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvcnVudGltZScsXG4gICAgICAgICdsaWIvZmlsZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgSHRtbDVSdW50aW1lLCBGaWxlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHByZWZpeCA9ICd3ZWJ1cGxvYWRlci1kbmQtJztcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ0RyYWdBbmREcm9wJywge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmVsZW0gPSB0aGlzLm9wdGlvbnMuY29udGFpbmVyO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ0VudGVySGFuZGxlciA9IEJhc2UuYmluZEZuKCB0aGlzLl9kcmFnRW50ZXJIYW5kbGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnT3ZlckhhbmRsZXIgPSBCYXNlLmJpbmRGbiggdGhpcy5fZHJhZ092ZXJIYW5kbGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnTGVhdmVIYW5kbGVyID0gQmFzZS5iaW5kRm4oIHRoaXMuX2RyYWdMZWF2ZUhhbmRsZXIsIHRoaXMgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3BIYW5kbGVyID0gQmFzZS5iaW5kRm4oIHRoaXMuX2Ryb3BIYW5kbGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgdGhpcy5kbmRPdmVyID0gZmFsc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgZWxlbS5vbiggJ2RyYWdlbnRlcicsIHRoaXMuZHJhZ0VudGVySGFuZGxlciApO1xuICAgICAgICAgICAgICAgIGVsZW0ub24oICdkcmFnb3ZlcicsIHRoaXMuZHJhZ092ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgZWxlbS5vbiggJ2RyYWdsZWF2ZScsIHRoaXMuZHJhZ0xlYXZlSGFuZGxlciApO1xuICAgICAgICAgICAgICAgIGVsZW0ub24oICdkcm9wJywgdGhpcy5kcm9wSGFuZGxlciApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5vcHRpb25zLmRpc2FibGVHbG9iYWxEbmQgKSB7XG4gICAgICAgICAgICAgICAgICAgICQoIGRvY3VtZW50ICkub24oICdkcmFnb3ZlcicsIHRoaXMuZHJhZ092ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgICAgICQoIGRvY3VtZW50ICkub24oICdkcm9wJywgdGhpcy5kcm9wSGFuZGxlciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfZHJhZ0VudGVySGFuZGxlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZGVuaWVkID0gbWUuX2RlbmllZCB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM7XG4gICAgXG4gICAgICAgICAgICAgICAgZSA9IGUub3JpZ2luYWxFdmVudCB8fCBlO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIW1lLmRuZE92ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmRuZE92ZXIgPSB0cnVlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDms6jmhI/lj6rmnIkgY2hyb21lIOaUr+aMgeOAglxuICAgICAgICAgICAgICAgICAgICBpdGVtcyA9IGUuZGF0YVRyYW5zZmVyLml0ZW1zO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zICYmIGl0ZW1zLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9kZW5pZWQgPSBkZW5pZWQgPSAhbWUudHJpZ2dlciggJ2FjY2VwdCcsIGl0ZW1zICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuZWxlbS5hZGRDbGFzcyggcHJlZml4ICsgJ292ZXInICk7XG4gICAgICAgICAgICAgICAgICAgIG1lLmVsZW1bIGRlbmllZCA/ICdhZGRDbGFzcycgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZW1vdmVDbGFzcycgXSggcHJlZml4ICsgJ2RlbmllZCcgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgZS5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IGRlbmllZCA/ICdub25lJyA6ICdjb3B5JztcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX2RyYWdPdmVySGFuZGxlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgLy8g5Y+q5aSE55CG5qGG5YaF55qE44CCXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudEVsZW0gPSB0aGlzLmVsZW0ucGFyZW50KCkuZ2V0KCAwICk7XG4gICAgICAgICAgICAgICAgaWYgKCBwYXJlbnRFbGVtICYmICEkLmNvbnRhaW5zKCBwYXJlbnRFbGVtLCBlLmN1cnJlbnRUYXJnZXQgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIHRoaXMuX2xlYXZlVGltZXIgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kcmFnRW50ZXJIYW5kbGVyLmNhbGwoIHRoaXMsIGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX2RyYWdMZWF2ZUhhbmRsZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5kbmRPdmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG1lLmVsZW0ucmVtb3ZlQ2xhc3MoIHByZWZpeCArICdvdmVyICcgKyBwcmVmaXggKyAnZGVuaWVkJyApO1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBtZS5fbGVhdmVUaW1lciApO1xuICAgICAgICAgICAgICAgIG1lLl9sZWF2ZVRpbWVyID0gc2V0VGltZW91dCggaGFuZGxlciwgMTAwICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9kcm9wSGFuZGxlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcnVpZCA9IG1lLmdldFJ1aWQoKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbSA9IG1lLmVsZW0ucGFyZW50KCkuZ2V0KCAwICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Y+q5aSE55CG5qGG5YaF55qE44CCXG4gICAgICAgICAgICAgICAgaWYgKCBwYXJlbnRFbGVtICYmICEkLmNvbnRhaW5zKCBwYXJlbnRFbGVtLCBlLmN1cnJlbnRUYXJnZXQgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5fZ2V0VGFuc2ZlckZpbGVzKCBlLCBmdW5jdGlvbiggcmVzdWx0cyApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ2Ryb3AnLCAkLm1hcCggcmVzdWx0cywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZpbGUoIHJ1aWQsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfSkgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5kbmRPdmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbWUuZWxlbS5yZW1vdmVDbGFzcyggcHJlZml4ICsgJ292ZXInICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOWmguaenOS8oOWFpSBjYWxsYmFjayDliJnljrvmn6XnnIvmlofku7blpLnvvIzlkKbliJnlj6rnrqHlvZPliY3mlofku7blpLnjgIJcbiAgICAgICAgICAgIF9nZXRUYW5zZmVyRmlsZXM6IGZ1bmN0aW9uKCBlLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyAgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMsIGZpbGVzLCBkYXRhVHJhbnNmZXIsIGZpbGUsIGl0ZW0sIGksIGxlbiwgY2FuQWNjZXNzRm9sZGVyO1xuICAgIFxuICAgICAgICAgICAgICAgIGUgPSBlLm9yaWdpbmFsRXZlbnQgfHwgZTtcbiAgICBcbiAgICAgICAgICAgICAgICBkYXRhVHJhbnNmZXIgPSBlLmRhdGFUcmFuc2ZlcjtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGRhdGFUcmFuc2Zlci5pdGVtcztcbiAgICAgICAgICAgICAgICBmaWxlcyA9IGRhdGFUcmFuc2Zlci5maWxlcztcbiAgICBcbiAgICAgICAgICAgICAgICBjYW5BY2Nlc3NGb2xkZXIgPSAhIShpdGVtcyAmJiBpdGVtc1sgMCBdLndlYmtpdEdldEFzRW50cnkpO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsZW4gPSBmaWxlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGZpbGVzWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtcyAmJiBpdGVtc1sgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNhbkFjY2Vzc0ZvbGRlciAmJiBpdGVtLndlYmtpdEdldEFzRW50cnkoKS5pc0RpcmVjdG9yeSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goIHRoaXMuX3RyYXZlcnNlRGlyZWN0b3J5VHJlZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS53ZWJraXRHZXRBc0VudHJ5KCksIHJlc3VsdHMgKSApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgQmFzZS53aGVuLmFwcGx5KCBCYXNlLCBwcm9taXNlcyApLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXJlc3VsdHMubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCByZXN1bHRzICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3RyYXZlcnNlRGlyZWN0b3J5VHJlZTogZnVuY3Rpb24oIGVudHJ5LCByZXN1bHRzICkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKSxcbiAgICAgICAgICAgICAgICAgICAgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZW50cnkuaXNGaWxlICkge1xuICAgICAgICAgICAgICAgICAgICBlbnRyeS5maWxlKGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGVudHJ5LmlzRGlyZWN0b3J5ICkge1xuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jcmVhdGVSZWFkZXIoKS5yZWFkRW50cmllcyhmdW5jdGlvbiggZW50cmllcyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSBlbnRyaWVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyciA9IFtdLCAgICAvLyDkuLrkuobkv53or4Hpobrluo/jgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKCBtZS5fdHJhdmVyc2VEaXJlY3RvcnlUcmVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cmllc1sgaSBdLCBhcnIgKSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS53aGVuLmFwcGx5KCBCYXNlLCBwcm9taXNlcyApLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoLmFwcGx5KCByZXN1bHRzLCBhcnIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBkZWZlcnJlZC5yZWplY3QgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmVsZW07XG4gICAgXG4gICAgICAgICAgICAgICAgZWxlbS5vZmYoICdkcmFnZW50ZXInLCB0aGlzLmRyYWdFbnRlckhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9mZiggJ2RyYWdvdmVyJywgdGhpcy5kcmFnRW50ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgZWxlbS5vZmYoICdkcmFnbGVhdmUnLCB0aGlzLmRyYWdMZWF2ZUhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9mZiggJ2Ryb3AnLCB0aGlzLmRyb3BIYW5kbGVyICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9wdGlvbnMuZGlzYWJsZUdsb2JhbERuZCApIHtcbiAgICAgICAgICAgICAgICAgICAgJCggZG9jdW1lbnQgKS5vZmYoICdkcmFnb3ZlcicsIHRoaXMuZHJhZ092ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgICAgICQoIGRvY3VtZW50ICkub2ZmKCAnZHJvcCcsIHRoaXMuZHJvcEhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRmlsZVBhc3RlXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2ZpbGVwYXN0ZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAnbGliL2ZpbGUnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEh0bWw1UnVudGltZSwgRmlsZSApIHtcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ0ZpbGVQYXN0ZScsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpcy5lbGVtID0gb3B0cy5jb250YWluZXIsXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdCA9ICcuKicsXG4gICAgICAgICAgICAgICAgICAgIGFyciwgaSwgbGVuLCBpdGVtO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGFjY2V0cOeahG1pbWVUeXBlc+S4reeUn+aIkOWMuemFjeato+WImeOAglxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5hY2NlcHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyciA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gb3B0cy5hY2NlcHQubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gb3B0cy5hY2NlcHRbIGkgXS5taW1lVHlwZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtICYmIGFyci5wdXNoKCBpdGVtICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhcnIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0ID0gYXJyLmpvaW4oJywnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdCA9IGFjY2VwdC5yZXBsYWNlKCAvLC9nLCAnfCcgKS5yZXBsYWNlKCAvXFwqL2csICcuKicgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmFjY2VwdCA9IGFjY2VwdCA9IG5ldyBSZWdFeHAoIGFjY2VwdCwgJ2knICk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kZXIgPSBCYXNlLmJpbmRGbiggdGhpcy5fcGFzdGVIYW5kZXIsIHRoaXMgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9uKCAncGFzdGUnLCB0aGlzLmhhbmRlciApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9wYXN0ZUhhbmRlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFsbG93ZWQgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgcnVpZCA9IHRoaXMuZ2V0UnVpZCgpLFxuICAgICAgICAgICAgICAgICAgICBpdGVtcywgaXRlbSwgYmxvYiwgaSwgbGVuO1xuICAgIFxuICAgICAgICAgICAgICAgIGUgPSBlLm9yaWdpbmFsRXZlbnQgfHwgZTtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGUuY2xpcGJvYXJkRGF0YS5pdGVtcztcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gaXRlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1sgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW0ua2luZCAhPT0gJ2ZpbGUnIHx8ICEoYmxvYiA9IGl0ZW0uZ2V0QXNGaWxlKCkpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZC5wdXNoKCBuZXcgRmlsZSggcnVpZCwgYmxvYiApICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggYWxsb3dlZC5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4jemYu+atoumdnuaWh+S7tueymOi0tO+8iOaWh+Wtl+eymOi0tO+8ieeahOS6i+S7tuWGkuazoVxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ3Bhc3RlJywgYWxsb3dlZCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW0ub2ZmKCAncGFzdGUnLCB0aGlzLmhhbmRlciApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEZpbGVQaWNrZXJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvZmlsZXBpY2tlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEh0bWw1UnVudGltZSApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdGaWxlUGlja2VyJywge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuZ2V0UnVudGltZSgpLmdldENvbnRhaW5lcigpLFxuICAgICAgICAgICAgICAgICAgICBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG93bmVyID0gbWUub3duZXIsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBsYWJsZSA9ICQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJykgKSxcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSAkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpICksXG4gICAgICAgICAgICAgICAgICAgIGFyciwgaSwgbGVuLCBtb3VzZUhhbmRsZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ3R5cGUnLCAnZmlsZScgKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5hdHRyKCAnbmFtZScsIG9wdHMubmFtZSApO1xuICAgICAgICAgICAgICAgIGlucHV0LmFkZENsYXNzKCd3ZWJ1cGxvYWRlci1lbGVtZW50LWludmlzaWJsZScpO1xuICAgIFxuICAgICAgICAgICAgICAgIGxhYmxlLm9uKCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQudHJpZ2dlcignY2xpY2snKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBsYWJsZS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjZmZmZmZmJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5tdWx0aXBsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ211bHRpcGxlJywgJ211bHRpcGxlJyApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBAdG9kbyBGaXJlZm945LiN5pSv5oyB5Y2V54us5oyH5a6a5ZCO57yAXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLmFjY2VwdCAmJiBvcHRzLmFjY2VwdC5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAgICAgICBhcnIgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGxlbiA9IG9wdHMuYWNjZXB0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goIG9wdHMuYWNjZXB0WyBpIF0ubWltZVR5cGVzICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ2FjY2VwdCcsIGFyci5qb2luKCcsJykgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZCggaW5wdXQgKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kKCBsYWJsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIG1vdXNlSGFuZGxlciA9IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCBlLnR5cGUgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIGlucHV0Lm9uKCAnY2hhbmdlJywgZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IGFyZ3VtZW50cy5jYWxsZWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuZmlsZXMgPSBlLnRhcmdldC5maWxlcztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVzZXQgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSB0aGlzLmNsb25lTm9kZSggdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKCBjbG9uZSwgdGhpcyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpbnB1dC5vZmYoKTtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSAkKCBjbG9uZSApLm9uKCAnY2hhbmdlJywgZm4gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbiggJ21vdXNlZW50ZXIgbW91c2VsZWF2ZScsIG1vdXNlSGFuZGxlciApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBsYWJsZS5vbiggJ21vdXNlZW50ZXIgbW91c2VsZWF2ZScsIG1vdXNlSGFuZGxlciApO1xuICAgIFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIGdldEZpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maWxlcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyB0b2RvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIFRlcm1zOlxuICAgICAqXG4gICAgICogVWludDhBcnJheSwgRmlsZVJlYWRlciwgQmxvYkJ1aWxkZXIsIGF0b2IsIEFycmF5QnVmZmVyXG4gICAgICogQGZpbGVPdmVydmlldyBJbWFnZeaOp+S7tlxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS91dGlsJyxbXG4gICAgICAgICdiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlICkge1xuICAgIFxuICAgICAgICB2YXIgdXJsQVBJID0gd2luZG93LmNyZWF0ZU9iamVjdFVSTCAmJiB3aW5kb3cgfHxcbiAgICAgICAgICAgICAgICB3aW5kb3cuVVJMICYmIFVSTC5yZXZva2VPYmplY3RVUkwgJiYgVVJMIHx8XG4gICAgICAgICAgICAgICAgd2luZG93LndlYmtpdFVSTCxcbiAgICAgICAgICAgIGNyZWF0ZU9iamVjdFVSTCA9IEJhc2Uubm9vcCxcbiAgICAgICAgICAgIHJldm9rZU9iamVjdFVSTCA9IGNyZWF0ZU9iamVjdFVSTDtcbiAgICBcbiAgICAgICAgaWYgKCB1cmxBUEkgKSB7XG4gICAgXG4gICAgICAgICAgICAvLyDmm7TlronlhajnmoTmlrnlvI/osIPnlKjvvIzmr5TlpoJhbmRyb2lk6YeM6Z2i5bCx6IO95oqKY29udGV4dOaUueaIkOWFtuS7lueahOWvueixoeOAglxuICAgICAgICAgICAgY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybEFQSS5jcmVhdGVPYmplY3RVUkwuYXBwbHkoIHVybEFQSSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgcmV2b2tlT2JqZWN0VVJMID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybEFQSS5yZXZva2VPYmplY3RVUkwuYXBwbHkoIHVybEFQSSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGVPYmplY3RVUkw6IGNyZWF0ZU9iamVjdFVSTCxcbiAgICAgICAgICAgIHJldm9rZU9iamVjdFVSTDogcmV2b2tlT2JqZWN0VVJMLFxuICAgIFxuICAgICAgICAgICAgZGF0YVVSTDJCbG9iOiBmdW5jdGlvbiggZGF0YVVSSSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYnl0ZVN0ciwgaW50QXJyYXksIGFiLCBpLCBtaW1ldHlwZSwgcGFydHM7XG4gICAgXG4gICAgICAgICAgICAgICAgcGFydHMgPSBkYXRhVVJJLnNwbGl0KCcsJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB+cGFydHNbIDAgXS5pbmRleE9mKCdiYXNlNjQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZVN0ciA9IGF0b2IoIHBhcnRzWyAxIF0gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBieXRlU3RyID0gZGVjb2RlVVJJQ29tcG9uZW50KCBwYXJ0c1sgMSBdICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGFiID0gbmV3IEFycmF5QnVmZmVyKCBieXRlU3RyLmxlbmd0aCApO1xuICAgICAgICAgICAgICAgIGludEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoIGFiICk7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBieXRlU3RyLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBpbnRBcnJheVsgaSBdID0gYnl0ZVN0ci5jaGFyQ29kZUF0KCBpICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1pbWV0eXBlID0gcGFydHNbIDAgXS5zcGxpdCgnOicpWyAxIF0uc3BsaXQoJzsnKVsgMCBdO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFycmF5QnVmZmVyVG9CbG9iKCBhYiwgbWltZXR5cGUgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkYXRhVVJMMkFycmF5QnVmZmVyOiBmdW5jdGlvbiggZGF0YVVSSSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYnl0ZVN0ciwgaW50QXJyYXksIGksIHBhcnRzO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhcnRzID0gZGF0YVVSSS5zcGxpdCgnLCcpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggfnBhcnRzWyAwIF0uaW5kZXhPZignYmFzZTY0JykgKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVTdHIgPSBhdG9iKCBwYXJ0c1sgMSBdICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZVN0ciA9IGRlY29kZVVSSUNvbXBvbmVudCggcGFydHNbIDEgXSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBpbnRBcnJheSA9IG5ldyBVaW50OEFycmF5KCBieXRlU3RyLmxlbmd0aCApO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgYnl0ZVN0ci5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgaW50QXJyYXlbIGkgXSA9IGJ5dGVTdHIuY2hhckNvZGVBdCggaSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50QXJyYXkuYnVmZmVyO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGFycmF5QnVmZmVyVG9CbG9iOiBmdW5jdGlvbiggYnVmZmVyLCB0eXBlICkge1xuICAgICAgICAgICAgICAgIHZhciBidWlsZGVyID0gd2luZG93LkJsb2JCdWlsZGVyIHx8IHdpbmRvdy5XZWJLaXRCbG9iQnVpbGRlcixcbiAgICAgICAgICAgICAgICAgICAgYmI7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gYW5kcm9pZOS4jeaUr+aMgeebtOaOpW5ldyBCbG9iLCDlj6rog73lgJ/liqlibG9iYnVpbGRlci5cbiAgICAgICAgICAgICAgICBpZiAoIGJ1aWxkZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGJiID0gbmV3IGJ1aWxkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgYmIuYXBwZW5kKCBidWZmZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJiLmdldEJsb2IoIHR5cGUgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCbG9iKFsgYnVmZmVyIF0sIHR5cGUgPyB7IHR5cGU6IHR5cGUgfSA6IHt9ICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g5oq95Ye65p2l5Li76KaB5piv5Li65LqG6Kej5YazYW5kcm9pZOS4i+mdomNhbnZhcy50b0RhdGFVcmzkuI3mlK/mjIFqcGVnLlxuICAgICAgICAgICAgLy8g5L2g5b6X5Yiw55qE57uT5p6c5pivcG5nLlxuICAgICAgICAgICAgY2FudmFzVG9EYXRhVXJsOiBmdW5jdGlvbiggY2FudmFzLCB0eXBlLCBxdWFsaXR5ICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCB0eXBlLCBxdWFsaXR5IC8gMTAwICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gaW1hZ2VtZWF05Lya5aSN5YaZ6L+Z5Liq5pa55rOV77yM5aaC5p6c55So5oi36YCJ5oup5Yqg6L296YKj5Liq5paH5Lu25LqG55qE6K+d44CCXG4gICAgICAgICAgICBwYXJzZU1ldGE6IGZ1bmN0aW9uKCBibG9iLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayggZmFsc2UsIHt9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyBpbWFnZW1lYXTkvJrlpI3lhpnov5nkuKrmlrnms5XvvIzlpoLmnpznlKjmiLfpgInmi6nliqDovb3pgqPkuKrmlofku7bkuobnmoTor53jgIJcbiAgICAgICAgICAgIHVwZGF0ZUltYWdlSGVhZDogZnVuY3Rpb24oIGRhdGEgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogVGVybXM6XG4gICAgICpcbiAgICAgKiBVaW50OEFycmF5LCBGaWxlUmVhZGVyLCBCbG9iQnVpbGRlciwgYXRvYiwgQXJyYXlCdWZmZXJcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEltYWdl5o6n5Lu2XG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2ltYWdlbWV0YScsW1xuICAgICAgICAncnVudGltZS9odG1sNS91dGlsJ1xuICAgIF0sIGZ1bmN0aW9uKCBVdGlsICkge1xuICAgIFxuICAgICAgICB2YXIgYXBpO1xuICAgIFxuICAgICAgICBhcGkgPSB7XG4gICAgICAgICAgICBwYXJzZXJzOiB7XG4gICAgICAgICAgICAgICAgMHhmZmUxOiBbXVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIG1heE1ldGFEYXRhU2l6ZTogMjYyMTQ0LFxuICAgIFxuICAgICAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKCBibG9iLCBjYiApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgZnIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKCBmYWxzZSwgbWUuX3BhcnNlKCB0aGlzLnJlc3VsdCApICk7XG4gICAgICAgICAgICAgICAgICAgIGZyID0gZnIub25sb2FkID0gZnIub25lcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBmci5vbmVycm9yID0gZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKCBlLm1lc3NhZ2UgKTtcbiAgICAgICAgICAgICAgICAgICAgZnIgPSBmci5vbmxvYWQgPSBmci5vbmVycm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIGJsb2IgPSBibG9iLnNsaWNlKCAwLCBtZS5tYXhNZXRhRGF0YVNpemUgKTtcbiAgICAgICAgICAgICAgICBmci5yZWFkQXNBcnJheUJ1ZmZlciggYmxvYi5nZXRTb3VyY2UoKSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9wYXJzZTogZnVuY3Rpb24oIGJ1ZmZlciwgbm9QYXJzZSApIHtcbiAgICAgICAgICAgICAgICBpZiAoIGJ1ZmZlci5ieXRlTGVuZ3RoIDwgNiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgZGF0YXZpZXcgPSBuZXcgRGF0YVZpZXcoIGJ1ZmZlciApLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAyLFxuICAgICAgICAgICAgICAgICAgICBtYXhPZmZzZXQgPSBkYXRhdmlldy5ieXRlTGVuZ3RoIC0gNCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZExlbmd0aCA9IG9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0ge30sXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlckJ5dGVzLCBtYXJrZXJMZW5ndGgsIHBhcnNlcnMsIGk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhdmlldy5nZXRVaW50MTYoIDAgKSA9PT0gMHhmZmQ4ICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIG9mZnNldCA8IG1heE9mZnNldCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlckJ5dGVzID0gZGF0YXZpZXcuZ2V0VWludDE2KCBvZmZzZXQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbWFya2VyQnl0ZXMgPj0gMHhmZmUwICYmIG1hcmtlckJ5dGVzIDw9IDB4ZmZlZiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJCeXRlcyA9PT0gMHhmZmZlICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlckxlbmd0aCA9IGRhdGF2aWV3LmdldFVpbnQxNiggb2Zmc2V0ICsgMiApICsgMjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG9mZnNldCArIG1hcmtlckxlbmd0aCA+IGRhdGF2aWV3LmJ5dGVMZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZXJzID0gYXBpLnBhcnNlcnNbIG1hcmtlckJ5dGVzIF07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhbm9QYXJzZSAmJiBwYXJzZXJzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHBhcnNlcnMubGVuZ3RoOyBpICs9IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZXJzWyBpIF0uY2FsbCggYXBpLCBkYXRhdmlldywgb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJMZW5ndGgsIHJldCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSBtYXJrZXJMZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZExlbmd0aCA9IG9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBoZWFkTGVuZ3RoID4gNiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYnVmZmVyLnNsaWNlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldC5pbWFnZUhlYWQgPSBidWZmZXIuc2xpY2UoIDIsIGhlYWRMZW5ndGggKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgSUUxMCwgd2hpY2ggZG9lcyBub3QgeWV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3VwcG9ydCBBcnJheUJ1ZmZlci5zbGljZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQuaW1hZ2VIZWFkID0gbmV3IFVpbnQ4QXJyYXkoIGJ1ZmZlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3ViYXJyYXkoIDIsIGhlYWRMZW5ndGggKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHVwZGF0ZUltYWdlSGVhZDogZnVuY3Rpb24oIGJ1ZmZlciwgaGVhZCApIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHRoaXMuX3BhcnNlKCBidWZmZXIsIHRydWUgKSxcbiAgICAgICAgICAgICAgICAgICAgYnVmMSwgYnVmMiwgYm9keW9mZnNldDtcbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICBib2R5b2Zmc2V0ID0gMjtcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuaW1hZ2VIZWFkICkge1xuICAgICAgICAgICAgICAgICAgICBib2R5b2Zmc2V0ID0gMiArIGRhdGEuaW1hZ2VIZWFkLmJ5dGVMZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggYnVmZmVyLnNsaWNlICkge1xuICAgICAgICAgICAgICAgICAgICBidWYyID0gYnVmZmVyLnNsaWNlKCBib2R5b2Zmc2V0ICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmMiA9IG5ldyBVaW50OEFycmF5KCBidWZmZXIgKS5zdWJhcnJheSggYm9keW9mZnNldCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBidWYxID0gbmV3IFVpbnQ4QXJyYXkoIGhlYWQuYnl0ZUxlbmd0aCArIDIgKyBidWYyLmJ5dGVMZW5ndGggKTtcbiAgICBcbiAgICAgICAgICAgICAgICBidWYxWyAwIF0gPSAweEZGO1xuICAgICAgICAgICAgICAgIGJ1ZjFbIDEgXSA9IDB4RDg7XG4gICAgICAgICAgICAgICAgYnVmMS5zZXQoIG5ldyBVaW50OEFycmF5KCBoZWFkICksIDIgKTtcbiAgICAgICAgICAgICAgICBidWYxLnNldCggbmV3IFVpbnQ4QXJyYXkoIGJ1ZjIgKSwgaGVhZC5ieXRlTGVuZ3RoICsgMiApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBidWYxLmJ1ZmZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgVXRpbC5wYXJzZU1ldGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBhcGkucGFyc2UuYXBwbHkoIGFwaSwgYXJndW1lbnRzICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIFV0aWwudXBkYXRlSW1hZ2VIZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYXBpLnVwZGF0ZUltYWdlSGVhZC5hcHBseSggYXBpLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgcmV0dXJuIGFwaTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiDku6PnoIHmnaXoh6rkuo7vvJpodHRwczovL2dpdGh1Yi5jb20vYmx1ZWltcC9KYXZhU2NyaXB0LUxvYWQtSW1hZ2VcbiAgICAgKiDmmoLml7bpobnnm67kuK3lj6rnlKjkuoZvcmllbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIOWOu+mZpOS6hiBFeGlmIFN1YiBJRkQgUG9pbnRlciwgR1BTIEluZm8gSUZEIFBvaW50ZXIsIEV4aWYgVGh1bWJuYWlsLlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRVhJRuino+aekFxuICAgICAqL1xuICAgIFxuICAgIC8vIFNhbXBsZVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE1ha2UgOiBBcHBsZVxuICAgIC8vIE1vZGVsIDogaVBob25lIDRTXG4gICAgLy8gT3JpZW50YXRpb24gOiAxXG4gICAgLy8gWFJlc29sdXRpb24gOiA3MiBbNzIvMV1cbiAgICAvLyBZUmVzb2x1dGlvbiA6IDcyIFs3Mi8xXVxuICAgIC8vIFJlc29sdXRpb25Vbml0IDogMlxuICAgIC8vIFNvZnR3YXJlIDogUXVpY2tUaW1lIDcuNy4xXG4gICAgLy8gRGF0ZVRpbWUgOiAyMDEzOjA5OjAxIDIyOjUzOjU1XG4gICAgLy8gRXhpZklGRFBvaW50ZXIgOiAxOTBcbiAgICAvLyBFeHBvc3VyZVRpbWUgOiAwLjA1ODgyMzUyOTQxMTc2NDcwNSBbMS8xN11cbiAgICAvLyBGTnVtYmVyIDogMi40IFsxMi81XVxuICAgIC8vIEV4cG9zdXJlUHJvZ3JhbSA6IE5vcm1hbCBwcm9ncmFtXG4gICAgLy8gSVNPU3BlZWRSYXRpbmdzIDogODAwXG4gICAgLy8gRXhpZlZlcnNpb24gOiAwMjIwXG4gICAgLy8gRGF0ZVRpbWVPcmlnaW5hbCA6IDIwMTM6MDk6MDEgMjI6NTI6NTFcbiAgICAvLyBEYXRlVGltZURpZ2l0aXplZCA6IDIwMTM6MDk6MDEgMjI6NTI6NTFcbiAgICAvLyBDb21wb25lbnRzQ29uZmlndXJhdGlvbiA6IFlDYkNyXG4gICAgLy8gU2h1dHRlclNwZWVkVmFsdWUgOiA0LjA1ODg5MzUxNTc2NDQyNlxuICAgIC8vIEFwZXJ0dXJlVmFsdWUgOiAyLjUyNjA2ODgyMTY4OTI1OTcgWzQ4NDUvMTkxOF1cbiAgICAvLyBCcmlnaHRuZXNzVmFsdWUgOiAtMC4zMTI2Njg2NjAxOTk4Mzk1XG4gICAgLy8gTWV0ZXJpbmdNb2RlIDogUGF0dGVyblxuICAgIC8vIEZsYXNoIDogRmxhc2ggZGlkIG5vdCBmaXJlLCBjb21wdWxzb3J5IGZsYXNoIG1vZGVcbiAgICAvLyBGb2NhbExlbmd0aCA6IDQuMjggWzEwNy8yNV1cbiAgICAvLyBTdWJqZWN0QXJlYSA6IFs0IHZhbHVlc11cbiAgICAvLyBGbGFzaHBpeFZlcnNpb24gOiAwMTAwXG4gICAgLy8gQ29sb3JTcGFjZSA6IDFcbiAgICAvLyBQaXhlbFhEaW1lbnNpb24gOiAyNDQ4XG4gICAgLy8gUGl4ZWxZRGltZW5zaW9uIDogMzI2NFxuICAgIC8vIFNlbnNpbmdNZXRob2QgOiBPbmUtY2hpcCBjb2xvciBhcmVhIHNlbnNvclxuICAgIC8vIEV4cG9zdXJlTW9kZSA6IDBcbiAgICAvLyBXaGl0ZUJhbGFuY2UgOiBBdXRvIHdoaXRlIGJhbGFuY2VcbiAgICAvLyBGb2NhbExlbmd0aEluMzVtbUZpbG0gOiAzNVxuICAgIC8vIFNjZW5lQ2FwdHVyZVR5cGUgOiBTdGFuZGFyZFxuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9pbWFnZW1ldGEvZXhpZicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L2ltYWdlbWV0YSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgSW1hZ2VNZXRhICkge1xuICAgIFxuICAgICAgICB2YXIgRVhJRiA9IHt9O1xuICAgIFxuICAgICAgICBFWElGLkV4aWZNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBFWElGLkV4aWZNYXAucHJvdG90eXBlLm1hcCA9IHtcbiAgICAgICAgICAgICdPcmllbnRhdGlvbic6IDB4MDExMlxuICAgICAgICB9O1xuICAgIFxuICAgICAgICBFWElGLkV4aWZNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKCBpZCApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzWyBpZCBdIHx8IHRoaXNbIHRoaXMubWFwWyBpZCBdIF07XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEVYSUYuZXhpZlRhZ1R5cGVzID0ge1xuICAgICAgICAgICAgLy8gYnl0ZSwgOC1iaXQgdW5zaWduZWQgaW50OlxuICAgICAgICAgICAgMToge1xuICAgICAgICAgICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiggZGF0YVZpZXcsIGRhdGFPZmZzZXQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhVmlldy5nZXRVaW50OCggZGF0YU9mZnNldCApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogMVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIGFzY2lpLCA4LWJpdCBieXRlOlxuICAgICAgICAgICAgMjoge1xuICAgICAgICAgICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiggZGF0YVZpZXcsIGRhdGFPZmZzZXQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKCBkYXRhVmlldy5nZXRVaW50OCggZGF0YU9mZnNldCApICk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiAxLFxuICAgICAgICAgICAgICAgIGFzY2lpOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gc2hvcnQsIDE2IGJpdCBpbnQ6XG4gICAgICAgICAgICAzOiB7XG4gICAgICAgICAgICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0VWludDE2KCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNpemU6IDJcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyBsb25nLCAzMiBiaXQgaW50OlxuICAgICAgICAgICAgNDoge1xuICAgICAgICAgICAgICAgIGdldFZhbHVlOiBmdW5jdGlvbiggZGF0YVZpZXcsIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFWaWV3LmdldFVpbnQzMiggZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiA0XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gcmF0aW9uYWwgPSB0d28gbG9uZyB2YWx1ZXMsXG4gICAgICAgICAgICAvLyBmaXJzdCBpcyBudW1lcmF0b3IsIHNlY29uZCBpcyBkZW5vbWluYXRvcjpcbiAgICAgICAgICAgIDU6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhVmlldy5nZXRVaW50MzIoIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApIC9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFWaWV3LmdldFVpbnQzMiggZGF0YU9mZnNldCArIDQsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2l6ZTogOFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIHNsb25nLCAzMiBiaXQgc2lnbmVkIGludDpcbiAgICAgICAgICAgIDk6IHtcbiAgICAgICAgICAgICAgICBnZXRWYWx1ZTogZnVuY3Rpb24oIGRhdGFWaWV3LCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhVmlldy5nZXRJbnQzMiggZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiA0XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8gc3JhdGlvbmFsLCB0d28gc2xvbmdzLCBmaXJzdCBpcyBudW1lcmF0b3IsIHNlY29uZCBpcyBkZW5vbWluYXRvcjpcbiAgICAgICAgICAgIDEwOiB7XG4gICAgICAgICAgICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCBkYXRhVmlldywgZGF0YU9mZnNldCwgbGl0dGxlRW5kaWFuICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVZpZXcuZ2V0SW50MzIoIGRhdGFPZmZzZXQsIGxpdHRsZUVuZGlhbiApIC9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFWaWV3LmdldEludDMyKCBkYXRhT2Zmc2V0ICsgNCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaXplOiA4XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIHVuZGVmaW5lZCwgOC1iaXQgYnl0ZSwgdmFsdWUgZGVwZW5kaW5nIG9uIGZpZWxkOlxuICAgICAgICBFWElGLmV4aWZUYWdUeXBlc1sgNyBdID0gRVhJRi5leGlmVGFnVHlwZXNbIDEgXTtcbiAgICBcbiAgICAgICAgRVhJRi5nZXRFeGlmVmFsdWUgPSBmdW5jdGlvbiggZGF0YVZpZXcsIHRpZmZPZmZzZXQsIG9mZnNldCwgdHlwZSwgbGVuZ3RoLFxuICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiApIHtcbiAgICBcbiAgICAgICAgICAgIHZhciB0YWdUeXBlID0gRVhJRi5leGlmVGFnVHlwZXNbIHR5cGUgXSxcbiAgICAgICAgICAgICAgICB0YWdTaXplLCBkYXRhT2Zmc2V0LCB2YWx1ZXMsIGksIHN0ciwgYztcbiAgICBcbiAgICAgICAgICAgIGlmICggIXRhZ1R5cGUgKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIHRhZyB0eXBlLicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHRhZ1NpemUgPSB0YWdUeXBlLnNpemUgKiBsZW5ndGg7XG4gICAgXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgaWYgdGhlIHZhbHVlIGlzIGNvbnRhaW5lZCBpbiB0aGUgZGF0YU9mZnNldCBieXRlcyxcbiAgICAgICAgICAgIC8vIG9yIGlmIHRoZSB2YWx1ZSBhdCB0aGUgZGF0YU9mZnNldCBpcyBhIHBvaW50ZXIgdG8gdGhlIGFjdHVhbCBkYXRhOlxuICAgICAgICAgICAgZGF0YU9mZnNldCA9IHRhZ1NpemUgPiA0ID8gdGlmZk9mZnNldCArIGRhdGFWaWV3LmdldFVpbnQzMiggb2Zmc2V0ICsgOCxcbiAgICAgICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuICkgOiAob2Zmc2V0ICsgOCk7XG4gICAgXG4gICAgICAgICAgICBpZiAoIGRhdGFPZmZzZXQgKyB0YWdTaXplID4gZGF0YVZpZXcuYnl0ZUxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IEludmFsaWQgZGF0YSBvZmZzZXQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgaWYgKCBsZW5ndGggPT09IDEgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhZ1R5cGUuZ2V0VmFsdWUoIGRhdGFWaWV3LCBkYXRhT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHZhbHVlcyA9IFtdO1xuICAgIFxuICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbIGkgXSA9IHRhZ1R5cGUuZ2V0VmFsdWUoIGRhdGFWaWV3LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YU9mZnNldCArIGkgKiB0YWdUeXBlLnNpemUsIGxpdHRsZUVuZGlhbiApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgaWYgKCB0YWdUeXBlLmFzY2lpICkge1xuICAgICAgICAgICAgICAgIHN0ciA9ICcnO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIENvbmNhdGVuYXRlIHRoZSBjaGFyczpcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgYyA9IHZhbHVlc1sgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgdGhlIHRlcm1pbmF0aW5nIE5VTEwgYnl0ZShzKTpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjID09PSAnXFx1MDAwMCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdHIgKz0gYztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEVYSUYucGFyc2VFeGlmVGFnID0gZnVuY3Rpb24oIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LCBvZmZzZXQsIGxpdHRsZUVuZGlhbixcbiAgICAgICAgICAgICAgICBkYXRhICkge1xuICAgIFxuICAgICAgICAgICAgdmFyIHRhZyA9IGRhdGFWaWV3LmdldFVpbnQxNiggb2Zmc2V0LCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgIGRhdGEuZXhpZlsgdGFnIF0gPSBFWElGLmdldEV4aWZWYWx1ZSggZGF0YVZpZXcsIHRpZmZPZmZzZXQsIG9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVZpZXcuZ2V0VWludDE2KCBvZmZzZXQgKyAyLCBsaXR0bGVFbmRpYW4gKSwgICAgLy8gdGFnIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgZGF0YVZpZXcuZ2V0VWludDMyKCBvZmZzZXQgKyA0LCBsaXR0bGVFbmRpYW4gKSwgICAgLy8gdGFnIGxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgRVhJRi5wYXJzZUV4aWZUYWdzID0gZnVuY3Rpb24oIGRhdGFWaWV3LCB0aWZmT2Zmc2V0LCBkaXJPZmZzZXQsXG4gICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuLCBkYXRhICkge1xuICAgIFxuICAgICAgICAgICAgdmFyIHRhZ3NOdW1iZXIsIGRpckVuZE9mZnNldCwgaTtcbiAgICBcbiAgICAgICAgICAgIGlmICggZGlyT2Zmc2V0ICsgNiA+IGRhdGFWaWV3LmJ5dGVMZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBJbnZhbGlkIGRpcmVjdG9yeSBvZmZzZXQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgdGFnc051bWJlciA9IGRhdGFWaWV3LmdldFVpbnQxNiggZGlyT2Zmc2V0LCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgIGRpckVuZE9mZnNldCA9IGRpck9mZnNldCArIDIgKyAxMiAqIHRhZ3NOdW1iZXI7XG4gICAgXG4gICAgICAgICAgICBpZiAoIGRpckVuZE9mZnNldCArIDQgPiBkYXRhVmlldy5ieXRlTGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogSW52YWxpZCBkaXJlY3Rvcnkgc2l6ZS4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRhZ3NOdW1iZXI7IGkgKz0gMSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlRXhpZlRhZyggZGF0YVZpZXcsIHRpZmZPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJPZmZzZXQgKyAyICsgMTIgKiBpLCAgICAvLyB0YWcgb2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXR0bGVFbmRpYW4sIGRhdGEgKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIFJldHVybiB0aGUgb2Zmc2V0IHRvIHRoZSBuZXh0IGRpcmVjdG9yeTpcbiAgICAgICAgICAgIHJldHVybiBkYXRhVmlldy5nZXRVaW50MzIoIGRpckVuZE9mZnNldCwgbGl0dGxlRW5kaWFuICk7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIEVYSUYuZ2V0RXhpZlRodW1ibmFpbCA9IGZ1bmN0aW9uKGRhdGFWaWV3LCBvZmZzZXQsIGxlbmd0aCkge1xuICAgICAgICAvLyAgICAgdmFyIGhleERhdGEsXG4gICAgICAgIC8vICAgICAgICAgaSxcbiAgICAgICAgLy8gICAgICAgICBiO1xuICAgICAgICAvLyAgICAgaWYgKCFsZW5ndGggfHwgb2Zmc2V0ICsgbGVuZ3RoID4gZGF0YVZpZXcuYnl0ZUxlbmd0aCkge1xuICAgICAgICAvLyAgICAgICAgIEJhc2UubG9nKCdJbnZhbGlkIEV4aWYgZGF0YTogSW52YWxpZCB0aHVtYm5haWwgZGF0YS4nKTtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm47XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICBoZXhEYXRhID0gW107XG4gICAgICAgIC8vICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLy8gICAgICAgICBiID0gZGF0YVZpZXcuZ2V0VWludDgob2Zmc2V0ICsgaSk7XG4gICAgICAgIC8vICAgICAgICAgaGV4RGF0YS5wdXNoKChiIDwgMTYgPyAnMCcgOiAnJykgKyBiLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICByZXR1cm4gJ2RhdGE6aW1hZ2UvanBlZywlJyArIGhleERhdGEuam9pbignJScpO1xuICAgICAgICAvLyB9O1xuICAgIFxuICAgICAgICBFWElGLnBhcnNlRXhpZkRhdGEgPSBmdW5jdGlvbiggZGF0YVZpZXcsIG9mZnNldCwgbGVuZ3RoLCBkYXRhICkge1xuICAgIFxuICAgICAgICAgICAgdmFyIHRpZmZPZmZzZXQgPSBvZmZzZXQgKyAxMCxcbiAgICAgICAgICAgICAgICBsaXR0bGVFbmRpYW4sIGRpck9mZnNldDtcbiAgICBcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciB0aGUgQVNDSUkgY29kZSBmb3IgXCJFeGlmXCIgKDB4NDU3ODY5NjYpOlxuICAgICAgICAgICAgaWYgKCBkYXRhVmlldy5nZXRVaW50MzIoIG9mZnNldCArIDQgKSAhPT0gMHg0NTc4Njk2NiApIHtcbiAgICAgICAgICAgICAgICAvLyBObyBFeGlmIGRhdGEsIG1pZ2h0IGJlIFhNUCBkYXRhIGluc3RlYWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIHRpZmZPZmZzZXQgKyA4ID4gZGF0YVZpZXcuYnl0ZUxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IEludmFsaWQgc2VnbWVudCBzaXplLicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciB0aGUgdHdvIG51bGwgYnl0ZXM6XG4gICAgICAgICAgICBpZiAoIGRhdGFWaWV3LmdldFVpbnQxNiggb2Zmc2V0ICsgOCApICE9PSAweDAwMDAgKSB7XG4gICAgICAgICAgICAgICAgQmFzZS5sb2coJ0ludmFsaWQgRXhpZiBkYXRhOiBNaXNzaW5nIGJ5dGUgYWxpZ25tZW50IG9mZnNldC4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyBDaGVjayB0aGUgYnl0ZSBhbGlnbm1lbnQ6XG4gICAgICAgICAgICBzd2l0Y2ggKCBkYXRhVmlldy5nZXRVaW50MTYoIHRpZmZPZmZzZXQgKSApIHtcbiAgICAgICAgICAgICAgICBjYXNlIDB4NDk0OTpcbiAgICAgICAgICAgICAgICAgICAgbGl0dGxlRW5kaWFuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgY2FzZSAweDRENEQ6XG4gICAgICAgICAgICAgICAgICAgIGxpdHRsZUVuZGlhbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IEludmFsaWQgYnl0ZSBhbGlnbm1lbnQgbWFya2VyLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgdGhlIFRJRkYgdGFnIG1hcmtlciAoMHgwMDJBKTpcbiAgICAgICAgICAgIGlmICggZGF0YVZpZXcuZ2V0VWludDE2KCB0aWZmT2Zmc2V0ICsgMiwgbGl0dGxlRW5kaWFuICkgIT09IDB4MDAyQSApIHtcbiAgICAgICAgICAgICAgICBCYXNlLmxvZygnSW52YWxpZCBFeGlmIGRhdGE6IE1pc3NpbmcgVElGRiBtYXJrZXIuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIGRpcmVjdG9yeSBvZmZzZXQgYnl0ZXMsIHVzdWFsbHkgMHgwMDAwMDAwOCBvciA4IGRlY2ltYWw6XG4gICAgICAgICAgICBkaXJPZmZzZXQgPSBkYXRhVmlldy5nZXRVaW50MzIoIHRpZmZPZmZzZXQgKyA0LCBsaXR0bGVFbmRpYW4gKTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgZXhpZiBvYmplY3QgdG8gc3RvcmUgdGhlIHRhZ3M6XG4gICAgICAgICAgICBkYXRhLmV4aWYgPSBuZXcgRVhJRi5FeGlmTWFwKCk7XG4gICAgICAgICAgICAvLyBQYXJzZSB0aGUgdGFncyBvZiB0aGUgbWFpbiBpbWFnZSBkaXJlY3RvcnkgYW5kIHJldHJpZXZlIHRoZVxuICAgICAgICAgICAgLy8gb2Zmc2V0IHRvIHRoZSBuZXh0IGRpcmVjdG9yeSwgdXN1YWxseSB0aGUgdGh1bWJuYWlsIGRpcmVjdG9yeTpcbiAgICAgICAgICAgIGRpck9mZnNldCA9IEVYSUYucGFyc2VFeGlmVGFncyggZGF0YVZpZXcsIHRpZmZPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIHRpZmZPZmZzZXQgKyBkaXJPZmZzZXQsIGxpdHRsZUVuZGlhbiwgZGF0YSApO1xuICAgIFxuICAgICAgICAgICAgLy8g5bCd6K+V6K+75Y+W57yp55Wl5Zu+XG4gICAgICAgICAgICAvLyBpZiAoIGRpck9mZnNldCApIHtcbiAgICAgICAgICAgIC8vICAgICB0aHVtYm5haWxEYXRhID0ge2V4aWY6IHt9fTtcbiAgICAgICAgICAgIC8vICAgICBkaXJPZmZzZXQgPSBFWElGLnBhcnNlRXhpZlRhZ3MoXG4gICAgICAgICAgICAvLyAgICAgICAgIGRhdGFWaWV3LFxuICAgICAgICAgICAgLy8gICAgICAgICB0aWZmT2Zmc2V0LFxuICAgICAgICAgICAgLy8gICAgICAgICB0aWZmT2Zmc2V0ICsgZGlyT2Zmc2V0LFxuICAgICAgICAgICAgLy8gICAgICAgICBsaXR0bGVFbmRpYW4sXG4gICAgICAgICAgICAvLyAgICAgICAgIHRodW1ibmFpbERhdGFcbiAgICAgICAgICAgIC8vICAgICApO1xuICAgIFxuICAgICAgICAgICAgLy8gICAgIC8vIENoZWNrIGZvciBKUEVHIFRodW1ibmFpbCBvZmZzZXQ6XG4gICAgICAgICAgICAvLyAgICAgaWYgKHRodW1ibmFpbERhdGEuZXhpZlsweDAyMDFdKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGRhdGEuZXhpZi5UaHVtYm5haWwgPSBFWElGLmdldEV4aWZUaHVtYm5haWwoXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBkYXRhVmlldyxcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHRpZmZPZmZzZXQgKyB0aHVtYm5haWxEYXRhLmV4aWZbMHgwMjAxXSxcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHRodW1ibmFpbERhdGEuZXhpZlsweDAyMDJdIC8vIFRodW1ibmFpbCBkYXRhIGxlbmd0aFxuICAgICAgICAgICAgLy8gICAgICAgICApO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgSW1hZ2VNZXRhLnBhcnNlcnNbIDB4ZmZlMSBdLnB1c2goIEVYSUYucGFyc2VFeGlmRGF0YSApO1xuICAgICAgICByZXR1cm4gRVhJRjtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiDov5nkuKrmlrnlvI/mgKfog73kuI3ooYzvvIzkvYbmmK/lj6/ku6Xop6PlhrNhbmRyb2lk6YeM6Z2i55qEdG9EYXRhVXJs55qEYnVnXG4gICAgICogYW5kcm9pZOmHjOmdonRvRGF0YVVybCgnaW1hZ2UvanBlZ2UnKeW+l+WIsOeahOe7k+aenOWNtOaYr3BuZy5cbiAgICAgKlxuICAgICAqIOaJgOS7pei/memHjOayoei+me+8jOWPquiDveWAn+WKqei/meS4quW3peWFt1xuICAgICAqIEBmaWxlT3ZlcnZpZXcganBlZyBlbmNvZGVyXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2pwZWdlbmNvZGVyJyxbXSwgZnVuY3Rpb24oIHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSApIHtcbiAgICBcbiAgICAgICAgLypcbiAgICAgICAgICBDb3B5cmlnaHQgKGMpIDIwMDgsIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkXG4gICAgICAgICAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAgICBcbiAgICAgICAgICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgICAgICAgICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlXG4gICAgICAgICAgbWV0OlxuICAgIFxuICAgICAgICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICAgICAgICAgICAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgICBcbiAgICAgICAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICAgICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gICAgICAgICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICAgIFxuICAgICAgICAgICogTmVpdGhlciB0aGUgbmFtZSBvZiBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZCBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICAgICAgICAgICAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb21cbiAgICAgICAgICAgIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gICAgXG4gICAgICAgICAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTXG4gICAgICAgICAgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTyxcbiAgICAgICAgICBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSXG4gICAgICAgICAgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBPV05FUiBPUlxuICAgICAgICAgIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLFxuICAgICAgICAgIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTyxcbiAgICAgICAgICBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcbiAgICAgICAgICBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GXG4gICAgICAgICAgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkdcbiAgICAgICAgICBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcbiAgICAgICAgICBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAgICAgICAgKi9cbiAgICAgICAgLypcbiAgICAgICAgSlBFRyBlbmNvZGVyIHBvcnRlZCB0byBKYXZhU2NyaXB0IGFuZCBvcHRpbWl6ZWQgYnkgQW5kcmVhcyBSaXR0ZXIsIHd3dy5ieXRlc3Ryb20uZXUsIDExLzIwMDlcbiAgICBcbiAgICAgICAgQmFzaWMgR1VJIGJsb2NraW5nIGpwZWcgZW5jb2RlclxuICAgICAgICAqL1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBKUEVHRW5jb2RlcihxdWFsaXR5KSB7XG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGZyb3VuZCA9IE1hdGgucm91bmQ7XG4gICAgICAgICAgICB2YXIgZmZsb29yID0gTWF0aC5mbG9vcjtcbiAgICAgICAgICAgIHZhciBZVGFibGUgPSBuZXcgQXJyYXkoNjQpO1xuICAgICAgICAgICAgdmFyIFVWVGFibGUgPSBuZXcgQXJyYXkoNjQpO1xuICAgICAgICAgICAgdmFyIGZkdGJsX1kgPSBuZXcgQXJyYXkoNjQpO1xuICAgICAgICAgICAgdmFyIGZkdGJsX1VWID0gbmV3IEFycmF5KDY0KTtcbiAgICAgICAgICAgIHZhciBZRENfSFQ7XG4gICAgICAgICAgICB2YXIgVVZEQ19IVDtcbiAgICAgICAgICAgIHZhciBZQUNfSFQ7XG4gICAgICAgICAgICB2YXIgVVZBQ19IVDtcbiAgICBcbiAgICAgICAgICAgIHZhciBiaXRjb2RlID0gbmV3IEFycmF5KDY1NTM1KTtcbiAgICAgICAgICAgIHZhciBjYXRlZ29yeSA9IG5ldyBBcnJheSg2NTUzNSk7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ZkRDVFF1YW50ID0gbmV3IEFycmF5KDY0KTtcbiAgICAgICAgICAgIHZhciBEVSA9IG5ldyBBcnJheSg2NCk7XG4gICAgICAgICAgICB2YXIgYnl0ZW91dCA9IFtdO1xuICAgICAgICAgICAgdmFyIGJ5dGVuZXcgPSAwO1xuICAgICAgICAgICAgdmFyIGJ5dGVwb3MgPSA3O1xuICAgIFxuICAgICAgICAgICAgdmFyIFlEVSA9IG5ldyBBcnJheSg2NCk7XG4gICAgICAgICAgICB2YXIgVURVID0gbmV3IEFycmF5KDY0KTtcbiAgICAgICAgICAgIHZhciBWRFUgPSBuZXcgQXJyYXkoNjQpO1xuICAgICAgICAgICAgdmFyIGNsdCA9IG5ldyBBcnJheSgyNTYpO1xuICAgICAgICAgICAgdmFyIFJHQl9ZVVZfVEFCTEUgPSBuZXcgQXJyYXkoMjA0OCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudFF1YWxpdHk7XG4gICAgXG4gICAgICAgICAgICB2YXIgWmlnWmFnID0gW1xuICAgICAgICAgICAgICAgICAgICAgMCwgMSwgNSwgNiwxNCwxNSwyNywyOCxcbiAgICAgICAgICAgICAgICAgICAgIDIsIDQsIDcsMTMsMTYsMjYsMjksNDIsXG4gICAgICAgICAgICAgICAgICAgICAzLCA4LDEyLDE3LDI1LDMwLDQxLDQzLFxuICAgICAgICAgICAgICAgICAgICAgOSwxMSwxOCwyNCwzMSw0MCw0NCw1MyxcbiAgICAgICAgICAgICAgICAgICAgMTAsMTksMjMsMzIsMzksNDUsNTIsNTQsXG4gICAgICAgICAgICAgICAgICAgIDIwLDIyLDMzLDM4LDQ2LDUxLDU1LDYwLFxuICAgICAgICAgICAgICAgICAgICAyMSwzNCwzNyw0Nyw1MCw1Niw1OSw2MSxcbiAgICAgICAgICAgICAgICAgICAgMzUsMzYsNDgsNDksNTcsNTgsNjIsNjNcbiAgICAgICAgICAgICAgICBdO1xuICAgIFxuICAgICAgICAgICAgdmFyIHN0ZF9kY19sdW1pbmFuY2VfbnJjb2RlcyA9IFswLDAsMSw1LDEsMSwxLDEsMSwxLDAsMCwwLDAsMCwwLDBdO1xuICAgICAgICAgICAgdmFyIHN0ZF9kY19sdW1pbmFuY2VfdmFsdWVzID0gWzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTFdO1xuICAgICAgICAgICAgdmFyIHN0ZF9hY19sdW1pbmFuY2VfbnJjb2RlcyA9IFswLDAsMiwxLDMsMywyLDQsMyw1LDUsNCw0LDAsMCwxLDB4N2RdO1xuICAgICAgICAgICAgdmFyIHN0ZF9hY19sdW1pbmFuY2VfdmFsdWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAweDAxLDB4MDIsMHgwMywweDAwLDB4MDQsMHgxMSwweDA1LDB4MTIsXG4gICAgICAgICAgICAgICAgICAgIDB4MjEsMHgzMSwweDQxLDB4MDYsMHgxMywweDUxLDB4NjEsMHgwNyxcbiAgICAgICAgICAgICAgICAgICAgMHgyMiwweDcxLDB4MTQsMHgzMiwweDgxLDB4OTEsMHhhMSwweDA4LFxuICAgICAgICAgICAgICAgICAgICAweDIzLDB4NDIsMHhiMSwweGMxLDB4MTUsMHg1MiwweGQxLDB4ZjAsXG4gICAgICAgICAgICAgICAgICAgIDB4MjQsMHgzMywweDYyLDB4NzIsMHg4MiwweDA5LDB4MGEsMHgxNixcbiAgICAgICAgICAgICAgICAgICAgMHgxNywweDE4LDB4MTksMHgxYSwweDI1LDB4MjYsMHgyNywweDI4LFxuICAgICAgICAgICAgICAgICAgICAweDI5LDB4MmEsMHgzNCwweDM1LDB4MzYsMHgzNywweDM4LDB4MzksXG4gICAgICAgICAgICAgICAgICAgIDB4M2EsMHg0MywweDQ0LDB4NDUsMHg0NiwweDQ3LDB4NDgsMHg0OSxcbiAgICAgICAgICAgICAgICAgICAgMHg0YSwweDUzLDB4NTQsMHg1NSwweDU2LDB4NTcsMHg1OCwweDU5LFxuICAgICAgICAgICAgICAgICAgICAweDVhLDB4NjMsMHg2NCwweDY1LDB4NjYsMHg2NywweDY4LDB4NjksXG4gICAgICAgICAgICAgICAgICAgIDB4NmEsMHg3MywweDc0LDB4NzUsMHg3NiwweDc3LDB4NzgsMHg3OSxcbiAgICAgICAgICAgICAgICAgICAgMHg3YSwweDgzLDB4ODQsMHg4NSwweDg2LDB4ODcsMHg4OCwweDg5LFxuICAgICAgICAgICAgICAgICAgICAweDhhLDB4OTIsMHg5MywweDk0LDB4OTUsMHg5NiwweDk3LDB4OTgsXG4gICAgICAgICAgICAgICAgICAgIDB4OTksMHg5YSwweGEyLDB4YTMsMHhhNCwweGE1LDB4YTYsMHhhNyxcbiAgICAgICAgICAgICAgICAgICAgMHhhOCwweGE5LDB4YWEsMHhiMiwweGIzLDB4YjQsMHhiNSwweGI2LFxuICAgICAgICAgICAgICAgICAgICAweGI3LDB4YjgsMHhiOSwweGJhLDB4YzIsMHhjMywweGM0LDB4YzUsXG4gICAgICAgICAgICAgICAgICAgIDB4YzYsMHhjNywweGM4LDB4YzksMHhjYSwweGQyLDB4ZDMsMHhkNCxcbiAgICAgICAgICAgICAgICAgICAgMHhkNSwweGQ2LDB4ZDcsMHhkOCwweGQ5LDB4ZGEsMHhlMSwweGUyLFxuICAgICAgICAgICAgICAgICAgICAweGUzLDB4ZTQsMHhlNSwweGU2LDB4ZTcsMHhlOCwweGU5LDB4ZWEsXG4gICAgICAgICAgICAgICAgICAgIDB4ZjEsMHhmMiwweGYzLDB4ZjQsMHhmNSwweGY2LDB4ZjcsMHhmOCxcbiAgICAgICAgICAgICAgICAgICAgMHhmOSwweGZhXG4gICAgICAgICAgICAgICAgXTtcbiAgICBcbiAgICAgICAgICAgIHZhciBzdGRfZGNfY2hyb21pbmFuY2VfbnJjb2RlcyA9IFswLDAsMywxLDEsMSwxLDEsMSwxLDEsMSwwLDAsMCwwLDBdO1xuICAgICAgICAgICAgdmFyIHN0ZF9kY19jaHJvbWluYW5jZV92YWx1ZXMgPSBbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMV07XG4gICAgICAgICAgICB2YXIgc3RkX2FjX2Nocm9taW5hbmNlX25yY29kZXMgPSBbMCwwLDIsMSwyLDQsNCwzLDQsNyw1LDQsNCwwLDEsMiwweDc3XTtcbiAgICAgICAgICAgIHZhciBzdGRfYWNfY2hyb21pbmFuY2VfdmFsdWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAweDAwLDB4MDEsMHgwMiwweDAzLDB4MTEsMHgwNCwweDA1LDB4MjEsXG4gICAgICAgICAgICAgICAgICAgIDB4MzEsMHgwNiwweDEyLDB4NDEsMHg1MSwweDA3LDB4NjEsMHg3MSxcbiAgICAgICAgICAgICAgICAgICAgMHgxMywweDIyLDB4MzIsMHg4MSwweDA4LDB4MTQsMHg0MiwweDkxLFxuICAgICAgICAgICAgICAgICAgICAweGExLDB4YjEsMHhjMSwweDA5LDB4MjMsMHgzMywweDUyLDB4ZjAsXG4gICAgICAgICAgICAgICAgICAgIDB4MTUsMHg2MiwweDcyLDB4ZDEsMHgwYSwweDE2LDB4MjQsMHgzNCxcbiAgICAgICAgICAgICAgICAgICAgMHhlMSwweDI1LDB4ZjEsMHgxNywweDE4LDB4MTksMHgxYSwweDI2LFxuICAgICAgICAgICAgICAgICAgICAweDI3LDB4MjgsMHgyOSwweDJhLDB4MzUsMHgzNiwweDM3LDB4MzgsXG4gICAgICAgICAgICAgICAgICAgIDB4MzksMHgzYSwweDQzLDB4NDQsMHg0NSwweDQ2LDB4NDcsMHg0OCxcbiAgICAgICAgICAgICAgICAgICAgMHg0OSwweDRhLDB4NTMsMHg1NCwweDU1LDB4NTYsMHg1NywweDU4LFxuICAgICAgICAgICAgICAgICAgICAweDU5LDB4NWEsMHg2MywweDY0LDB4NjUsMHg2NiwweDY3LDB4NjgsXG4gICAgICAgICAgICAgICAgICAgIDB4NjksMHg2YSwweDczLDB4NzQsMHg3NSwweDc2LDB4NzcsMHg3OCxcbiAgICAgICAgICAgICAgICAgICAgMHg3OSwweDdhLDB4ODIsMHg4MywweDg0LDB4ODUsMHg4NiwweDg3LFxuICAgICAgICAgICAgICAgICAgICAweDg4LDB4ODksMHg4YSwweDkyLDB4OTMsMHg5NCwweDk1LDB4OTYsXG4gICAgICAgICAgICAgICAgICAgIDB4OTcsMHg5OCwweDk5LDB4OWEsMHhhMiwweGEzLDB4YTQsMHhhNSxcbiAgICAgICAgICAgICAgICAgICAgMHhhNiwweGE3LDB4YTgsMHhhOSwweGFhLDB4YjIsMHhiMywweGI0LFxuICAgICAgICAgICAgICAgICAgICAweGI1LDB4YjYsMHhiNywweGI4LDB4YjksMHhiYSwweGMyLDB4YzMsXG4gICAgICAgICAgICAgICAgICAgIDB4YzQsMHhjNSwweGM2LDB4YzcsMHhjOCwweGM5LDB4Y2EsMHhkMixcbiAgICAgICAgICAgICAgICAgICAgMHhkMywweGQ0LDB4ZDUsMHhkNiwweGQ3LDB4ZDgsMHhkOSwweGRhLFxuICAgICAgICAgICAgICAgICAgICAweGUyLDB4ZTMsMHhlNCwweGU1LDB4ZTYsMHhlNywweGU4LDB4ZTksXG4gICAgICAgICAgICAgICAgICAgIDB4ZWEsMHhmMiwweGYzLDB4ZjQsMHhmNSwweGY2LDB4ZjcsMHhmOCxcbiAgICAgICAgICAgICAgICAgICAgMHhmOSwweGZhXG4gICAgICAgICAgICAgICAgXTtcbiAgICBcbiAgICAgICAgICAgIGZ1bmN0aW9uIGluaXRRdWFudFRhYmxlcyhzZil7XG4gICAgICAgICAgICAgICAgICAgIHZhciBZUVQgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAxNiwgMTEsIDEwLCAxNiwgMjQsIDQwLCA1MSwgNjEsXG4gICAgICAgICAgICAgICAgICAgICAgICAxMiwgMTIsIDE0LCAxOSwgMjYsIDU4LCA2MCwgNTUsXG4gICAgICAgICAgICAgICAgICAgICAgICAxNCwgMTMsIDE2LCAyNCwgNDAsIDU3LCA2OSwgNTYsXG4gICAgICAgICAgICAgICAgICAgICAgICAxNCwgMTcsIDIyLCAyOSwgNTEsIDg3LCA4MCwgNjIsXG4gICAgICAgICAgICAgICAgICAgICAgICAxOCwgMjIsIDM3LCA1NiwgNjgsMTA5LDEwMywgNzcsXG4gICAgICAgICAgICAgICAgICAgICAgICAyNCwgMzUsIDU1LCA2NCwgODEsMTA0LDExMywgOTIsXG4gICAgICAgICAgICAgICAgICAgICAgICA0OSwgNjQsIDc4LCA4NywxMDMsMTIxLDEyMCwxMDEsXG4gICAgICAgICAgICAgICAgICAgICAgICA3MiwgOTIsIDk1LCA5OCwxMTIsMTAwLDEwMywgOTlcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA2NDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IGZmbG9vcigoWVFUW2ldKnNmKzUwKS8xMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHQgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdCA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHQgPiAyNTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ID0gMjU1O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgWVRhYmxlW1ppZ1phZ1tpXV0gPSB0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBVVlFUID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgMTcsIDE4LCAyNCwgNDcsIDk5LCA5OSwgOTksIDk5LFxuICAgICAgICAgICAgICAgICAgICAgICAgMTgsIDIxLCAyNiwgNjYsIDk5LCA5OSwgOTksIDk5LFxuICAgICAgICAgICAgICAgICAgICAgICAgMjQsIDI2LCA1NiwgOTksIDk5LCA5OSwgOTksIDk5LFxuICAgICAgICAgICAgICAgICAgICAgICAgNDcsIDY2LCA5OSwgOTksIDk5LCA5OSwgOTksIDk5LFxuICAgICAgICAgICAgICAgICAgICAgICAgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksIDk5LFxuICAgICAgICAgICAgICAgICAgICAgICAgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksIDk5LFxuICAgICAgICAgICAgICAgICAgICAgICAgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksIDk5LFxuICAgICAgICAgICAgICAgICAgICAgICAgOTksIDk5LCA5OSwgOTksIDk5LCA5OSwgOTksIDk5XG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNjQ7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHUgPSBmZmxvb3IoKFVWUVRbal0qc2YrNTApLzEwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodSA+IDI1NSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHUgPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBVVlRhYmxlW1ppZ1phZ1tqXV0gPSB1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBhYXNmID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgMS4wLCAxLjM4NzAzOTg0NSwgMS4zMDY1NjI5NjUsIDEuMTc1ODc1NjAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgMS4wLCAwLjc4NTY5NDk1OCwgMC41NDExOTYxMDAsIDAuMjc1ODk5Mzc5XG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBrID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcm93ID0gMDsgcm93IDwgODsgcm93KyspXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IDg7IGNvbCsrKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZkdGJsX1lba10gID0gKDEuMCAvIChZVGFibGUgW1ppZ1phZ1trXV0gKiBhYXNmW3Jvd10gKiBhYXNmW2NvbF0gKiA4LjApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmZHRibF9VVltrXSA9ICgxLjAgLyAoVVZUYWJsZVtaaWdaYWdba11dICogYWFzZltyb3ddICogYWFzZltjb2xdICogOC4wKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVIdWZmbWFuVGJsKG5yY29kZXMsIHN0ZF90YWJsZSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RldmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zX2luX3RhYmxlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIEhUID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAxOyBrIDw9IDE2OyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDw9IG5yY29kZXNba107IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhUW3N0ZF90YWJsZVtwb3NfaW5fdGFibGVdXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhUW3N0ZF90YWJsZVtwb3NfaW5fdGFibGVdXVswXSA9IGNvZGV2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBIVFtzdGRfdGFibGVbcG9zX2luX3RhYmxlXV1bMV0gPSBrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc19pbl90YWJsZSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGV2YWx1ZSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZXZhbHVlKj0yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBIVDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdEh1ZmZtYW5UYmwoKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgWURDX0hUID0gY29tcHV0ZUh1ZmZtYW5UYmwoc3RkX2RjX2x1bWluYW5jZV9ucmNvZGVzLHN0ZF9kY19sdW1pbmFuY2VfdmFsdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgVVZEQ19IVCA9IGNvbXB1dGVIdWZmbWFuVGJsKHN0ZF9kY19jaHJvbWluYW5jZV9ucmNvZGVzLHN0ZF9kY19jaHJvbWluYW5jZV92YWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgICBZQUNfSFQgPSBjb21wdXRlSHVmZm1hblRibChzdGRfYWNfbHVtaW5hbmNlX25yY29kZXMsc3RkX2FjX2x1bWluYW5jZV92YWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgICBVVkFDX0hUID0gY29tcHV0ZUh1ZmZtYW5UYmwoc3RkX2FjX2Nocm9taW5hbmNlX25yY29kZXMsc3RkX2FjX2Nocm9taW5hbmNlX3ZhbHVlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXRDYXRlZ29yeU51bWJlcigpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbnJsb3dlciA9IDE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBucnVwcGVyID0gMjtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgY2F0ID0gMTsgY2F0IDw9IDE1OyBjYXQrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9Qb3NpdGl2ZSBudW1iZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuciA9IG5ybG93ZXI7IG5yPG5ydXBwZXI7IG5yKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeVszMjc2Nytucl0gPSBjYXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYml0Y29kZVszMjc2Nytucl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRjb2RlWzMyNzY3K25yXVsxXSA9IGNhdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRjb2RlWzMyNzY3K25yXVswXSA9IG5yO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy9OZWdhdGl2ZSBudW1iZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBucm5lZyA9LShucnVwcGVyLTEpOyBucm5lZzw9LW5ybG93ZXI7IG5ybmVnKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeVszMjc2Nytucm5lZ10gPSBjYXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYml0Y29kZVszMjc2Nytucm5lZ10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRjb2RlWzMyNzY3K25ybmVnXVsxXSA9IGNhdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRjb2RlWzMyNzY3K25ybmVnXVswXSA9IG5ydXBwZXItMStucm5lZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5ybG93ZXIgPDw9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBucnVwcGVyIDw8PSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXRSR0JZVVZUYWJsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IDI1NjtpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJHQl9ZVVZfVEFCTEVbaV0gICAgICAgICAgICA9ICAxOTU5NSAqIGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBSR0JfWVVWX1RBQkxFWyhpKyAyNTYpPj4wXSAgPSAgMzg0NzAgKiBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgUkdCX1lVVl9UQUJMRVsoaSsgNTEyKT4+MF0gID0gICA3NDcxICogaSArIDB4ODAwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJHQl9ZVVZfVEFCTEVbKGkrIDc2OCk+PjBdICA9IC0xMTA1OSAqIGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBSR0JfWVVWX1RBQkxFWyhpKzEwMjQpPj4wXSAgPSAtMjE3MDkgKiBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgUkdCX1lVVl9UQUJMRVsoaSsxMjgwKT4+MF0gID0gIDMyNzY4ICogaSArIDB4ODA3RkZGO1xuICAgICAgICAgICAgICAgICAgICAgICAgUkdCX1lVVl9UQUJMRVsoaSsxNTM2KT4+MF0gID0gLTI3NDM5ICogaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJHQl9ZVVZfVEFCTEVbKGkrMTc5Mik+PjBdICA9IC0gNTMyOSAqIGk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gSU8gZnVuY3Rpb25zXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVCaXRzKGJzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYnNbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3N2YWwgPSBic1sxXS0xO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIHBvc3ZhbCA+PSAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICYgKDEgPDwgcG9zdmFsKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBieXRlbmV3IHw9ICgxIDw8IGJ5dGVwb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdmFsLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBieXRlcG9zLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZXBvcyA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZW5ldyA9PSAweEZGKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweEZGKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKGJ5dGVuZXcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBieXRlcG9zPTc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnl0ZW5ldz0wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHdyaXRlQnl0ZSh2YWx1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVvdXQucHVzaChjbHRbdmFsdWVdKTsgLy8gd3JpdGUgY2hhciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNvbnZlcnRpbmcgbGF0ZXJcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVXb3JkKHZhbHVlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKCh2YWx1ZT4+OCkmMHhGRik7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgodmFsdWUgICApJjB4RkYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBEQ1QgJiBxdWFudGl6YXRpb24gY29yZVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGZEQ1RRdWFudChkYXRhLCBmZHRibClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkMCwgZDEsIGQyLCBkMywgZDQsIGQ1LCBkNiwgZDc7XG4gICAgICAgICAgICAgICAgICAgIC8qIFBhc3MgMTogcHJvY2VzcyByb3dzLiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YU9mZj0wO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIEk4ID0gODtcbiAgICAgICAgICAgICAgICAgICAgdmFyIEk2NCA9IDY0O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGk9MDsgaTxJODsgKytpKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkMCA9IGRhdGFbZGF0YU9mZl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkMSA9IGRhdGFbZGF0YU9mZisxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQyID0gZGF0YVtkYXRhT2ZmKzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDMgPSBkYXRhW2RhdGFPZmYrM107XG4gICAgICAgICAgICAgICAgICAgICAgICBkNCA9IGRhdGFbZGF0YU9mZis0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQ1ID0gZGF0YVtkYXRhT2ZmKzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDYgPSBkYXRhW2RhdGFPZmYrNl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkNyA9IGRhdGFbZGF0YU9mZis3XTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAwID0gZDAgKyBkNztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXA3ID0gZDAgLSBkNztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAxID0gZDEgKyBkNjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXA2ID0gZDEgLSBkNjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAyID0gZDIgKyBkNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXA1ID0gZDIgLSBkNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAzID0gZDMgKyBkNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXA0ID0gZDMgLSBkNDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEV2ZW4gcGFydCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDEwID0gdG1wMCArIHRtcDM7ICAgIC8qIHBoYXNlIDIgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAxMyA9IHRtcDAgLSB0bXAzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDExID0gdG1wMSArIHRtcDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMTIgPSB0bXAxIC0gdG1wMjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZl0gPSB0bXAxMCArIHRtcDExOyAvKiBwaGFzZSAzICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrNF0gPSB0bXAxMCAtIHRtcDExO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoxID0gKHRtcDEyICsgdG1wMTMpICogMC43MDcxMDY3ODE7IC8qIGM0ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrMl0gPSB0bXAxMyArIHoxOyAvKiBwaGFzZSA1ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrNl0gPSB0bXAxMyAtIHoxO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogT2RkIHBhcnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcDEwID0gdG1wNCArIHRtcDU7IC8qIHBoYXNlIDIgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcDExID0gdG1wNSArIHRtcDY7XG4gICAgICAgICAgICAgICAgICAgICAgICB0bXAxMiA9IHRtcDYgKyB0bXA3O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHJvdGF0b3IgaXMgbW9kaWZpZWQgZnJvbSBmaWcgNC04IHRvIGF2b2lkIGV4dHJhIG5lZ2F0aW9ucy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6NSA9ICh0bXAxMCAtIHRtcDEyKSAqIDAuMzgyNjgzNDMzOyAvKiBjNiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoyID0gMC41NDExOTYxMDAgKiB0bXAxMCArIHo1OyAvKiBjMi1jNiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHo0ID0gMS4zMDY1NjI5NjUgKiB0bXAxMiArIHo1OyAvKiBjMitjNiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHozID0gdG1wMTEgKiAwLjcwNzEwNjc4MTsgLyogYzQgKi9cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6MTEgPSB0bXA3ICsgejM7ICAgIC8qIHBoYXNlIDUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6MTMgPSB0bXA3IC0gejM7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrNV0gPSB6MTMgKyB6MjsgLyogcGhhc2UgNiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmKzNdID0gejEzIC0gejI7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrMV0gPSB6MTEgKyB6NDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZis3XSA9IHoxMSAtIHo0O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YU9mZiArPSA4OyAvKiBhZHZhbmNlIHBvaW50ZXIgdG8gbmV4dCByb3cgKi9cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvKiBQYXNzIDI6IHByb2Nlc3MgY29sdW1ucy4gKi9cbiAgICAgICAgICAgICAgICAgICAgZGF0YU9mZiA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaT0wOyBpPEk4OyArK2kpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQwID0gZGF0YVtkYXRhT2ZmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQxID0gZGF0YVtkYXRhT2ZmICsgOF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkMiA9IGRhdGFbZGF0YU9mZiArIDE2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQzID0gZGF0YVtkYXRhT2ZmICsgMjRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDQgPSBkYXRhW2RhdGFPZmYgKyAzMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkNSA9IGRhdGFbZGF0YU9mZiArIDQwXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQ2ID0gZGF0YVtkYXRhT2ZmICsgNDhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZDcgPSBkYXRhW2RhdGFPZmYgKyA1Nl07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMHAyID0gZDAgKyBkNztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXA3cDIgPSBkMCAtIGQ3O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDFwMiA9IGQxICsgZDY7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wNnAyID0gZDEgLSBkNjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAycDIgPSBkMiArIGQ1O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDVwMiA9IGQyIC0gZDU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wM3AyID0gZDMgKyBkNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXA0cDIgPSBkMyAtIGQ0O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogRXZlbiBwYXJ0ICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMTBwMiA9IHRtcDBwMiArIHRtcDNwMjsgIC8qIHBoYXNlIDIgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0bXAxM3AyID0gdG1wMHAyIC0gdG1wM3AyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcDExcDIgPSB0bXAxcDIgKyB0bXAycDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wMTJwMiA9IHRtcDFwMiAtIHRtcDJwMjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZl0gPSB0bXAxMHAyICsgdG1wMTFwMjsgLyogcGhhc2UgMyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmKzMyXSA9IHRtcDEwcDIgLSB0bXAxMXAyO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoxcDIgPSAodG1wMTJwMiArIHRtcDEzcDIpICogMC43MDcxMDY3ODE7IC8qIGM0ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrMTZdID0gdG1wMTNwMiArIHoxcDI7IC8qIHBoYXNlIDUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZis0OF0gPSB0bXAxM3AyIC0gejFwMjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE9kZCBwYXJ0ICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0bXAxMHAyID0gdG1wNHAyICsgdG1wNXAyOyAvKiBwaGFzZSAyICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0bXAxMXAyID0gdG1wNXAyICsgdG1wNnAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG1wMTJwMiA9IHRtcDZwMiArIHRtcDdwMjtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSByb3RhdG9yIGlzIG1vZGlmaWVkIGZyb20gZmlnIDQtOCB0byBhdm9pZCBleHRyYSBuZWdhdGlvbnMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgejVwMiA9ICh0bXAxMHAyIC0gdG1wMTJwMikgKiAwLjM4MjY4MzQzMzsgLyogYzYgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6MnAyID0gMC41NDExOTYxMDAgKiB0bXAxMHAyICsgejVwMjsgLyogYzItYzYgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6NHAyID0gMS4zMDY1NjI5NjUgKiB0bXAxMnAyICsgejVwMjsgLyogYzIrYzYgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6M3AyID0gdG1wMTFwMiAqIDAuNzA3MTA2NzgxOyAvKiBjNCAqL1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHoxMXAyID0gdG1wN3AyICsgejNwMjsgIC8qIHBoYXNlIDUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6MTNwMiA9IHRtcDdwMiAtIHozcDI7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrNDBdID0gejEzcDIgKyB6MnAyOyAvKiBwaGFzZSA2ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2RhdGFPZmYrMjRdID0gejEzcDIgLSB6MnAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtkYXRhT2ZmKyA4XSA9IHoxMXAyICsgejRwMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZGF0YU9mZis1Nl0gPSB6MTFwMiAtIHo0cDI7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2ZmKys7IC8qIGFkdmFuY2UgcG9pbnRlciB0byBuZXh0IGNvbHVtbiAqL1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIFF1YW50aXplL2Rlc2NhbGUgdGhlIGNvZWZmaWNpZW50c1xuICAgICAgICAgICAgICAgICAgICB2YXIgZkRDVFF1YW50O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGk9MDsgaTxJNjQ7ICsraSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkgdGhlIHF1YW50aXphdGlvbiBhbmQgc2NhbGluZyBmYWN0b3IgJiBSb3VuZCB0byBuZWFyZXN0IGludGVnZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZEQ1RRdWFudCA9IGRhdGFbaV0qZmR0YmxbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRmRENUUXVhbnRbaV0gPSAoZkRDVFF1YW50ID4gMC4wKSA/ICgoZkRDVFF1YW50ICsgMC41KXwwKSA6ICgoZkRDVFF1YW50IC0gMC41KXwwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vb3V0cHV0ZkRDVFF1YW50W2ldID0gZnJvdW5kKGZEQ1RRdWFudCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dHB1dGZEQ1RRdWFudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVBUFAwKClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgweEZGRTApOyAvLyBtYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDE2KTsgLy8gbGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweDRBKTsgLy8gSlxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMHg0Nik7IC8vIEZcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4NDkpOyAvLyBJXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweDQ2KTsgLy8gRlxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMCk7IC8vID0gXCJKRklGXCIsJ1xcMCdcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpOyAvLyB2ZXJzaW9uaGlcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpOyAvLyB2ZXJzaW9ubG9cbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApOyAvLyB4eXVuaXRzXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgxKTsgLy8geGRlbnNpdHlcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDEpOyAvLyB5ZGVuc2l0eVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMCk7IC8vIHRodW1ibndpZHRoXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgwKTsgLy8gdGh1bWJuaGVpZ2h0XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHdyaXRlU09GMCh3aWR0aCwgaGVpZ2h0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDB4RkZDMCk7IC8vIG1hcmtlclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMTcpOyAgIC8vIGxlbmd0aCwgdHJ1ZWNvbG9yIFlVViBKUEdcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDgpOyAgICAvLyBwcmVjaXNpb25cbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKGhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCh3aWR0aCk7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgzKTsgICAgLy8gbnJvZmNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpOyAgICAvLyBJZFlcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4MTEpOyAvLyBIVllcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApOyAgICAvLyBRVFlcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDIpOyAgICAvLyBJZFVcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4MTEpOyAvLyBIVlVcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpOyAgICAvLyBRVFVcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDMpOyAgICAvLyBJZFZcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4MTEpOyAvLyBIVlZcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpOyAgICAvLyBRVFZcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVEUVQoKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVXb3JkKDB4RkZEQik7IC8vIG1hcmtlclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMTMyKTsgICAgLy8gbGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgwKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPDY0OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShZVGFibGVbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaj0wOyBqPDY0OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShVVlRhYmxlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiB3cml0ZURIVCgpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMHhGRkM0KTsgLy8gbWFya2VyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgweDAxQTIpOyAvLyBsZW5ndGhcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDApOyAvLyBIVFlEQ2luZm9cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPDE2OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShzdGRfZGNfbHVtaW5hbmNlX25yY29kZXNbaSsxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaj0wOyBqPD0xMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoc3RkX2RjX2x1bWluYW5jZV92YWx1ZXNbal0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweDEwKTsgLy8gSFRZQUNpbmZvXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGs9MDsgazwxNjsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoc3RkX2FjX2x1bWluYW5jZV9ucmNvZGVzW2srMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGw9MDsgbDw9MTYxOyBsKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShzdGRfYWNfbHVtaW5hbmNlX3ZhbHVlc1tsXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDEpOyAvLyBIVFVEQ2luZm9cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbT0wOyBtPDE2OyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShzdGRfZGNfY2hyb21pbmFuY2VfbnJjb2Rlc1ttKzFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuPTA7IG48PTExOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShzdGRfZGNfY2hyb21pbmFuY2VfdmFsdWVzW25dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMHgxMSk7IC8vIEhUVUFDaW5mb1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBvPTA7IG88MTY7IG8rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKHN0ZF9hY19jaHJvbWluYW5jZV9ucmNvZGVzW28rMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHA9MDsgcDw9MTYxOyBwKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZShzdGRfYWNfY2hyb21pbmFuY2VfdmFsdWVzW3BdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiB3cml0ZVNPUygpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMHhGRkRBKTsgLy8gbWFya2VyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlV29yZCgxMik7IC8vIGxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMyk7IC8vIG5yb2Zjb21wb25lbnRzXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgxKTsgLy8gSWRZXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgwKTsgLy8gSFRZXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgyKTsgLy8gSWRVXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweDExKTsgLy8gSFRVXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgzKTsgLy8gSWRWXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgweDExKTsgLy8gSFRWXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnl0ZSgwKTsgLy8gU3NcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVCeXRlKDB4M2YpOyAvLyBTZVxuICAgICAgICAgICAgICAgICAgICB3cml0ZUJ5dGUoMCk7IC8vIEJmXG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NEVShDRFUsIGZkdGJsLCBEQywgSFREQywgSFRBQyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBFT0IgPSBIVEFDWzB4MDBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgTTE2emVyb2VzID0gSFRBQ1sweEYwXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIEkxNiA9IDE2O1xuICAgICAgICAgICAgICAgICAgICB2YXIgSTYzID0gNjM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBJNjQgPSA2NDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIERVX0RDVCA9IGZEQ1RRdWFudChDRFUsIGZkdGJsKTtcbiAgICAgICAgICAgICAgICAgICAgLy9aaWdaYWcgcmVvcmRlclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqPTA7ajxJNjQ7KytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBEVVtaaWdaYWdbal1dPURVX0RDVFtqXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgRGlmZiA9IERVWzBdIC0gREM7IERDID0gRFVbMF07XG4gICAgICAgICAgICAgICAgICAgIC8vRW5jb2RlIERDXG4gICAgICAgICAgICAgICAgICAgIGlmIChEaWZmPT0wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJpdHMoSFREQ1swXSk7IC8vIERpZmYgbWlnaHQgYmUgMFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zID0gMzI3NjcrRGlmZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQml0cyhIVERDW2NhdGVnb3J5W3Bvc11dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQml0cyhiaXRjb2RlW3Bvc10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vRW5jb2RlIEFDc1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW5kMHBvcyA9IDYzOyAvLyB3YXMgY29uc3QuLi4gd2hpY2ggaXMgY3JhenlcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IChlbmQwcG9zPjApJiYoRFVbZW5kMHBvc109PTApOyBlbmQwcG9zLS0pIHt9O1xuICAgICAgICAgICAgICAgICAgICAvL2VuZDBwb3MgPSBmaXJzdCBlbGVtZW50IGluIHJldmVyc2Ugb3JkZXIgIT0wXG4gICAgICAgICAgICAgICAgICAgIGlmICggZW5kMHBvcyA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJpdHMoRU9CKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEQztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsbmc7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICggaSA8PSBlbmQwcG9zICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXJ0cG9zID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoOyAoRFVbaV09PTApICYmIChpPD1lbmQwcG9zKTsgKytpKSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5yemVyb2VzID0gaS1zdGFydHBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbnJ6ZXJvZXMgPj0gSTE2ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxuZyA9IG5yemVyb2VzPj40O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5ybWFya2VyPTE7IG5ybWFya2VyIDw9IGxuZzsgKytucm1hcmtlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCaXRzKE0xNnplcm9lcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnJ6ZXJvZXMgPSBucnplcm9lcyYweEY7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgPSAzMjc2NytEVVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQml0cyhIVEFDWyhucnplcm9lczw8NCkrY2F0ZWdvcnlbcG9zXV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCaXRzKGJpdGNvZGVbcG9zXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbmQwcG9zICE9IEk2MyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQml0cyhFT0IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBEQztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdENoYXJMb29rdXBUYWJsZSgpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2ZjYyA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpIDwgMjU2OyBpKyspeyAvLy8vLyBBQ0hUVU5HIC8vIDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgY2x0W2ldID0gc2ZjYyhpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmVuY29kZSA9IGZ1bmN0aW9uKGltYWdlLHF1YWxpdHkpIC8vIGltYWdlIGRhdGEgb2JqZWN0XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvLyB2YXIgdGltZV9zdGFydCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZihxdWFsaXR5KSBzZXRRdWFsaXR5KHF1YWxpdHkpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIGJpdCB3cml0ZXJcbiAgICAgICAgICAgICAgICAgICAgYnl0ZW91dCA9IG5ldyBBcnJheSgpO1xuICAgICAgICAgICAgICAgICAgICBieXRlbmV3PTA7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVwb3M9NztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIEpQRUcgaGVhZGVyc1xuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMHhGRkQ4KTsgLy8gU09JXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQVBQMCgpO1xuICAgICAgICAgICAgICAgICAgICB3cml0ZURRVCgpO1xuICAgICAgICAgICAgICAgICAgICB3cml0ZVNPRjAoaW1hZ2Uud2lkdGgsaW1hZ2UuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVESFQoKTtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVTT1MoKTtcbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gRW5jb2RlIDh4OCBtYWNyb2Jsb2Nrc1xuICAgICAgICAgICAgICAgICAgICB2YXIgRENZPTA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBEQ1U9MDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIERDVj0wO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBieXRlbmV3PTA7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVwb3M9NztcbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbmNvZGUuZGlzcGxheU5hbWUgPSBcIl9lbmNvZGVfXCI7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbWFnZURhdGEgPSBpbWFnZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1YWRXaWR0aCA9IHdpZHRoKjQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmlwbGVXaWR0aCA9IHdpZHRoKjM7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciB4LCB5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHIsIGcsIGI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGFydCxwLCBjb2wscm93LHBvcztcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUoeSA8IGhlaWdodCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlKHggPCBxdWFkV2lkdGgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBxdWFkV2lkdGggKiB5ICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBzdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgcm93ID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcihwb3M9MDsgcG9zIDwgNjQ7IHBvcysrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3cgPSBwb3MgPj4gMzsvLyAvOFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9ICggcG9zICYgNyApICogNDsgLy8gJThcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwID0gc3RhcnQgKyAoIHJvdyAqIHF1YWRXaWR0aCApICsgY29sO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHkrcm93ID49IGhlaWdodCl7IC8vIHBhZGRpbmcgYm90dG9tXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAtPSAocXVhZFdpZHRoKih5KzErcm93LWhlaWdodCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZih4K2NvbCA+PSBxdWFkV2lkdGgpeyAvLyBwYWRkaW5nIHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAtPSAoKHgrY29sKSAtIHF1YWRXaWR0aCArNClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IGltYWdlRGF0YVsgcCsrIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZyA9IGltYWdlRGF0YVsgcCsrIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYiA9IGltYWdlRGF0YVsgcCsrIF07XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogLy8gY2FsY3VsYXRlIFlVViB2YWx1ZXMgZHluYW1pY2FsbHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBZRFVbcG9zXT0oKCggMC4yOTkwMCkqcisoIDAuNTg3MDApKmcrKCAwLjExNDAwKSpiKSktMTI4OyAvLy0weDgwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVURVW3Bvc109KCgoLTAuMTY4NzQpKnIrKC0wLjMzMTI2KSpnKyggMC41MDAwMCkqYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZEVVtwb3NdPSgoKCAwLjUwMDAwKSpyKygtMC40MTg2OSkqZysoLTAuMDgxMzEpKmIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZSBsb29rdXAgdGFibGUgKHNsaWdodGx5IGZhc3RlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBZRFVbcG9zXSA9ICgoUkdCX1lVVl9UQUJMRVtyXSAgICAgICAgICAgICArIFJHQl9ZVVZfVEFCTEVbKGcgKyAgMjU2KT4+MF0gKyBSR0JfWVVWX1RBQkxFWyhiICsgIDUxMik+PjBdKSA+PiAxNiktMTI4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFVEVVtwb3NdID0gKChSR0JfWVVWX1RBQkxFWyhyICsgIDc2OCk+PjBdICsgUkdCX1lVVl9UQUJMRVsoZyArIDEwMjQpPj4wXSArIFJHQl9ZVVZfVEFCTEVbKGIgKyAxMjgwKT4+MF0pID4+IDE2KS0xMjg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVkRVW3Bvc10gPSAoKFJHQl9ZVVZfVEFCTEVbKHIgKyAxMjgwKT4+MF0gKyBSR0JfWVVWX1RBQkxFWyhnICsgMTUzNik+PjBdICsgUkdCX1lVVl9UQUJMRVsoYiArIDE3OTIpPj4wXSkgPj4gMTYpLTEyODtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIERDWSA9IHByb2Nlc3NEVShZRFUsIGZkdGJsX1ksIERDWSwgWURDX0hULCBZQUNfSFQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgRENVID0gcHJvY2Vzc0RVKFVEVSwgZmR0YmxfVVYsIERDVSwgVVZEQ19IVCwgVVZBQ19IVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBEQ1YgPSBwcm9jZXNzRFUoVkRVLCBmZHRibF9VViwgRENWLCBVVkRDX0hULCBVVkFDX0hUKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgrPTMyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeSs9ODtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIERvIHRoZSBiaXQgYWxpZ25tZW50IG9mIHRoZSBFT0kgbWFya2VyXG4gICAgICAgICAgICAgICAgICAgIGlmICggYnl0ZXBvcyA+PSAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGxiaXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsYml0c1sxXSA9IGJ5dGVwb3MrMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGxiaXRzWzBdID0gKDE8PChieXRlcG9zKzEpKS0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCaXRzKGZpbGxiaXRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB3cml0ZVdvcmQoMHhGRkQ5KTsgLy9FT0lcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpwZWdEYXRhVXJpID0gJ2RhdGE6aW1hZ2UvanBlZztiYXNlNjQsJyArIGJ0b2EoYnl0ZW91dC5qb2luKCcnKSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVvdXQgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gYmVuY2htYXJraW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhciBkdXJhdGlvbiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gdGltZV9zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0VuY29kaW5nIHRpbWU6ICcrIGN1cnJlbnRRdWFsaXR5ICsgJ21zJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqcGVnRGF0YVVyaVxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gc2V0UXVhbGl0eShxdWFsaXR5KXtcbiAgICAgICAgICAgICAgICBpZiAocXVhbGl0eSA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1YWxpdHkgPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocXVhbGl0eSA+IDEwMCkge1xuICAgICAgICAgICAgICAgICAgICBxdWFsaXR5ID0gMTAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBpZihjdXJyZW50UXVhbGl0eSA9PSBxdWFsaXR5KSByZXR1cm4gLy8gZG9uJ3QgcmVjYWxjIGlmIHVuY2hhbmdlZFxuICAgIFxuICAgICAgICAgICAgICAgIHZhciBzZiA9IDA7XG4gICAgICAgICAgICAgICAgaWYgKHF1YWxpdHkgPCA1MCkge1xuICAgICAgICAgICAgICAgICAgICBzZiA9IE1hdGguZmxvb3IoNTAwMCAvIHF1YWxpdHkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNmID0gTWF0aC5mbG9vcigyMDAgLSBxdWFsaXR5KjIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBpbml0UXVhbnRUYWJsZXMoc2YpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWFsaXR5ID0gcXVhbGl0eTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUXVhbGl0eSBzZXQgdG86ICcrcXVhbGl0eSArJyUnKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQoKXtcbiAgICAgICAgICAgICAgICAvLyB2YXIgdGltZV9zdGFydCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIGlmKCFxdWFsaXR5KSBxdWFsaXR5ID0gNTA7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRhYmxlc1xuICAgICAgICAgICAgICAgIGluaXRDaGFyTG9va3VwVGFibGUoKVxuICAgICAgICAgICAgICAgIGluaXRIdWZmbWFuVGJsKCk7XG4gICAgICAgICAgICAgICAgaW5pdENhdGVnb3J5TnVtYmVyKCk7XG4gICAgICAgICAgICAgICAgaW5pdFJHQllVVlRhYmxlKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgc2V0UXVhbGl0eShxdWFsaXR5KTtcbiAgICAgICAgICAgICAgICAvLyB2YXIgZHVyYXRpb24gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRpbWVfc3RhcnQ7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0luaXRpYWxpemF0aW9uICcrIGR1cmF0aW9uICsgJ21zJyk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBpbml0KCk7XG4gICAgXG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEpQRUdFbmNvZGVyLmVuY29kZSA9IGZ1bmN0aW9uKCBkYXRhLCBxdWFsaXR5ICkge1xuICAgICAgICAgICAgdmFyIGVuY29kZXIgPSBuZXcgSlBFR0VuY29kZXIoIHF1YWxpdHkgKTtcbiAgICBcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVyLmVuY29kZSggZGF0YSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBKUEVHRW5jb2RlcjtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEZpeCBhbmRyb2lkIGNhbnZhcy50b0RhdGFVcmwgYnVnLlxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9hbmRyb2lkcGF0Y2gnLFtcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvdXRpbCcsXG4gICAgICAgICdydW50aW1lL2h0bWw1L2pwZWdlbmNvZGVyJyxcbiAgICAgICAgJ2Jhc2UnXG4gICAgXSwgZnVuY3Rpb24oIFV0aWwsIGVuY29kZXIsIEJhc2UgKSB7XG4gICAgICAgIHZhciBvcmlnaW4gPSBVdGlsLmNhbnZhc1RvRGF0YVVybCxcbiAgICAgICAgICAgIHN1cHBvcnRKcGVnO1xuICAgIFxuICAgICAgICBVdGlsLmNhbnZhc1RvRGF0YVVybCA9IGZ1bmN0aW9uKCBjYW52YXMsIHR5cGUsIHF1YWxpdHkgKSB7XG4gICAgICAgICAgICB2YXIgY3R4LCB3LCBoLCBmcmFnZW1lbnQsIHBhcnRzO1xuICAgIFxuICAgICAgICAgICAgLy8g6Z2eYW5kcm9pZOaJi+acuuebtOaOpei3s+i/h+OAglxuICAgICAgICAgICAgaWYgKCAhQmFzZS5vcy5hbmRyb2lkICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW4uYXBwbHkoIG51bGwsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8g5qOA5rWL5piv5ZCmY2FudmFz5pSv5oyBanBlZ+WvvOWHuu+8jOagueaNruaVsOaNruagvOW8j+adpeWIpOaWreOAglxuICAgICAgICAgICAgLy8gSlBFRyDliY3kuKTkvY3liIbliKvmmK/vvJoyNTUsIDIxNlxuICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnaW1hZ2UvanBlZycgJiYgdHlwZW9mIHN1cHBvcnRKcGVnID09PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgICAgICAgICBmcmFnZW1lbnQgPSBvcmlnaW4uYXBwbHkoIG51bGwsIGFyZ3VtZW50cyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhcnRzID0gZnJhZ2VtZW50LnNwbGl0KCcsJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB+cGFydHNbIDAgXS5pbmRleE9mKCdiYXNlNjQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ2VtZW50ID0gYXRvYiggcGFydHNbIDEgXSApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZyYWdlbWVudCA9IGRlY29kZVVSSUNvbXBvbmVudCggcGFydHNbIDEgXSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmcmFnZW1lbnQgPSBmcmFnZW1lbnQuc3Vic3RyaW5nKCAwLCAyICk7XG4gICAgXG4gICAgICAgICAgICAgICAgc3VwcG9ydEpwZWcgPSBmcmFnZW1lbnQuY2hhckNvZGVBdCggMCApID09PSAyNTUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdlbWVudC5jaGFyQ29kZUF0KCAxICkgPT09IDIxNjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIOWPquacieWcqGFuZHJvaWTnjq/looPkuIvmiY3kv67lpI1cbiAgICAgICAgICAgIGlmICggdHlwZSA9PT0gJ2ltYWdlL2pwZWcnICYmICFzdXBwb3J0SnBlZyApIHtcbiAgICAgICAgICAgICAgICB3ID0gY2FudmFzLndpZHRoO1xuICAgICAgICAgICAgICAgIGggPSBjYW52YXMuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBlbmNvZGVyLmVuY29kZSggY3R4LmdldEltYWdlRGF0YSggMCwgMCwgdywgaCApLCBxdWFsaXR5ICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luLmFwcGx5KCBudWxsLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEltYWdlXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2ltYWdlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvcnVudGltZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3V0aWwnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEh0bWw1UnVudGltZSwgVXRpbCApIHtcbiAgICBcbiAgICAgICAgdmFyIEJMQU5LID0gJ2RhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBQUQvQUN3QUFBQUFBUUFCQUFBQ0FEcyUzRCc7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdJbWFnZScsIHtcbiAgICBcbiAgICAgICAgICAgIC8vIGZsYWc6IOagh+iusOaYr+WQpuiiq+S/ruaUuei/h+OAglxuICAgICAgICAgICAgbW9kaWZpZWQ6IGZhbHNlLFxuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBtZS5faW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IG1lLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g6K+75Y+WbWV0YeS/oeaBr+OAglxuICAgICAgICAgICAgICAgICAgICBpZiAoICFtZS5fbWV0YXMgJiYgJ2ltYWdlL2pwZWcnID09PSBtZS50eXBlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVXRpbC5wYXJzZU1ldGEoIG1lLl9ibG9iLCBmdW5jdGlvbiggZXJyb3IsIHJldCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5fbWV0YXMgPSByZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlcignbG9hZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCdsb2FkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5faW1nID0gaW1nO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGxvYWRGcm9tQmxvYjogZnVuY3Rpb24oIGJsb2IgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgaW1nID0gbWUuX2ltZztcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5fYmxvYiA9IGJsb2I7XG4gICAgICAgICAgICAgICAgbWUudHlwZSA9IGJsb2IudHlwZTtcbiAgICAgICAgICAgICAgICBpbWcuc3JjID0gVXRpbC5jcmVhdGVPYmplY3RVUkwoIGJsb2IuZ2V0U291cmNlKCkgKTtcbiAgICAgICAgICAgICAgICBtZS5vd25lci5vbmNlKCAnbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBVdGlsLnJldm9rZU9iamVjdFVSTCggaW1nLnNyYyApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oIHdpZHRoLCBoZWlnaHQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMuX2NhbnZhcyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMuX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemUoIHRoaXMuX2ltZywgY2FudmFzLCB3aWR0aCwgaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmxvYiA9IG51bGw7ICAgIC8vIOayoeeUqOS6hu+8jOWPr+S7peWIoOaOieS6huOAglxuICAgICAgICAgICAgICAgIHRoaXMubW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMub3duZXIudHJpZ2dlcignY29tcGxldGUnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRBc0Jsb2I6IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgIHZhciBibG9iID0gdGhpcy5fYmxvYixcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzO1xuICAgIFxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IHRoaXMudHlwZTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBibG9i6ZyA6KaB6YeN5paw55Sf5oiQ44CCXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLm1vZGlmaWVkIHx8IHRoaXMudHlwZSAhPT0gdHlwZSApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzID0gdGhpcy5fY2FudmFzO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGUgPT09ICdpbWFnZS9qcGVnJyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2IgPSBVdGlsLmNhbnZhc1RvRGF0YVVybCggY2FudmFzLCAnaW1hZ2UvanBlZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMucXVhbGl0eSApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBvcHRzLnByZXNlcnZlSGVhZGVycyAmJiB0aGlzLl9tZXRhcyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXRhcy5pbWFnZUhlYWQgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvYiA9IFV0aWwuZGF0YVVSTDJBcnJheUJ1ZmZlciggYmxvYiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2IgPSBVdGlsLnVwZGF0ZUltYWdlSGVhZCggYmxvYixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21ldGFzLmltYWdlSGVhZCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2IgPSBVdGlsLmFycmF5QnVmZmVyVG9CbG9iKCBibG9iLCB0eXBlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJsb2I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9iID0gVXRpbC5jYW52YXNUb0RhdGFVcmwoIGNhbnZhcywgdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGJsb2IgPSBVdGlsLmRhdGFVUkwyQmxvYiggYmxvYiApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gYmxvYjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRBc0RhdGFVcmw6IGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IHRoaXMudHlwZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGUgPT09ICdpbWFnZS9qcGVnJyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFV0aWwuY2FudmFzVG9EYXRhVXJsKCB0aGlzLl9jYW52YXMsIHR5cGUsIG9wdHMucXVhbGl0eSApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYW52YXMudG9EYXRhVVJMKCB0eXBlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldE9yaWVudGF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWV0YXMgJiYgdGhpcy5fbWV0YXMuZXhpZiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWV0YXMuZXhpZi5nZXQoJ09yaWVudGF0aW9uJykgfHwgMTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBpbmZvOiBmdW5jdGlvbiggdmFsICkge1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIHNldHRlclxuICAgICAgICAgICAgICAgIGlmICggdmFsICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmZvID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZ2V0dGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luZm87XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgbWV0YTogZnVuY3Rpb24oIHZhbCApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWV0YSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGdldHRlclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZXRhO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSB0aGlzLl9jYW52YXM7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1nLm9ubG9hZCA9IG51bGw7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBjYW52YXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNsZWFyUmVjdCggMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYW52YXMgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDph4rmlL7lhoXlrZjjgILpnZ7luLjph43opoHvvIzlkKbliJnph4rmlL7kuI3kuoZpbWFnZeeahOWGheWtmOOAglxuICAgICAgICAgICAgICAgIHRoaXMuX2ltZy5zcmMgPSBCTEFOSztcbiAgICAgICAgICAgICAgICB0aGlzLl9pbWcgPSB0aGlzLl9ibG9iID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfcmVzaXplOiBmdW5jdGlvbiggaW1nLCBjdnMsIHdpZHRoLCBoZWlnaHQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMgPSB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIG5hdHVyYWxXaWR0aCA9IGltZy53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgbmF0dXJhbEhlaWdodCA9IGltZy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uID0gdGhpcy5nZXRPcmllbnRhdGlvbigpLFxuICAgICAgICAgICAgICAgICAgICBzY2FsZSwgdywgaCwgeCwgeTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyB2YWx1ZXMgdGhhdCByZXF1aXJlIDkwIGRlZ3JlZSByb3RhdGlvblxuICAgICAgICAgICAgICAgIGlmICggflsgNSwgNiwgNywgOCBdLmluZGV4T2YoIG9yaWVudGF0aW9uICkgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOS6pOaNondpZHRoLCBoZWlnaHTnmoTlgLzjgIJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggXj0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgXj0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIF49IGhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgc2NhbGUgPSBNYXRoWyBvcHRzLmNyb3AgPyAnbWF4JyA6ICdtaW4nIF0oIHdpZHRoIC8gbmF0dXJhbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IC8gbmF0dXJhbEhlaWdodCApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOS4jeWFgeiuuOaUvuWkp+OAglxuICAgICAgICAgICAgICAgIG9wdHMuYWxsb3dNYWduaWZ5IHx8IChzY2FsZSA9IE1hdGgubWluKCAxLCBzY2FsZSApKTtcbiAgICBcbiAgICAgICAgICAgICAgICB3ID0gbmF0dXJhbFdpZHRoICogc2NhbGU7XG4gICAgICAgICAgICAgICAgaCA9IG5hdHVyYWxIZWlnaHQgKiBzY2FsZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuY3JvcCApIHtcbiAgICAgICAgICAgICAgICAgICAgY3ZzLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGN2cy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3ZzLndpZHRoID0gdztcbiAgICAgICAgICAgICAgICAgICAgY3ZzLmhlaWdodCA9IGg7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHggPSAoY3ZzLndpZHRoIC0gdykgLyAyO1xuICAgICAgICAgICAgICAgIHkgPSAoY3ZzLmhlaWdodCAtIGgpIC8gMjtcbiAgICBcbiAgICAgICAgICAgICAgICBvcHRzLnByZXNlcnZlSGVhZGVycyB8fCB0aGlzLl9yb3RhdGUyT3JpZW50YWlvbiggY3ZzLCBvcmllbnRhdGlvbiApO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlckltYWdlVG9DYW52YXMoIGN2cywgaW1nLCB4LCB5LCB3LCBoICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3JvdGF0ZTJPcmllbnRhaW9uOiBmdW5jdGlvbiggY2FudmFzLCBvcmllbnRhdGlvbiApIHtcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSBjYW52YXMud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IGNhbnZhcy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIFxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIG9yaWVudGF0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgc3dpdGNoICggb3JpZW50YXRpb24gKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjogICAgLy8gaG9yaXpvbnRhbCBmbGlwXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKCB3aWR0aCwgMCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnNjYWxlKCAtMSwgMSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogICAgLy8gMTgwIHJvdGF0ZSBsZWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKCB3aWR0aCwgaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKCBNYXRoLlBJICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiAgICAvLyB2ZXJ0aWNhbCBmbGlwXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKCAwLCBoZWlnaHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZSggMSwgLTEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDU6ICAgIC8vIHZlcnRpY2FsIGZsaXAgKyA5MCByb3RhdGUgcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoIDAuNSAqIE1hdGguUEkgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zY2FsZSggMSwgLTEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDY6ICAgIC8vIDkwIHJvdGF0ZSByaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSggMC41ICogTWF0aC5QSSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggMCwgLWhlaWdodCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNzogICAgLy8gaG9yaXpvbnRhbCBmbGlwICsgOTAgcm90YXRlIHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKCAwLjUgKiBNYXRoLlBJICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKCB3aWR0aCwgLWhlaWdodCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnNjYWxlKCAtMSwgMSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgODogICAgLy8gOTAgcm90YXRlIGxlZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoIC0wLjUgKiBNYXRoLlBJICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKCAtd2lkdGgsIDAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vc3RvbWl0YS9pb3MtaW1hZ2VmaWxlLW1lZ2FwaXhlbC9cbiAgICAgICAgICAgIC8vIGJsb2IvbWFzdGVyL3NyYy9tZWdhcGl4LWltYWdlLmpzXG4gICAgICAgICAgICBfcmVuZGVySW1hZ2VUb0NhbnZhczogKGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOS4jeaYr2lvcywg5LiN6ZyA6KaB6L+Z5LmI5aSN5p2C77yBXG4gICAgICAgICAgICAgICAgaWYgKCAhQmFzZS5vcy5pb3MgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiggY2FudmFzLCBpbWcsIHgsIHksIHcsIGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoIGltZywgeCwgeSwgdywgaCApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBEZXRlY3RpbmcgdmVydGljYWwgc3F1YXNoIGluIGxvYWRlZCBpbWFnZS5cbiAgICAgICAgICAgICAgICAgKiBGaXhlcyBhIGJ1ZyB3aGljaCBzcXVhc2ggaW1hZ2UgdmVydGljYWxseSB3aGlsZSBkcmF3aW5nIGludG9cbiAgICAgICAgICAgICAgICAgKiBjYW52YXMgZm9yIHNvbWUgaW1hZ2VzLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGRldGVjdFZlcnRpY2FsU3F1YXNoKCBpbWcsIGl3LCBpaCApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBzeSA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBleSA9IGloLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHkgPSBpaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEsIGFscGhhLCByYXRpbztcbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gMTtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGloO1xuICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKCBpbWcsIDAsIDAgKTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IGN0eC5nZXRJbWFnZURhdGEoIDAsIDAsIDEsIGloICkuZGF0YTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VhcmNoIGltYWdlIGVkZ2UgcGl4ZWwgcG9zaXRpb24gaW4gY2FzZVxuICAgICAgICAgICAgICAgICAgICAvLyBpdCBpcyBzcXVhc2hlZCB2ZXJ0aWNhbGx5LlxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIHB5ID4gc3kgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbHBoYSA9IGRhdGFbIChweSAtIDEpICogNCArIDMgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYWxwaGEgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXkgPSBweTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3kgPSBweTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHB5ID0gKGV5ICsgc3kpID4+IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmF0aW8gPSAocHkgLyBpaCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAocmF0aW8gPT09IDApID8gMSA6IHJhdGlvO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBmaXggaWU3IGJ1Z1xuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTE5MjkwOTkvXG4gICAgICAgICAgICAgICAgLy8gaHRtbDUtY2FudmFzLWRyYXdpbWFnZS1yYXRpby1idWctaW9zXG4gICAgICAgICAgICAgICAgaWYgKCBCYXNlLm9zLmlvcyA+PSA3ICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGNhbnZhcywgaW1nLCB4LCB5LCB3LCBoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl3ID0gaW1nLm5hdHVyYWxXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpaCA9IGltZy5uYXR1cmFsSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnRTcXVhc2hSYXRpbyA9IGRldGVjdFZlcnRpY2FsU3F1YXNoKCBpbWcsIGl3LCBpaCApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLmRyYXdJbWFnZSggaW1nLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl3ICogdmVydFNxdWFzaFJhdGlvLCBpaCAqIHZlcnRTcXVhc2hSYXRpbyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4LCB5LCB3LCBoICk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIERldGVjdCBzdWJzYW1wbGluZyBpbiBsb2FkZWQgaW1hZ2UuXG4gICAgICAgICAgICAgICAgICogSW4gaU9TLCBsYXJnZXIgaW1hZ2VzIHRoYW4gMk0gcGl4ZWxzIG1heSBiZVxuICAgICAgICAgICAgICAgICAqIHN1YnNhbXBsZWQgaW4gcmVuZGVyaW5nLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGRldGVjdFN1YnNhbXBsaW5nKCBpbWcgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdyA9IGltZy5uYXR1cmFsV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBpaCA9IGltZy5uYXR1cmFsSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLCBjdHg7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIHN1YnNhbXBsaW5nIG1heSBoYXBwZW4gb3Zlcm1lZ2FwaXhlbCBpbWFnZVxuICAgICAgICAgICAgICAgICAgICBpZiAoIGl3ICogaWggPiAxMDI0ICogMTAyNCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoIGltZywgLWl3ICsgMSwgMCApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3Vic2FtcGxlZCBpbWFnZSBiZWNvbWVzIGhhbGYgc21hbGxlciBpbiByZW5kZXJpbmcgc2l6ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGFscGhhIGNoYW5uZWwgdmFsdWUgdG8gY29uZmlybSBpbWFnZSBpcyBjb3ZlcmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWRnZSBwaXhlbCBvciBub3QuIGlmIGFscGhhIHZhbHVlIGlzIDBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGltYWdlIGlzIG5vdCBjb3ZlcmluZywgaGVuY2Ugc3Vic2FtcGxlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHguZ2V0SW1hZ2VEYXRhKCAwLCAwLCAxLCAxICkuZGF0YVsgMyBdID09PSAwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiggY2FudmFzLCBpbWcsIHgsIHksIHdpZHRoLCBoZWlnaHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdyA9IGltZy5uYXR1cmFsV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBpaCA9IGltZy5uYXR1cmFsSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzYW1wbGVkID0gZGV0ZWN0U3Vic2FtcGxpbmcoIGltZyApLFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9TcXVhc2ggPSB0aGlzLnR5cGUgPT09ICdpbWFnZS9qcGVnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSAxMDI0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3kgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZHkgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdG1wQ2FudmFzLCB0bXBDdHgsIHZlcnRTcXVhc2hSYXRpbywgZHcsIGRoLCBzeCwgZHg7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggc3Vic2FtcGxlZCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl3IC89IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBpaCAvPSAyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgICAgICB0bXBDYW52YXMud2lkdGggPSB0bXBDYW52YXMuaGVpZ2h0ID0gZDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdG1wQ3R4ID0gdG1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgIHZlcnRTcXVhc2hSYXRpbyA9IGRvU3F1YXNoID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRlY3RWZXJ0aWNhbFNxdWFzaCggaW1nLCBpdywgaWggKSA6IDE7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGR3ID0gTWF0aC5jZWlsKCBkICogd2lkdGggLyBpdyApO1xuICAgICAgICAgICAgICAgICAgICBkaCA9IE1hdGguY2VpbCggZCAqIGhlaWdodCAvIGloIC8gdmVydFNxdWFzaFJhdGlvICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICggc3kgPCBpaCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICggc3ggPCBpdyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bXBDdHguY2xlYXJSZWN0KCAwLCAwLCBkLCBkICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG1wQ3R4LmRyYXdJbWFnZSggaW1nLCAtc3gsIC1zeSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoIHRtcENhbnZhcywgMCwgMCwgZCwgZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggKyBkeCwgeSArIGR5LCBkdywgZGggKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeCArPSBkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ICs9IGR3O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3kgKz0gZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5ICs9IGRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRtcENhbnZhcyA9IHRtcEN0eCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKClcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBUcmFuc3BvcnRcbiAgICAgKiBAdG9kbyDmlK/mjIFjaHVua2Vk5Lyg6L6T77yM5LyY5Yq/77yaXG4gICAgICog5Y+v5Lul5bCG5aSn5paH5Lu25YiG5oiQ5bCP5Z2X77yM5oyo5Liq5Lyg6L6T77yM5Y+v5Lul5o+Q6auY5aSn5paH5Lu25oiQ5Yqf546H77yM5b2T5aSx6LSl55qE5pe25YCZ77yM5Lmf5Y+q6ZyA6KaB6YeN5Lyg6YKj5bCP6YOo5YiG77yMXG4gICAgICog6ICM5LiN6ZyA6KaB6YeN5aS05YaN5Lyg5LiA5qyh44CC5Y+m5aSW5pat54K557ut5Lyg5Lmf6ZyA6KaB55SoY2h1bmtlZOaWueW8j+OAglxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS90cmFuc3BvcnQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9odG1sNS9ydW50aW1lJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBIdG1sNVJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIHZhciBub29wID0gQmFzZS5ub29wLFxuICAgICAgICAgICAgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ1RyYW5zcG9ydCcsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzcG9uc2UgPSBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHNlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBvd25lciA9IHRoaXMub3duZXIsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHhociA9IHRoaXMuX2luaXRBamF4KCksXG4gICAgICAgICAgICAgICAgICAgIGJsb2IgPSBvd25lci5fYmxvYixcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyID0gb3B0cy5zZXJ2ZXIsXG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhLCBiaW5hcnksIGZyO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5zZW5kQXNCaW5hcnkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlcnZlciArPSAoL1xcPy8udGVzdCggc2VydmVyICkgPyAnJicgOiAnPycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnBhcmFtKCBvd25lci5fZm9ybURhdGEgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgYmluYXJ5ID0gYmxvYi5nZXRTb3VyY2UoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goIG93bmVyLl9mb3JtRGF0YSwgZnVuY3Rpb24oIGssIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoIGssIHYgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZCggb3B0cy5maWxlVmFsLCBibG9iLmdldFNvdXJjZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZmlsZW5hbWUgfHwgb3duZXIuX2Zvcm1EYXRhLm5hbWUgfHwgJycgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLndpdGhDcmVkZW50aWFscyAmJiAnd2l0aENyZWRlbnRpYWxzJyBpbiB4aHIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5vcGVuKCBvcHRzLm1ldGhvZCwgc2VydmVyLCB0cnVlICk7XG4gICAgICAgICAgICAgICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5vcGVuKCBvcHRzLm1ldGhvZCwgc2VydmVyICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFJlcXVlc3RIZWFkZXIoIHhociwgb3B0cy5oZWFkZXJzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBiaW5hcnkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5vdmVycmlkZU1pbWVUeXBlKCdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5kcm9pZOebtOaOpeWPkemAgWJsb2LkvJrlr7zoh7TmnI3liqHnq6/mjqXmlLbliLDnmoTmmK/nqbrmlofku7bjgIJcbiAgICAgICAgICAgICAgICAgICAgLy8gYnVn6K+m5oOF44CCXG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvYW5kcm9pZC9pc3N1ZXMvZGV0YWlsP2lkPTM5ODgyXG4gICAgICAgICAgICAgICAgICAgIC8vIOaJgOS7peWFiOeUqGZpbGVSZWFkZXLor7vlj5blh7rmnaXlho3pgJrov4dhcnJheWJ1ZmZlcueahOaWueW8j+WPkemAgeOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoIEJhc2Uub3MuYW5kcm9pZCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhoci5zZW5kKCB0aGlzLnJlc3VsdCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyID0gZnIub25sb2FkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmci5yZWFkQXNBcnJheUJ1ZmZlciggYmluYXJ5ICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2VuZCggYmluYXJ5ICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2VuZCggZm9ybURhdGEgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZXNwb25zZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRSZXNwb25zZUFzSnNvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcnNlSnNvbiggdGhpcy5fcmVzcG9uc2UgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgYWJvcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciB4aHIgPSB0aGlzLl94aHI7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB4aHIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IG5vb3A7XG4gICAgICAgICAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBub29wO1xuICAgICAgICAgICAgICAgICAgICB4aHIuYWJvcnQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5feGhyID0geGhyID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hYm9ydCgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9pbml0QWpheDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLndpdGhDcmVkZW50aWFscyAmJiAhKCd3aXRoQ3JlZGVudGlhbHMnIGluIHhocikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBYRG9tYWluUmVxdWVzdCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgICAgICAgICAgICAgIHhociA9IG5ldyBYRG9tYWluUmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiggZSApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnRhZ2UgPSAwO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGUubGVuZ3RoQ29tcHV0YWJsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2UgPSBlLmxvYWRlZCAvIGUudG90YWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdwcm9ncmVzcycsIHBlcmNlbnRhZ2UgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB4aHIucmVhZHlTdGF0ZSAhPT0gNCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBub29wO1xuICAgICAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gbm9vcDtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3hociA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIG1lLl9zdGF0dXMgPSB4aHIuc3RhdHVzO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcmVzcG9uc2UgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoJ2xvYWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICggeGhyLnN0YXR1cyA+PSA1MDAgJiYgeGhyLnN0YXR1cyA8IDYwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9yZXNwb25zZSA9IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUudHJpZ2dlciggJ2Vycm9yJywgJ3NlcnZlcicgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUudHJpZ2dlciggJ2Vycm9yJywgbWUuX3N0YXR1cyA/ICdodHRwJyA6ICdhYm9ydCcgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLl94aHIgPSB4aHI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfc2V0UmVxdWVzdEhlYWRlcjogZnVuY3Rpb24oIHhociwgaGVhZGVycyApIHtcbiAgICAgICAgICAgICAgICAkLmVhY2goIGhlYWRlcnMsIGZ1bmN0aW9uKCBrZXksIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoIGtleSwgdmFsICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3BhcnNlSnNvbjogZnVuY3Rpb24oIHN0ciApIHtcbiAgICAgICAgICAgICAgICB2YXIganNvbjtcbiAgICBcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZSggc3RyICk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoIGV4ICkge1xuICAgICAgICAgICAgICAgICAgICBqc29uID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEZsYXNoUnVudGltZVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9mbGFzaC9ydW50aW1lJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZScsXG4gICAgICAgICdydW50aW1lL2NvbXBiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lLCBDb21wQmFzZSApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICB0eXBlID0gJ2ZsYXNoJyxcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSB7fTtcbiAgICBcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gZ2V0Rmxhc2hWZXJzaW9uKCkge1xuICAgICAgICAgICAgdmFyIHZlcnNpb247XG4gICAgXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZlcnNpb24gPSBuYXZpZ2F0b3IucGx1Z2luc1sgJ1Nob2Nrd2F2ZSBGbGFzaCcgXTtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uID0gdmVyc2lvbi5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKCBleCApIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uID0gbmV3IEFjdGl2ZVhPYmplY3QoJ1Nob2Nrd2F2ZUZsYXNoLlNob2Nrd2F2ZUZsYXNoJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuR2V0VmFyaWFibGUoJyR2ZXJzaW9uJyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoIGV4MiApIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbiA9ICcwLjAnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZlcnNpb24gPSB2ZXJzaW9uLm1hdGNoKCAvXFxkKy9nICk7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCggdmVyc2lvblsgMCBdICsgJy4nICsgdmVyc2lvblsgMSBdLCAxMCApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIEZsYXNoUnVudGltZSgpIHtcbiAgICAgICAgICAgIHZhciBwb29sID0ge30sXG4gICAgICAgICAgICAgICAgY2xpZW50cyA9IHt9LFxuICAgICAgICAgICAgICAgIGRlc3RvcnkgPSB0aGlzLmRlc3RvcnksXG4gICAgICAgICAgICAgICAgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgIGpzcmVjaXZlciA9IEJhc2UuZ3VpZCgnd2VidXBsb2FkZXJfJyk7XG4gICAgXG4gICAgICAgICAgICBSdW50aW1lLmFwcGx5KCBtZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICBtZS50eXBlID0gdHlwZTtcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8vIOi/meS4quaWueazleeahOiwg+eUqOiAhe+8jOWunumZheS4iuaYr1J1bnRpbWVDbGllbnRcbiAgICAgICAgICAgIG1lLmV4ZWMgPSBmdW5jdGlvbiggY29tcCwgZm4vKiwgYXJncy4uLiovICkge1xuICAgICAgICAgICAgICAgIHZhciBjbGllbnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB1aWQgPSBjbGllbnQudWlkLFxuICAgICAgICAgICAgICAgICAgICBhcmdzID0gQmFzZS5zbGljZSggYXJndW1lbnRzLCAyICksXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGNsaWVudHNbIHVpZCBdID0gY2xpZW50O1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY29tcG9uZW50c1sgY29tcCBdICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICFwb29sWyB1aWQgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvb2xbIHVpZCBdID0gbmV3IGNvbXBvbmVudHNbIGNvbXAgXSggY2xpZW50LCBtZSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlID0gcG9vbFsgdWlkIF07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5zdGFuY2VbIGZuIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VbIGZuIF0uYXBwbHkoIGluc3RhbmNlLCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lLmZsYXNoRXhlYy5hcHBseSggY2xpZW50LCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVyKCBldnQsIG9iaiApIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IGV2dC50eXBlIHx8IGV2dCxcbiAgICAgICAgICAgICAgICAgICAgcGFydHMsIHVpZDtcbiAgICBcbiAgICAgICAgICAgICAgICBwYXJ0cyA9IHR5cGUuc3BsaXQoJzo6Jyk7XG4gICAgICAgICAgICAgICAgdWlkID0gcGFydHNbIDAgXTtcbiAgICAgICAgICAgICAgICB0eXBlID0gcGFydHNbIDEgXTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZy5hcHBseSggY29uc29sZSwgYXJndW1lbnRzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnUmVhZHknICYmIHVpZCA9PT0gbWUudWlkICkge1xuICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGNsaWVudHNbIHVpZCBdICkge1xuICAgICAgICAgICAgICAgICAgICBjbGllbnRzWyB1aWQgXS50cmlnZ2VyKCB0eXBlLnRvTG93ZXJDYXNlKCksIGV2dCwgb2JqICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIEJhc2UubG9nKCBldnQsIG9iaiApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgLy8gZmxhc2jnmoTmjqXlj5flmajjgIJcbiAgICAgICAgICAgIHdpbmRvd1sganNyZWNpdmVyIF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuLrkuobog73mjZXojrflvpfliLDjgIJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KCBudWxsLCBhcmdzICk7XG4gICAgICAgICAgICAgICAgfSwgMSApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuanNyZWNpdmVyID0ganNyZWNpdmVyO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5kZXN0b3J5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRvZG8g5Yig6Zmk5rGg5a2Q5Lit55qE5omA5pyJ5a6e5L6LXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlc3RvcnkgJiYgZGVzdG9yeS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5mbGFzaEV4ZWMgPSBmdW5jdGlvbiggY29tcCwgZm4gKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZsYXNoID0gbWUuZ2V0Rmxhc2goKSxcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cywgMiApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBmbGFzaC5leGVjKCB0aGlzLnVpZCwgY29tcCwgZm4sIGFyZ3MgKTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAvLyBAdG9kb1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWUsIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBGbGFzaFJ1bnRpbWUsXG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5nZXRDb250YWluZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgaHRtbDtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBpZiBub3QgdGhlIG1pbmltYWwgaGVpZ2h0LCBzaGltcyBhcmUgbm90IGluaXRpYWxpemVkXG4gICAgICAgICAgICAgICAgLy8gaW4gb2xkZXIgYnJvd3NlcnMgKGUuZyBGRjMuNiwgSUU2LDcsOCwgU2FmYXJpIDQuMCw1LjAsIGV0YylcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogJy04cHgnLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAnLThweCcsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnOXB4JyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnOXB4JyxcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gaW5zZXJ0IGZsYXNoIG9iamVjdFxuICAgICAgICAgICAgICAgIGh0bWwgPSAnPG9iamVjdCBpZD1cIicgKyB0aGlzLnVpZCArICdcIiB0eXBlPVwiYXBwbGljYXRpb24vJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAneC1zaG9ja3dhdmUtZmxhc2hcIiBkYXRhPVwiJyArICBvcHRzLnN3ZiArICdcIiAnO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggQmFzZS5icm93c2VyLmllICkge1xuICAgICAgICAgICAgICAgICAgICBodG1sICs9ICdjbGFzc2lkPVwiY2xzaWQ6ZDI3Y2RiNmUtYWU2ZC0xMWNmLTk2YjgtNDQ0NTUzNTQwMDAwXCIgJztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgaHRtbCArPSAnd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIHN0eWxlPVwib3V0bGluZTowXCI+JyAgK1xuICAgICAgICAgICAgICAgICAgICAnPHBhcmFtIG5hbWU9XCJtb3ZpZVwiIHZhbHVlPVwiJyArIG9wdHMuc3dmICsgJ1wiIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICc8cGFyYW0gbmFtZT1cImZsYXNodmFyc1wiIHZhbHVlPVwidWlkPScgKyB0aGlzLnVpZCArXG4gICAgICAgICAgICAgICAgICAgICcmanNyZWNpdmVyPScgKyB0aGlzLmpzcmVjaXZlciArICdcIiAvPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHBhcmFtIG5hbWU9XCJ3bW9kZVwiIHZhbHVlPVwidHJhbnNwYXJlbnRcIiAvPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHBhcmFtIG5hbWU9XCJhbGxvd3NjcmlwdGFjY2Vzc1wiIHZhbHVlPVwiYWx3YXlzXCIgLz4nICtcbiAgICAgICAgICAgICAgICAnPC9vYmplY3Q+JztcbiAgICBcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaHRtbCggaHRtbCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldEZsYXNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuX2ZsYXNoICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmxhc2g7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuX2ZsYXNoID0gJCggJyMnICsgdGhpcy51aWQgKS5nZXQoIDAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmxhc2g7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBGbGFzaFJ1bnRpbWUucmVnaXN0ZXIgPSBmdW5jdGlvbiggbmFtZSwgY29tcG9uZW50ICkge1xuICAgICAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50c1sgbmFtZSBdID0gQmFzZS5pbmhlcml0cyggQ29tcEJhc2UsICQuZXh0ZW5kKHtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBAdG9kbyBmaXggdGhpcyBsYXRlclxuICAgICAgICAgICAgICAgIGZsYXNoRXhlYzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvd25lciA9IHRoaXMub3duZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lID0gdGhpcy5nZXRSdW50aW1lKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW50aW1lLmZsYXNoRXhlYy5hcHBseSggb3duZXIsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGNvbXBvbmVudCApICk7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gY29tcG9uZW50O1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBpZiAoIGdldEZsYXNoVmVyc2lvbigpID49IDExLjQgKSB7XG4gICAgICAgICAgICBSdW50aW1lLmFkZFJ1bnRpbWUoIHR5cGUsIEZsYXNoUnVudGltZSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBGbGFzaFJ1bnRpbWU7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBGaWxlUGlja2VyXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2ZsYXNoL2ZpbGVwaWNrZXInLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9mbGFzaC9ydW50aW1lJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBGbGFzaFJ1bnRpbWUgKSB7XG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICByZXR1cm4gRmxhc2hSdW50aW1lLnJlZ2lzdGVyKCAnRmlsZVBpY2tlcicsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgICAgIHZhciBjb3B5ID0gJC5leHRlbmQoe30sIG9wdHMgKSxcbiAgICAgICAgICAgICAgICAgICAgbGVuLCBpO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOS/ruWkjUZsYXNo5YaN5rKh5pyJ6K6+572udGl0bGXnmoTmg4XlhrXkuIvml6Dms5XlvLnlh7pmbGFzaOaWh+S7tumAieaLqeahhueahGJ1Zy5cbiAgICAgICAgICAgICAgICBsZW4gPSBjb3B5LmFjY2VwdCAmJiBjb3B5LmFjY2VwdC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yICggIGkgPSAwOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggIWNvcHkuYWNjZXB0WyBpIF0udGl0bGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5LmFjY2VwdFsgaSBdLnRpdGxlID0gJ0ZpbGVzJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBkZWxldGUgY29weS5idXR0b247XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvcHkuY29udGFpbmVyO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZmxhc2hFeGVjKCAnRmlsZVBpY2tlcicsICdpbml0JywgY29weSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIHRvZG9cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDlm77niYfljovnvKlcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvZmxhc2gvaW1hZ2UnLFtcbiAgICAgICAgJ3J1bnRpbWUvZmxhc2gvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggRmxhc2hSdW50aW1lICkge1xuICAgIFxuICAgICAgICByZXR1cm4gRmxhc2hSdW50aW1lLnJlZ2lzdGVyKCAnSW1hZ2UnLCB7XG4gICAgICAgICAgICAvLyBpbml0OiBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgICAgICAgICAgIC8vICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyO1xuICAgIFxuICAgICAgICAgICAgLy8gICAgIHRoaXMuZmxhc2hFeGVjKCAnSW1hZ2UnLCAnaW5pdCcsIG9wdGlvbnMgKTtcbiAgICAgICAgICAgIC8vICAgICBvd25lci5vbiggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgICAgICAvLyB9LFxuICAgIFxuICAgICAgICAgICAgbG9hZEZyb21CbG9iOiBmdW5jdGlvbiggYmxvYiApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyO1xuICAgIFxuICAgICAgICAgICAgICAgIG93bmVyLmluZm8oKSAmJiB0aGlzLmZsYXNoRXhlYyggJ0ltYWdlJywgJ2luZm8nLCBvd25lci5pbmZvKCkgKTtcbiAgICAgICAgICAgICAgICBvd25lci5tZXRhKCkgJiYgdGhpcy5mbGFzaEV4ZWMoICdJbWFnZScsICdtZXRhJywgb3duZXIubWV0YSgpICk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGhpcy5mbGFzaEV4ZWMoICdJbWFnZScsICdsb2FkRnJvbUJsb2InLCBibG9iLnVpZCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3ICBUcmFuc3BvcnQgZmxhc2jlrp7njrBcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvZmxhc2gvdHJhbnNwb3J0JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvZmxhc2gvcnVudGltZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgRmxhc2hSdW50aW1lLCBSdW50aW1lQ2xpZW50ICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgcmV0dXJuIEZsYXNoUnVudGltZS5yZWdpc3RlciggJ1RyYW5zcG9ydCcsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzcG9uc2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3BvbnNlSnNvbiA9IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgc2VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG93bmVyID0gdGhpcy5vd25lcixcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgeGhyID0gdGhpcy5faW5pdEFqYXgoKSxcbiAgICAgICAgICAgICAgICAgICAgYmxvYiA9IG93bmVyLl9ibG9iLFxuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIgPSBvcHRzLnNlcnZlcixcbiAgICAgICAgICAgICAgICAgICAgYmluYXJ5O1xuICAgIFxuICAgICAgICAgICAgICAgIHhoci5jb25uZWN0UnVudGltZSggYmxvYi5ydWlkICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLnNlbmRBc0JpbmFyeSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyICs9ICgvXFw/Ly50ZXN0KCBzZXJ2ZXIgKSA/ICcmJyA6ICc/JykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQucGFyYW0oIG93bmVyLl9mb3JtRGF0YSApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBiaW5hcnkgPSBibG9iLnVpZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goIG93bmVyLl9mb3JtRGF0YSwgZnVuY3Rpb24oIGssIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4aHIuZXhlYyggJ2FwcGVuZCcsIGssIHYgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHhoci5leGVjKCAnYXBwZW5kQmxvYicsIG9wdHMuZmlsZVZhbCwgYmxvYi51aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5maWxlbmFtZSB8fCBvd25lci5fZm9ybURhdGEubmFtZSB8fCAnJyApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRSZXF1ZXN0SGVhZGVyKCB4aHIsIG9wdHMuaGVhZGVycyApO1xuICAgICAgICAgICAgICAgIHhoci5leGVjKCAnc2VuZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBvcHRzLm1ldGhvZCxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzZXJ2ZXJcbiAgICAgICAgICAgICAgICB9LCBiaW5hcnkgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZXNwb25zZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRSZXNwb25zZUFzSnNvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3BvbnNlSnNvbjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBhYm9ydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9IHRoaXMuX3hocjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIHhociApIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmV4ZWMoJ2Fib3J0Jyk7XG4gICAgICAgICAgICAgICAgICAgIHhoci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3hociA9IHhociA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWJvcnQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfaW5pdEFqYXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHhociA9IG5ldyBSdW50aW1lQ2xpZW50KCdYTUxIdHRwUmVxdWVzdCcpO1xuICAgIFxuICAgICAgICAgICAgICAgIHhoci5vbiggJ3VwbG9hZHByb2dyZXNzIHByb2dyZXNzJywgZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS50cmlnZ2VyKCAncHJvZ3Jlc3MnLCBlLmxvYWRlZCAvIGUudG90YWwgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICB4aHIub24oICdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSB4aHIuZXhlYygnZ2V0U3RhdHVzJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgPSAnJztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgeGhyLm9mZigpO1xuICAgICAgICAgICAgICAgICAgICBtZS5feGhyID0gbnVsbDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9yZXNwb25zZSA9IHhoci5leGVjKCdnZXRSZXNwb25zZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Jlc3BvbnNlSnNvbiA9IHhoci5leGVjKCdnZXRSZXNwb25zZUFzSnNvbicpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMgPj0gNTAwICYmIHN0YXR1cyA8IDYwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9yZXNwb25zZSA9IHhoci5leGVjKCdnZXRSZXNwb25zZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Jlc3BvbnNlSnNvbiA9IHhoci5leGVjKCdnZXRSZXNwb25zZUFzSnNvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyID0gJ3NlcnZlcic7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgPSAnaHR0cCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgeGhyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgeGhyID0gbnVsbDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVyciA/IG1lLnRyaWdnZXIoICdlcnJvcicsIGVyciApIDogbWUudHJpZ2dlcignbG9hZCcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHhoci5vbiggJ2Vycm9yJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5vZmYoKTtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3hociA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoICdlcnJvcicsICdodHRwJyApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLl94aHIgPSB4aHI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfc2V0UmVxdWVzdEhlYWRlcjogZnVuY3Rpb24oIHhociwgaGVhZGVycyApIHtcbiAgICAgICAgICAgICAgICAkLmVhY2goIGhlYWRlcnMsIGZ1bmN0aW9uKCBrZXksIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmV4ZWMoICdzZXRSZXF1ZXN0SGVhZGVyJywga2V5LCB2YWwgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDlrozlhajniYjmnKzjgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3ByZXNldC9hbGwnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgIFxuICAgICAgICAvLyB3aWRnZXRzXG4gICAgICAgICd3aWRnZXRzL2ZpbGVkbmQnLFxuICAgICAgICAnd2lkZ2V0cy9maWxlcGFzdGUnLFxuICAgICAgICAnd2lkZ2V0cy9maWxlcGlja2VyJyxcbiAgICAgICAgJ3dpZGdldHMvaW1hZ2UnLFxuICAgICAgICAnd2lkZ2V0cy9xdWV1ZScsXG4gICAgICAgICd3aWRnZXRzL3J1bnRpbWUnLFxuICAgICAgICAnd2lkZ2V0cy91cGxvYWQnLFxuICAgICAgICAnd2lkZ2V0cy92YWxpZGF0b3InLFxuICAgIFxuICAgICAgICAvLyBydW50aW1lc1xuICAgICAgICAvLyBodG1sNVxuICAgICAgICAncnVudGltZS9odG1sNS9ibG9iJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvZG5kJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvZmlsZXBhc3RlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvZmlsZXBpY2tlcicsXG4gICAgICAgICdydW50aW1lL2h0bWw1L2ltYWdlbWV0YS9leGlmJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvYW5kcm9pZHBhdGNoJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvaW1hZ2UnLFxuICAgICAgICAncnVudGltZS9odG1sNS90cmFuc3BvcnQnLFxuICAgIFxuICAgICAgICAvLyBmbGFzaFxuICAgICAgICAncnVudGltZS9mbGFzaC9maWxlcGlja2VyJyxcbiAgICAgICAgJ3J1bnRpbWUvZmxhc2gvaW1hZ2UnLFxuICAgICAgICAncnVudGltZS9mbGFzaC90cmFuc3BvcnQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UgKSB7XG4gICAgICAgIHJldHVybiBCYXNlO1xuICAgIH0pO1xuICAgIGRlZmluZSgnd2VidXBsb2FkZXInLFtcbiAgICAgICAgJ3ByZXNldC9hbGwnXG4gICAgXSwgZnVuY3Rpb24oIHByZXNldCApIHtcbiAgICAgICAgcmV0dXJuIHByZXNldDtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVxdWlyZSgnd2VidXBsb2FkZXInKTtcbn0pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvd2VidXBsb2FkZXIvd2VidXBsb2FkZXIuanMifQ==
