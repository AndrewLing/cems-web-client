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
     * @fileOverview 没有图像处理的版本。
     */
    define('preset/withoutimage',[
        'base',
    
        // widgets
        'widgets/filednd',
        'widgets/filepaste',
        'widgets/filepicker',
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
        'runtime/html5/transport',
    
        // flash
        'runtime/flash/filepicker',
        'runtime/flash/transport'
    ], function( Base ) {
        return Base;
    });
    define('webuploader',[
        'preset/withoutimage'
    ], function( preset ) {
        return preset;
    });
    return require('webuploader');
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvd2VidXBsb2FkZXIvd2VidXBsb2FkZXIud2l0aG91dGltYWdlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISBXZWJVcGxvYWRlciAwLjEuMiAqL1xuXG5cbi8qKlxuICogQGZpbGVPdmVydmlldyDorqnlhoXpg6jlkITkuKrpg6jku7bnmoTku6PnoIHlj6/ku6XnlKhbYW1kXShodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EKeaooeWdl+WumuS5ieaWueW8j+e7hOe7h+i1t+adpeOAglxuICpcbiAqIEFNRCBBUEkg5YaF6YOo55qE566A5Y2V5LiN5a6M5YWo5a6e546w77yM6K+35b+955Wl44CC5Y+q5pyJ5b2TV2ViVXBsb2FkZXLooqvlkIjlubbmiJDkuIDkuKrmlofku7bnmoTml7blgJnmiY3kvJrlvJXlhaXjgIJcbiAqL1xuKGZ1bmN0aW9uKCByb290LCBmYWN0b3J5ICkge1xuICAgIHZhciBtb2R1bGVzID0ge30sXG5cbiAgICAgICAgLy8g5YaF6YOocmVxdWlyZSwg566A5Y2V5LiN5a6M5YWo5a6e546w44CCXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbWRqcy9hbWRqcy1hcGkvd2lraS9yZXF1aXJlXG4gICAgICAgIF9yZXF1aXJlID0gZnVuY3Rpb24oIGRlcHMsIGNhbGxiYWNrICkge1xuICAgICAgICAgICAgdmFyIGFyZ3MsIGxlbiwgaTtcblxuICAgICAgICAgICAgLy8g5aaC5p6cZGVwc+S4jeaYr+aVsOe7hO+8jOWImeebtOaOpei/lOWbnuaMh+Wumm1vZHVsZVxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgZGVwcyA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldE1vZHVsZSggZGVwcyApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yKCBsZW4gPSBkZXBzLmxlbmd0aCwgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKCBnZXRNb2R1bGUoIGRlcHNbIGkgXSApICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KCBudWxsLCBhcmdzICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5YaF6YOoZGVmaW5l77yM5pqC5pe25LiN5pSv5oyB5LiN5oyH5a6aaWQuXG4gICAgICAgIF9kZWZpbmUgPSBmdW5jdGlvbiggaWQsIGRlcHMsIGZhY3RvcnkgKSB7XG4gICAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDIgKSB7XG4gICAgICAgICAgICAgICAgZmFjdG9yeSA9IGRlcHM7XG4gICAgICAgICAgICAgICAgZGVwcyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9yZXF1aXJlKCBkZXBzIHx8IFtdLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRNb2R1bGUoIGlkLCBmYWN0b3J5LCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOiuvue9rm1vZHVsZSwg5YW85a65Q29tbW9uSnPlhpnms5XjgIJcbiAgICAgICAgc2V0TW9kdWxlID0gZnVuY3Rpb24oIGlkLCBmYWN0b3J5LCBhcmdzICkge1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0czogZmFjdG9yeVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmV0dXJuZWQ7XG5cbiAgICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggfHwgKGFyZ3MgPSBbIF9yZXF1aXJlLCBtb2R1bGUuZXhwb3J0cywgbW9kdWxlIF0pO1xuICAgICAgICAgICAgICAgIHJldHVybmVkID0gZmFjdG9yeS5hcHBseSggbnVsbCwgYXJncyApO1xuICAgICAgICAgICAgICAgIHJldHVybmVkICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gcmV0dXJuZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtb2R1bGVzWyBpZCBdID0gbW9kdWxlLmV4cG9ydHM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5qC55o2uaWTojrflj5Ztb2R1bGVcbiAgICAgICAgZ2V0TW9kdWxlID0gZnVuY3Rpb24oIGlkICkge1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZXNbIGlkIF0gfHwgcm9vdFsgaWQgXTtcblxuICAgICAgICAgICAgaWYgKCAhbW9kdWxlICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ2AnICsgaWQgKyAnYCBpcyB1bmRlZmluZWQnICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtb2R1bGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5bCG5omA5pyJbW9kdWxlc++8jOWwhui3r+W+hGlkc+ijheaNouaIkOWvueixoeOAglxuICAgICAgICBleHBvcnRzVG8gPSBmdW5jdGlvbiggb2JqICkge1xuICAgICAgICAgICAgdmFyIGtleSwgaG9zdCwgcGFydHMsIHBhcnQsIGxhc3QsIHVjRmlyc3Q7XG5cbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIGZpcnN0IGNoYXJhY3RlciB1cHBlciBjYXNlLlxuICAgICAgICAgICAgdWNGaXJzdCA9IGZ1bmN0aW9uKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ciAmJiAoc3RyLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyKCAxICkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yICgga2V5IGluIG1vZHVsZXMgKSB7XG4gICAgICAgICAgICAgICAgaG9zdCA9IG9iajtcblxuICAgICAgICAgICAgICAgIGlmICggIW1vZHVsZXMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwYXJ0cyA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIGxhc3QgPSB1Y0ZpcnN0KCBwYXJ0cy5wb3AoKSApO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUoIChwYXJ0ID0gdWNGaXJzdCggcGFydHMuc2hpZnQoKSApKSApIHtcbiAgICAgICAgICAgICAgICAgICAgaG9zdFsgcGFydCBdID0gaG9zdFsgcGFydCBdIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICBob3N0ID0gaG9zdFsgcGFydCBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGhvc3RbIGxhc3QgXSA9IG1vZHVsZXNbIGtleSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV4cG9ydHMgPSBmYWN0b3J5KCByb290LCBfZGVmaW5lLCBfcmVxdWlyZSApLFxuICAgICAgICBvcmlnaW47XG5cbiAgICAvLyBleHBvcnRzIGV2ZXJ5IG1vZHVsZS5cbiAgICBleHBvcnRzVG8oIGV4cG9ydHMgKTtcblxuICAgIGlmICggdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyApIHtcblxuICAgICAgICAvLyBGb3IgQ29tbW9uSlMgYW5kIENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHdoZXJlIGEgcHJvcGVyIHdpbmRvdyBpcyBwcmVzZW50LFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHM7XG4gICAgfSBlbHNlIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuXG4gICAgICAgIC8vIEFsbG93IHVzaW5nIHRoaXMgYnVpbHQgbGlicmFyeSBhcyBhbiBBTUQgbW9kdWxlXG4gICAgICAgIC8vIGluIGFub3RoZXIgcHJvamVjdC4gVGhhdCBvdGhlciBwcm9qZWN0IHdpbGwgb25seVxuICAgICAgICAvLyBzZWUgdGhpcyBBTUQgY2FsbCwgbm90IHRoZSBpbnRlcm5hbCBtb2R1bGVzIGluXG4gICAgICAgIC8vIHRoZSBjbG9zdXJlIGJlbG93LlxuICAgICAgICBkZWZpbmUoW10sIGV4cG9ydHMgKTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFscyBjYXNlLiBKdXN0IGFzc2lnbiB0aGVcbiAgICAgICAgLy8gcmVzdWx0IHRvIGEgcHJvcGVydHkgb24gdGhlIGdsb2JhbC5cbiAgICAgICAgb3JpZ2luID0gcm9vdC5XZWJVcGxvYWRlcjtcbiAgICAgICAgcm9vdC5XZWJVcGxvYWRlciA9IGV4cG9ydHM7XG4gICAgICAgIHJvb3QuV2ViVXBsb2FkZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcm9vdC5XZWJVcGxvYWRlciA9IG9yaWdpbjtcbiAgICAgICAgfTtcbiAgICB9XG59KSggdGhpcywgZnVuY3Rpb24oIHdpbmRvdywgZGVmaW5lLCByZXF1aXJlICkge1xuXG5cbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IGpRdWVyeSBvciBaZXB0b1xuICAgICAqL1xuICAgIGRlZmluZSgnZG9sbGFyLXRoaXJkJyxbXSxmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRG9tIOaTjeS9nOebuOWFs1xuICAgICAqL1xuICAgIGRlZmluZSgnZG9sbGFyJyxbXG4gICAgICAgICdkb2xsYXItdGhpcmQnXG4gICAgXSwgZnVuY3Rpb24oIF8gKSB7XG4gICAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5L2/55SoalF1ZXJ555qEUHJvbWlzZVxuICAgICAqL1xuICAgIGRlZmluZSgncHJvbWlzZS10aGlyZCcsW1xuICAgICAgICAnZG9sbGFyJ1xuICAgIF0sIGZ1bmN0aW9uKCAkICkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgRGVmZXJyZWQ6ICQuRGVmZXJyZWQsXG4gICAgICAgICAgICB3aGVuOiAkLndoZW4sXG4gICAgXG4gICAgICAgICAgICBpc1Byb21pc2U6IGZ1bmN0aW9uKCBhbnl0aGluZyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW55dGhpbmcgJiYgdHlwZW9mIGFueXRoaW5nLnRoZW4gPT09ICdmdW5jdGlvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBQcm9taXNlL0ErXG4gICAgICovXG4gICAgZGVmaW5lKCdwcm9taXNlJyxbXG4gICAgICAgICdwcm9taXNlLXRoaXJkJ1xuICAgIF0sIGZ1bmN0aW9uKCBfICkge1xuICAgICAgICByZXR1cm4gXztcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOWfuuehgOexu+aWueazleOAglxuICAgICAqL1xuICAgIFxuICAgIC8qKlxuICAgICAqIFdlYiBVcGxvYWRlcuWGhemDqOexu+eahOivpue7huivtOaYju+8jOS7peS4i+aPkOWPiueahOWKn+iDveexu++8jOmDveWPr+S7peWcqGBXZWJVcGxvYWRlcmDov5nkuKrlj5jph4/kuK3orr/pl67liLDjgIJcbiAgICAgKlxuICAgICAqIEFzIHlvdSBrbm93LCBXZWIgVXBsb2FkZXLnmoTmr4/kuKrmlofku7bpg73mmK/nlKjov4dbQU1EXShodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EKeinhOiMg+S4reeahGBkZWZpbmVg57uE57uH6LW35p2l55qELCDmr4/kuKpNb2R1bGXpg73kvJrmnInkuKptb2R1bGUgaWQuXG4gICAgICog6buY6K6kbW9kdWxlIGlk6K+l5paH5Lu255qE6Lev5b6E77yM6ICM5q2k6Lev5b6E5bCG5Lya6L2s5YyW5oiQ5ZCN5a2X56m66Ze05a2Y5pS+5ZyoV2ViVXBsb2FkZXLkuK3jgILlpoLvvJpcbiAgICAgKlxuICAgICAqICogbW9kdWxlIGBiYXNlYO+8mldlYlVwbG9hZGVyLkJhc2VcbiAgICAgKiAqIG1vZHVsZSBgZmlsZWA6IFdlYlVwbG9hZGVyLkZpbGVcbiAgICAgKiAqIG1vZHVsZSBgbGliL2RuZGA6IFdlYlVwbG9hZGVyLkxpYi5EbmRcbiAgICAgKiAqIG1vZHVsZSBgcnVudGltZS9odG1sNS9kbmRgOiBXZWJVcGxvYWRlci5SdW50aW1lLkh0bWw1LkRuZFxuICAgICAqXG4gICAgICpcbiAgICAgKiDku6XkuIvmlofmoaPlsIblj6/og73nnIHnlaVgV2ViVXBsb2FkZXJg5YmN57yA44CCXG4gICAgICogQG1vZHVsZSBXZWJVcGxvYWRlclxuICAgICAqIEB0aXRsZSBXZWJVcGxvYWRlciBBUEnmlofmoaNcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2Jhc2UnLFtcbiAgICAgICAgJ2RvbGxhcicsXG4gICAgICAgICdwcm9taXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCAkLCBwcm9taXNlICkge1xuICAgIFxuICAgICAgICB2YXIgbm9vcCA9IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbiAgICBcbiAgICAgICAgLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcbiAgICAgICAgLy8g5Y+N56eR6YeM5YyWXG4gICAgICAgIGZ1bmN0aW9uIHVuY3VycnlUaGlzKCBmbiApIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbC5hcHBseSggZm4sIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBmdW5jdGlvbiBiaW5kRm4oIGZuLCBjb250ZXh0ICkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSggY29udGV4dCwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdCggcHJvdG8gKSB7XG4gICAgICAgICAgICB2YXIgZjtcbiAgICBcbiAgICAgICAgICAgIGlmICggT2JqZWN0LmNyZWF0ZSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZiA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgICAgICAgZi5wcm90b3R5cGUgPSBwcm90bztcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIFxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Z+656GA57G777yM5o+Q5L6b5LiA5Lqb566A5Y2V5bi455So55qE5pa55rOV44CCXG4gICAgICAgICAqIEBjbGFzcyBCYXNlXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4ge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge1N0cmluZ30gdmVyc2lvbiDlvZPliY3niYjmnKzlj7fjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdmVyc2lvbjogJzAuMS4yJyxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtqUXVlcnl8WmVwdG99ICQg5byV55So5L6d6LWW55qEalF1ZXJ55oiW6ICFWmVwdG/lr7nosaHjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJDogJCxcbiAgICBcbiAgICAgICAgICAgIERlZmVycmVkOiBwcm9taXNlLkRlZmVycmVkLFxuICAgIFxuICAgICAgICAgICAgaXNQcm9taXNlOiBwcm9taXNlLmlzUHJvbWlzZSxcbiAgICBcbiAgICAgICAgICAgIHdoZW46IHByb21pc2Uud2hlbixcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uICDnroDljZXnmoTmtY/op4jlmajmo4Dmn6Xnu5PmnpzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGB3ZWJraXRgICB3ZWJraXTniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ53ZWJraXTlhoXmoLjvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgY2hyb21lYCAgY2hyb21l5rWP6KeI5Zmo54mI5pys5Y+377yM5aaC5p6c5rWP6KeI5Zmo5Li6Y2hyb21l77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIJcbiAgICAgICAgICAgICAqICogYGllYCAgaWXmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ5pZe+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCKirmmoLkuI3mlK/mjIFpZTEwKyoqXG4gICAgICAgICAgICAgKiAqIGBmaXJlZm94YCAgZmlyZWZveOa1j+iniOWZqOeJiOacrOWPt++8jOWmguaenOa1j+iniOWZqOS4uumdnmZpcmVmb3jvvIzmraTlsZ7mgKfkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgc2FmYXJpYCAgc2FmYXJp5rWP6KeI5Zmo54mI5pys5Y+377yM5aaC5p6c5rWP6KeI5Zmo5Li66Z2ec2FmYXJp77yM5q2k5bGe5oCn5Li6YHVuZGVmaW5lZGDjgIJcbiAgICAgICAgICAgICAqICogYG9wZXJhYCAgb3BlcmHmtY/op4jlmajniYjmnKzlj7fvvIzlpoLmnpzmtY/op4jlmajkuLrpnZ5vcGVyYe+8jOatpOWxnuaAp+S4umB1bmRlZmluZWRg44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFticm93c2VyXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBicm93c2VyOiAoZnVuY3Rpb24oIHVhICkge1xuICAgICAgICAgICAgICAgIHZhciByZXQgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgd2Via2l0ID0gdWEubWF0Y2goIC9XZWJLaXRcXC8oW1xcZC5dKykvICksXG4gICAgICAgICAgICAgICAgICAgIGNocm9tZSA9IHVhLm1hdGNoKCAvQ2hyb21lXFwvKFtcXGQuXSspLyApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB1YS5tYXRjaCggL0NyaU9TXFwvKFtcXGQuXSspLyApLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZSA9IHVhLm1hdGNoKCAvTVNJRVxccyhbXFxkXFwuXSspLyApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB1YS5tYXRjaCgvKD86dHJpZGVudCkoPzouKnJ2OihbXFx3Ll0rKSk/L2kpLFxuICAgICAgICAgICAgICAgICAgICBmaXJlZm94ID0gdWEubWF0Y2goIC9GaXJlZm94XFwvKFtcXGQuXSspLyApLFxuICAgICAgICAgICAgICAgICAgICBzYWZhcmkgPSB1YS5tYXRjaCggL1NhZmFyaVxcLyhbXFxkLl0rKS8gKSxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmEgPSB1YS5tYXRjaCggL09QUlxcLyhbXFxkLl0rKS8gKTtcbiAgICBcbiAgICAgICAgICAgICAgICB3ZWJraXQgJiYgKHJldC53ZWJraXQgPSBwYXJzZUZsb2F0KCB3ZWJraXRbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBjaHJvbWUgJiYgKHJldC5jaHJvbWUgPSBwYXJzZUZsb2F0KCBjaHJvbWVbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBpZSAmJiAocmV0LmllID0gcGFyc2VGbG9hdCggaWVbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBmaXJlZm94ICYmIChyZXQuZmlyZWZveCA9IHBhcnNlRmxvYXQoIGZpcmVmb3hbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBzYWZhcmkgJiYgKHJldC5zYWZhcmkgPSBwYXJzZUZsb2F0KCBzYWZhcmlbIDEgXSApKTtcbiAgICAgICAgICAgICAgICBvcGVyYSAmJiAocmV0Lm9wZXJhID0gcGFyc2VGbG9hdCggb3BlcmFbIDEgXSApKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfSkoIG5hdmlnYXRvci51c2VyQWdlbnQgKSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uICDmk43kvZzns7vnu5/mo4Dmn6Xnu5PmnpzjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGBhbmRyb2lkYCAg5aaC5p6c5ZyoYW5kcm9pZOa1j+iniOWZqOeOr+Wig+S4i++8jOatpOWAvOS4uuWvueW6lOeahGFuZHJvaWTniYjmnKzlj7fvvIzlkKbliJnkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogKiBgaW9zYCDlpoLmnpzlnKhpb3PmtY/op4jlmajnjq/looPkuIvvvIzmraTlgLzkuLrlr7nlupTnmoRpb3PniYjmnKzlj7fvvIzlkKbliJnkuLpgdW5kZWZpbmVkYOOAglxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtvc11cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb3M6IChmdW5jdGlvbiggdWEgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBvc3ggPSAhIXVhLm1hdGNoKCAvXFwoTWFjaW50b3NoXFw7IEludGVsIC8gKSxcbiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZCA9IHVhLm1hdGNoKCAvKD86QW5kcm9pZCk7P1tcXHNcXC9dKyhbXFxkLl0rKT8vICksXG4gICAgICAgICAgICAgICAgICAgIGlvcyA9IHVhLm1hdGNoKCAvKD86aVBhZHxpUG9kfGlQaG9uZSkuKk9TXFxzKFtcXGRfXSspLyApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIG9zeCAmJiAocmV0Lm9zeCA9IHRydWUpO1xuICAgICAgICAgICAgICAgIGFuZHJvaWQgJiYgKHJldC5hbmRyb2lkID0gcGFyc2VGbG9hdCggYW5kcm9pZFsgMSBdICkpO1xuICAgICAgICAgICAgICAgIGlvcyAmJiAocmV0LmlvcyA9IHBhcnNlRmxvYXQoIGlvc1sgMSBdLnJlcGxhY2UoIC9fL2csICcuJyApICkpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9KSggbmF2aWdhdG9yLnVzZXJBZ2VudCApLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlrp7njrDnsbvkuI7nsbvkuYvpl7TnmoTnu6fmib/jgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgaW5oZXJpdHNcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuaW5oZXJpdHMoIHN1cGVyICkgPT4gY2hpbGRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuaW5oZXJpdHMoIHN1cGVyLCBwcm90b3MgKSA9PiBjaGlsZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5pbmhlcml0cyggc3VwZXIsIHByb3Rvcywgc3RhdGljcyApID0+IGNoaWxkXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtDbGFzc30gc3VwZXIg54i257G7XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3QgfCBGdW5jdGlvbn0gW3Byb3Rvc10g5a2Q57G75oiW6ICF5a+56LGh44CC5aaC5p6c5a+56LGh5Lit5YyF5ZCrY29uc3RydWN0b3LvvIzlrZDnsbvlsIbmmK/nlKjmraTlsZ7mgKflgLzjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbcHJvdG9zLmNvbnN0cnVjdG9yXSDlrZDnsbvmnoTpgKDlmajvvIzkuI3mjIflrprnmoTor53lsIbliJvlu7rkuKrkuLTml7bnmoTnm7TmjqXmiafooYzniLbnsbvmnoTpgKDlmajnmoTmlrnms5XjgIJcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gW3N0YXRpY3NdIOmdmeaAgeWxnuaAp+aIluaWueazleOAglxuICAgICAgICAgICAgICogQHJldHVybiB7Q2xhc3N9IOi/lOWbnuWtkOexu+OAglxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIFBlcnNvbigpIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggJ1N1cGVyJyApO1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICogUGVyc29uLnByb3RvdHlwZS5oZWxsbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCAnaGVsbG8nICk7XG4gICAgICAgICAgICAgKiB9O1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIHZhciBNYW5hZ2VyID0gQmFzZS5pbmhlcml0cyggUGVyc29uLCB7XG4gICAgICAgICAgICAgKiAgICAgd29ybGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgICAgICBjb25zb2xlLmxvZyggJ1dvcmxkJyApO1xuICAgICAgICAgICAgICogICAgIH1cbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWboOS4uuayoeacieaMh+WumuaehOmAoOWZqO+8jOeItuexu+eahOaehOmAoOWZqOWwhuS8muaJp+ihjOOAglxuICAgICAgICAgICAgICogdmFyIGluc3RhbmNlID0gbmV3IE1hbmFnZXIoKTsgICAgLy8gPT4gU3VwZXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyDnu6fmib/lrZDniLbnsbvnmoTmlrnms5VcbiAgICAgICAgICAgICAqIGluc3RhbmNlLmhlbGxvKCk7ICAgIC8vID0+IGhlbGxvXG4gICAgICAgICAgICAgKiBpbnN0YW5jZS53b3JsZCgpOyAgICAvLyA9PiBXb3JsZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWtkOexu+eahF9fc3VwZXJfX+WxnuaAp+aMh+WQkeeItuexu1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIE1hbmFnZXIuX19zdXBlcl9fID09PSBQZXJzb24gKTsgICAgLy8gPT4gdHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbmhlcml0czogZnVuY3Rpb24oIFN1cGVyLCBwcm90b3MsIHN0YXRpY1Byb3RvcyApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgcHJvdG9zID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IHByb3RvcztcbiAgICAgICAgICAgICAgICAgICAgcHJvdG9zID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBwcm90b3MgJiYgcHJvdG9zLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpICkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IHByb3Rvcy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN1cGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aSN5Yi26Z2Z5oCB5pa55rOVXG4gICAgICAgICAgICAgICAgJC5leHRlbmQoIHRydWUsIGNoaWxkLCBTdXBlciwgc3RhdGljUHJvdG9zIHx8IHt9ICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLyoganNoaW50IGNhbWVsY2FzZTogZmFsc2UgKi9cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDorqnlrZDnsbvnmoRfX3N1cGVyX1/lsZ7mgKfmjIflkJHniLbnsbvjgIJcbiAgICAgICAgICAgICAgICBjaGlsZC5fX3N1cGVyX18gPSBTdXBlci5wcm90b3R5cGU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5p6E5bu65Y6f5Z6L77yM5re75Yqg5Y6f5Z6L5pa55rOV5oiW5bGe5oCn44CCXG4gICAgICAgICAgICAgICAgLy8g5pqC5pe255SoT2JqZWN0LmNyZWF0ZeWunueOsOOAglxuICAgICAgICAgICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IGNyZWF0ZU9iamVjdCggU3VwZXIucHJvdG90eXBlICk7XG4gICAgICAgICAgICAgICAgcHJvdG9zICYmICQuZXh0ZW5kKCB0cnVlLCBjaGlsZC5wcm90b3R5cGUsIHByb3RvcyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOS4gOS4quS4jeWBmuS7u+S9leS6i+aDheeahOaWueazleOAguWPr+S7peeUqOadpei1i+WAvOe7mem7mOiupOeahGNhbGxiYWNrLlxuICAgICAgICAgICAgICogQG1ldGhvZCBub29wXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5vb3A6IG5vb3AsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOi/lOWbnuS4gOS4quaWsOeahOaWueazle+8jOatpOaWueazleWwhuW3suaMh+WumueahGBjb250ZXh0YOadpeaJp+ihjOOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5iaW5kRm4oIGZuLCBjb250ZXh0ICkgPT4gRnVuY3Rpb25cbiAgICAgICAgICAgICAqIEBtZXRob2QgYmluZEZuXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdmFyIGRvU29tZXRoaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKCB0aGlzLm5hbWUgKTtcbiAgICAgICAgICAgICAqICAgICB9LFxuICAgICAgICAgICAgICogICAgIG9iaiA9IHtcbiAgICAgICAgICAgICAqICAgICAgICAgbmFtZTogJ09iamVjdCBOYW1lJ1xuICAgICAgICAgICAgICogICAgIH0sXG4gICAgICAgICAgICAgKiAgICAgYWxpYXNGbiA9IEJhc2UuYmluZCggZG9Tb21ldGhpbmcsIG9iaiApO1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICBhbGlhc0ZuKCk7ICAgIC8vID0+IE9iamVjdCBOYW1lXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBiaW5kRm46IGJpbmRGbixcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5byV55SoQ29uc29sZS5sb2flpoLmnpzlrZjlnKjnmoTor53vvIzlkKbliJnlvJXnlKjkuIDkuKpb56m65Ye95pWwbG9vcF0oI1dlYlVwbG9hZGVyOkJhc2UubG9nKeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5sb2coIGFyZ3MuLi4gKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2QgbG9nXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZzogKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggd2luZG93LmNvbnNvbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiaW5kRm4oIGNvbnNvbGUubG9nLCBjb25zb2xlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub29wO1xuICAgICAgICAgICAgfSkoKSxcbiAgICBcbiAgICAgICAgICAgIG5leHRUaWNrOiAoZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBjYiApIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggY2IsIDEgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIEBidWcg5b2T5rWP6KeI5Zmo5LiN5Zyo5b2T5YmN56qX5Y+j5pe25bCx5YGc5LqG44CCXG4gICAgICAgICAgICAgICAgLy8gdmFyIG5leHQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgLy8gICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAvLyAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgIC8vICAgICBmdW5jdGlvbiggY2IgKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB3aW5kb3cuc2V0VGltZW91dCggY2IsIDEwMDAgLyA2MCApO1xuICAgICAgICAgICAgICAgIC8vICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIC8vIGZpeDogVW5jYXVnaHQgVHlwZUVycm9yOiBJbGxlZ2FsIGludm9jYXRpb25cbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gYmluZEZuKCBuZXh0LCB3aW5kb3cgKTtcbiAgICAgICAgICAgIH0pKCksXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiiq1t1bmN1cnJ5dGhpc10oaHR0cDovL3d3dy4yYWxpdHkuY29tLzIwMTEvMTEvdW5jdXJyeWluZy10aGlzLmh0bWwp55qE5pWw57uEc2xpY2Xmlrnms5XjgIJcbiAgICAgICAgICAgICAqIOWwhueUqOadpeWwhumdnuaVsOe7hOWvueixoei9rOWMluaIkOaVsOe7hOWvueixoeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgQmFzZS5zbGljZSggdGFyZ2V0LCBzdGFydFssIGVuZF0gKSA9PiBBcnJheVxuICAgICAgICAgICAgICogQG1ldGhvZCBzbGljZVxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIGRvU29tdGhpbmcoKSB7XG4gICAgICAgICAgICAgKiAgICAgdmFyIGFyZ3MgPSBCYXNlLnNsaWNlKCBhcmd1bWVudHMsIDEgKTtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggYXJncyApO1xuICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGRvU29tdGhpbmcoICdpZ25vcmVkJywgJ2FyZzInLCAnYXJnMycgKTsgICAgLy8gPT4gQXJyYXkgW1wiYXJnMlwiLCBcImFyZzNcIl1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2xpY2U6IHVuY3VycnlUaGlzKCBbXS5zbGljZSApLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnlJ/miJDllK/kuIDnmoRJRFxuICAgICAgICAgICAgICogQG1ldGhvZCBndWlkXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmd1aWQoKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZ3VpZCggcHJlZnggKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ3VpZDogKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb3VudGVyID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHByZWZpeCApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGd1aWQgPSAoK25ldyBEYXRlKCkpLnRvU3RyaW5nKCAzMiApLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IDU7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGd1aWQgKz0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIDY1NTM1ICkudG9TdHJpbmcoIDMyICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChwcmVmaXggfHwgJ3d1XycpICsgZ3VpZCArIChjb3VudGVyKyspLnRvU3RyaW5nKCAzMiApO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmoLzlvI/ljJbmlofku7blpKflsI8sIOi+k+WHuuaIkOW4puWNleS9jeeahOWtl+espuS4slxuICAgICAgICAgICAgICogQG1ldGhvZCBmb3JtYXRTaXplXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmZvcm1hdFNpemUoIHNpemUgKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZm9ybWF0U2l6ZSggc2l6ZSwgcG9pbnRMZW5ndGggKSA9PiBTdHJpbmdcbiAgICAgICAgICAgICAqIEBncmFtbWFyIEJhc2UuZm9ybWF0U2l6ZSggc2l6ZSwgcG9pbnRMZW5ndGgsIHVuaXRzICkgPT4gU3RyaW5nXG4gICAgICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gc2l6ZSDmlofku7blpKflsI9cbiAgICAgICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcG9pbnRMZW5ndGg9Ml0g57K+56Gu5Yiw55qE5bCP5pWw54K55pWw44CCXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBbdW5pdHM9WyAnQicsICdLJywgJ00nLCAnRycsICdUQicgXV0g5Y2V5L2N5pWw57uE44CC5LuO5a2X6IqC77yM5Yiw5Y2D5a2X6IqC77yM5LiA55u05b6A5LiK5oyH5a6a44CC5aaC5p6c5Y2V5L2N5pWw57uE6YeM6Z2i5Y+q5oyH5a6a5LqG5Yiw5LqGSyjljYPlrZfoioIp77yM5ZCM5pe25paH5Lu25aSn5bCP5aSn5LqOTSwg5q2k5pa55rOV55qE6L6T5Ye65bCG6L+Y5piv5pi+56S65oiQ5aSa5bCRSy5cbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDAgKSApOyAgICAvLyA9PiAxMDBCXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggQmFzZS5mb3JtYXRTaXplKCAxMDI0ICkgKTsgICAgLy8gPT4gMS4wMEtcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMjQsIDAgKSApOyAgICAvLyA9PiAxS1xuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCAqIDEwMjQgKSApOyAgICAvLyA9PiAxLjAwTVxuICAgICAgICAgICAgICogY29uc29sZS5sb2coIEJhc2UuZm9ybWF0U2l6ZSggMTAyNCAqIDEwMjQgKiAxMDI0ICkgKTsgICAgLy8gPT4gMS4wMEdcbiAgICAgICAgICAgICAqIGNvbnNvbGUubG9nKCBCYXNlLmZvcm1hdFNpemUoIDEwMjQgKiAxMDI0ICogMTAyNCwgMCwgWydCJywgJ0tCJywgJ01CJ10gKSApOyAgICAvLyA9PiAxMDI0TUJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZm9ybWF0U2l6ZTogZnVuY3Rpb24oIHNpemUsIHBvaW50TGVuZ3RoLCB1bml0cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgdW5pdDtcbiAgICBcbiAgICAgICAgICAgICAgICB1bml0cyA9IHVuaXRzIHx8IFsgJ0InLCAnSycsICdNJywgJ0cnLCAnVEInIF07XG4gICAgXG4gICAgICAgICAgICAgICAgd2hpbGUgKCAodW5pdCA9IHVuaXRzLnNoaWZ0KCkpICYmIHNpemUgPiAxMDI0ICkge1xuICAgICAgICAgICAgICAgICAgICBzaXplID0gc2l6ZSAvIDEwMjQ7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiAodW5pdCA9PT0gJ0InID8gc2l6ZSA6IHNpemUudG9GaXhlZCggcG9pbnRMZW5ndGggfHwgMiApKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIOS6i+S7tuWkhOeQhuexu++8jOWPr+S7peeLrOeri+S9v+eUqO+8jOS5n+WPr+S7peaJqeWxlee7meWvueixoeS9v+eUqOOAglxuICAgICAqIEBmaWxlT3ZlcnZpZXcgTWVkaWF0b3JcbiAgICAgKi9cbiAgICBkZWZpbmUoJ21lZGlhdG9yJyxbXG4gICAgICAgICdiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHNsaWNlID0gW10uc2xpY2UsXG4gICAgICAgICAgICBzZXBhcmF0b3IgPSAvXFxzKy8sXG4gICAgICAgICAgICBwcm90b3M7XG4gICAgXG4gICAgICAgIC8vIOagueaNruadoeS7tui/h+a7pOWHuuS6i+S7tmhhbmRsZXJzLlxuICAgICAgICBmdW5jdGlvbiBmaW5kSGFuZGxlcnMoIGFyciwgbmFtZSwgY2FsbGJhY2ssIGNvbnRleHQgKSB7XG4gICAgICAgICAgICByZXR1cm4gJC5ncmVwKCBhcnIsIGZ1bmN0aW9uKCBoYW5kbGVyICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoIW5hbWUgfHwgaGFuZGxlci5lID09PSBuYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCFjYWxsYmFjayB8fCBoYW5kbGVyLmNiID09PSBjYWxsYmFjayB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jYi5fY2IgPT09IGNhbGxiYWNrKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCFjb250ZXh0IHx8IGhhbmRsZXIuY3R4ID09PSBjb250ZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGVhY2hFdmVudCggZXZlbnRzLCBjYWxsYmFjaywgaXRlcmF0b3IgKSB7XG4gICAgICAgICAgICAvLyDkuI3mlK/mjIHlr7nosaHvvIzlj6rmlK/mjIHlpJrkuKpldmVudOeUqOepuuagvOmalOW8gFxuICAgICAgICAgICAgJC5lYWNoKCAoZXZlbnRzIHx8ICcnKS5zcGxpdCggc2VwYXJhdG9yICksIGZ1bmN0aW9uKCBfLCBrZXkgKSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoIGtleSwgY2FsbGJhY2sgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIHRyaWdnZXJIYW5kZXJzKCBldmVudHMsIGFyZ3MgKSB7XG4gICAgICAgICAgICB2YXIgc3RvcGVkID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgaSA9IC0xLFxuICAgICAgICAgICAgICAgIGxlbiA9IGV2ZW50cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgaGFuZGxlcjtcbiAgICBcbiAgICAgICAgICAgIHdoaWxlICggKytpIDwgbGVuICkge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBldmVudHNbIGkgXTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGhhbmRsZXIuY2IuYXBwbHkoIGhhbmRsZXIuY3R4MiwgYXJncyApID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgcmV0dXJuICFzdG9wZWQ7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcHJvdG9zID0ge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnu5Hlrprkuovku7bjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgY2FsbGJhY2tg5pa55rOV5Zyo5omn6KGM5pe277yMYXJndW1lbnRz5bCG5Lya5p2l5rqQ5LqOdHJpZ2dlcueahOaXtuWAmeaQuuW4pueahOWPguaVsOOAguWmglxuICAgICAgICAgICAgICogYGBgamF2YXNjcmlwdFxuICAgICAgICAgICAgICogdmFyIG9iaiA9IHt9O1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOS9v+W+l29iauacieS6i+S7tuihjOS4ulxuICAgICAgICAgICAgICogTWVkaWF0b3IuaW5zdGFsbFRvKCBvYmogKTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBvYmoub24oICd0ZXN0YScsIGZ1bmN0aW9uKCBhcmcxLCBhcmcyICkge1xuICAgICAgICAgICAgICogICAgIGNvbnNvbGUubG9nKCBhcmcxLCBhcmcyICk7IC8vID0+ICdhcmcxJywgJ2FyZzInXG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBvYmoudHJpZ2dlciggJ3Rlc3RhJywgJ2FyZzEnLCAnYXJnMicgKTtcbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIOWmguaenGBjYWxsYmFja2DkuK3vvIzmn5DkuIDkuKrmlrnms5VgcmV0dXJuIGZhbHNlYOS6hu+8jOWImeWQjue7reeahOWFtuS7lmBjYWxsYmFja2Dpg73kuI3kvJrooqvmiafooYzliLDjgIJcbiAgICAgICAgICAgICAqIOWIh+S8muW9seWTjeWIsGB0cmlnZ2VyYOaWueazleeahOi/lOWbnuWAvO+8jOS4umBmYWxzZWDjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBgb25g6L+Y5Y+v5Lul55So5p2l5re75Yqg5LiA5Liq54m55q6K5LqL5Lu2YGFsbGAsIOi/meagt+aJgOacieeahOS6i+S7tuinpuWPkemDveS8muWTjeW6lOWIsOOAguWQjOaXtuatpOexu2BjYWxsYmFja2DkuK3nmoRhcmd1bWVudHPmnInkuIDkuKrkuI3lkIzlpITvvIxcbiAgICAgICAgICAgICAqIOWwseaYr+esrOS4gOS4quWPguaVsOS4umB0eXBlYO+8jOiusOW9leW9k+WJjeaYr+S7gOS5iOS6i+S7tuWcqOinpuWPkeOAguatpOexu2BjYWxsYmFja2DnmoTkvJjlhYjnuqfmr5TohJrkvY7vvIzkvJrlho3mraPluLhgY2FsbGJhY2tg5omn6KGM5a6M5ZCO6Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBgYGBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgKiBvYmoub24oICdhbGwnLCBmdW5jdGlvbiggdHlwZSwgYXJnMSwgYXJnMiApIHtcbiAgICAgICAgICAgICAqICAgICBjb25zb2xlLmxvZyggdHlwZSwgYXJnMSwgYXJnMiApOyAvLyA9PiAndGVzdGEnLCAnYXJnMScsICdhcmcyJ1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKiBgYGBcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIG9uXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvbiggbmFtZSwgY2FsbGJhY2tbLCBjb250ZXh0XSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBuYW1lICAgICDkuovku7blkI3vvIzmlK/mjIHlpJrkuKrkuovku7bnlKjnqbrmoLzpmpTlvIBcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayDkuovku7blpITnkIblmahcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gICBbY29udGV4dF0gIOS6i+S7tuWkhOeQhuWZqOeahOS4iuS4i+aWh+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7c2VsZn0g6L+U5Zue6Ieq6Lqr77yM5pa55L6/6ZO+5byPXG4gICAgICAgICAgICAgKiBAY2hhaW5hYmxlXG4gICAgICAgICAgICAgKiBAY2xhc3MgTWVkaWF0b3JcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb246IGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBzZXQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBzZXQgPSB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IFtdKTtcbiAgICBcbiAgICAgICAgICAgICAgICBlYWNoRXZlbnQoIG5hbWUsIGNhbGxiYWNrLCBmdW5jdGlvbiggbmFtZSwgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0geyBlOiBuYW1lIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jdHggPSBjb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmN0eDIgPSBjb250ZXh0IHx8IG1lO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmlkID0gc2V0Lmxlbmd0aDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgc2V0LnB1c2goIGhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe7keWumuS6i+S7tu+8jOS4lOW9k2hhbmRsZXLmiafooYzlrozlkI7vvIzoh6rliqjop6PpmaTnu5HlrprjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb25jZVxuICAgICAgICAgICAgICogQGdyYW1tYXIgb25jZSggbmFtZSwgY2FsbGJhY2tbLCBjb250ZXh0XSApID0+IHNlbGZcbiAgICAgICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBuYW1lICAgICDkuovku7blkI1cbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayDkuovku7blpITnkIblmahcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gICBbY29udGV4dF0gIOS6i+S7tuWkhOeQhuWZqOeahOS4iuS4i+aWh+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7c2VsZn0g6L+U5Zue6Ieq6Lqr77yM5pa55L6/6ZO+5byPXG4gICAgICAgICAgICAgKiBAY2hhaW5hYmxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uY2U6IGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWNhbGxiYWNrICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGVhY2hFdmVudCggbmFtZSwgY2FsbGJhY2ssIGZ1bmN0aW9uKCBuYW1lLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vZmYoIG5hbWUsIG9uY2UgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoIGNvbnRleHQgfHwgbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgb25jZS5fY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgbWUub24oIG5hbWUsIG9uY2UsIGNvbnRleHQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbWU7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDop6PpmaTkuovku7bnu5HlrppcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb2ZmXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvZmYoIFtuYW1lWywgY2FsbGJhY2tbLCBjb250ZXh0XSBdIF0gKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgW25hbWVdICAgICDkuovku7blkI1cbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIOS6i+S7tuWkhOeQhuWZqFxuICAgICAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSAgIFtjb250ZXh0XSAg5LqL5Lu25aSE55CG5Zmo55qE5LiK5LiL5paH44CCXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzZWxmfSDov5Tlm57oh6rouqvvvIzmlrnkvr/pk77lvI9cbiAgICAgICAgICAgICAqIEBjaGFpbmFibGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb2ZmOiBmdW5jdGlvbiggbmFtZSwgY2IsIGN0eCApIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWV2ZW50cyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIW5hbWUgJiYgIWNiICYmICFjdHggKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZWFjaEV2ZW50KCBuYW1lLCBjYiwgZnVuY3Rpb24oIG5hbWUsIGNiICkge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goIGZpbmRIYW5kbGVycyggZXZlbnRzLCBuYW1lLCBjYiwgY3R4ICksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1sgdGhpcy5pZCBdO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOinpuWPkeS6i+S7tlxuICAgICAgICAgICAgICogQG1ldGhvZCB0cmlnZ2VyXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciB0cmlnZ2VyKCBuYW1lWywgYXJncy4uLl0gKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgdHlwZSAgICAg5LqL5Lu25ZCNXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHsqfSBbLi4uXSDku7vmhI/lj4LmlbBcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IOWmguaenGhhbmRsZXLkuK1yZXR1cm4gZmFsc2XkuobvvIzliJnov5Tlm55mYWxzZSwg5ZCm5YiZ6L+U5ZuedHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncywgZXZlbnRzLCBhbGxFdmVudHM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhdGhpcy5fZXZlbnRzIHx8ICF0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgYXJncyA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApO1xuICAgICAgICAgICAgICAgIGV2ZW50cyA9IGZpbmRIYW5kbGVycyggdGhpcy5fZXZlbnRzLCB0eXBlICk7XG4gICAgICAgICAgICAgICAgYWxsRXZlbnRzID0gZmluZEhhbmRsZXJzKCB0aGlzLl9ldmVudHMsICdhbGwnICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyaWdnZXJIYW5kZXJzKCBldmVudHMsIGFyZ3MgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlckhhbmRlcnMoIGFsbEV2ZW50cywgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuK3ku4vogIXvvIzlroPmnKzouqvmmK/kuKrljZXkvovvvIzkvYblj6/ku6XpgJrov4dbaW5zdGFsbFRvXSgjV2ViVXBsb2FkZXI6TWVkaWF0b3I6aW5zdGFsbFRvKeaWueazle+8jOS9v+S7u+S9leWvueixoeWFt+Wkh+S6i+S7tuihjOS4uuOAglxuICAgICAgICAgKiDkuLvopoHnm67nmoTmmK/otJ/otKPmqKHlnZfkuI7mqKHlnZfkuYvpl7TnmoTlkIjkvZzvvIzpmY3kvY7ogKblkIjluqbjgIJcbiAgICAgICAgICpcbiAgICAgICAgICogQGNsYXNzIE1lZGlhdG9yXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gJC5leHRlbmQoe1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlj6/ku6XpgJrov4fov5nkuKrmjqXlj6PvvIzkvb/ku7vkvZXlr7nosaHlhbflpIfkuovku7blip/og73jgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgaW5zdGFsbFRvXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9iaiDpnIDopoHlhbflpIfkuovku7booYzkuLrnmoTlr7nosaHjgIJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge09iamVjdH0g6L+U5Zueb2JqLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbnN0YWxsVG86IGZ1bmN0aW9uKCBvYmogKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKCBvYmosIHByb3RvcyApO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9LCBwcm90b3MgKTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFVwbG9hZGVy5LiK5Lyg57G7XG4gICAgICovXG4gICAgZGVmaW5lKCd1cGxvYWRlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5LiK5Lyg5YWl5Y+j57G744CCXG4gICAgICAgICAqIEBjbGFzcyBVcGxvYWRlclxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQGdyYW1tYXIgbmV3IFVwbG9hZGVyKCBvcHRzICkgPT4gVXBsb2FkZXJcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogdmFyIHVwbG9hZGVyID0gV2ViVXBsb2FkZXIuVXBsb2FkZXIoe1xuICAgICAgICAgKiAgICAgc3dmOiAncGF0aF9vZl9zd2YvVXBsb2FkZXIuc3dmJyxcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIOW8gOi1t+WIhueJh+S4iuS8oOOAglxuICAgICAgICAgKiAgICAgY2h1bmtlZDogdHJ1ZVxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFVwbG9hZGVyKCBvcHRzICkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoIHRydWUsIHt9LCBVcGxvYWRlci5vcHRpb25zLCBvcHRzICk7XG4gICAgICAgICAgICB0aGlzLl9pbml0KCB0aGlzLm9wdGlvbnMgKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAvLyBkZWZhdWx0IE9wdGlvbnNcbiAgICAgICAgLy8gd2lkZ2V0c+S4reacieebuOW6lOaJqeWxlVxuICAgICAgICBVcGxvYWRlci5vcHRpb25zID0ge307XG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggVXBsb2FkZXIucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIC8vIOaJuemHj+a3u+WKoOe6r+WRveS7pOW8j+aWueazleOAglxuICAgICAgICAkLmVhY2goe1xuICAgICAgICAgICAgdXBsb2FkOiAnc3RhcnQtdXBsb2FkJyxcbiAgICAgICAgICAgIHN0b3A6ICdzdG9wLXVwbG9hZCcsXG4gICAgICAgICAgICBnZXRGaWxlOiAnZ2V0LWZpbGUnLFxuICAgICAgICAgICAgZ2V0RmlsZXM6ICdnZXQtZmlsZXMnLFxuICAgICAgICAgICAgYWRkRmlsZTogJ2FkZC1maWxlJyxcbiAgICAgICAgICAgIGFkZEZpbGVzOiAnYWRkLWZpbGUnLFxuICAgICAgICAgICAgc29ydDogJ3NvcnQtZmlsZXMnLFxuICAgICAgICAgICAgcmVtb3ZlRmlsZTogJ3JlbW92ZS1maWxlJyxcbiAgICAgICAgICAgIHNraXBGaWxlOiAnc2tpcC1maWxlJyxcbiAgICAgICAgICAgIHJldHJ5OiAncmV0cnknLFxuICAgICAgICAgICAgaXNJblByb2dyZXNzOiAnaXMtaW4tcHJvZ3Jlc3MnLFxuICAgICAgICAgICAgbWFrZVRodW1iOiAnbWFrZS10aHVtYicsXG4gICAgICAgICAgICBnZXREaW1lbnNpb246ICdnZXQtZGltZW5zaW9uJyxcbiAgICAgICAgICAgIGFkZEJ1dHRvbjogJ2FkZC1idG4nLFxuICAgICAgICAgICAgZ2V0UnVudGltZVR5cGU6ICdnZXQtcnVudGltZS10eXBlJyxcbiAgICAgICAgICAgIHJlZnJlc2g6ICdyZWZyZXNoJyxcbiAgICAgICAgICAgIGRpc2FibGU6ICdkaXNhYmxlJyxcbiAgICAgICAgICAgIGVuYWJsZTogJ2VuYWJsZScsXG4gICAgICAgICAgICByZXNldDogJ3Jlc2V0J1xuICAgICAgICB9LCBmdW5jdGlvbiggZm4sIGNvbW1hbmQgKSB7XG4gICAgICAgICAgICBVcGxvYWRlci5wcm90b3R5cGVbIGZuIF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCBjb21tYW5kLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIucHJvdG90eXBlLCB7XG4gICAgICAgICAgICBzdGF0ZTogJ3BlbmRpbmcnLFxuICAgIFxuICAgICAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUucmVxdWVzdCggJ2luaXQnLCBvcHRzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuc3RhdGUgPSAncmVhZHknO1xuICAgICAgICAgICAgICAgICAgICBtZS50cmlnZ2VyKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5oiW6ICF6K6+572uVXBsb2FkZXLphY3nva7pobnjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgb3B0aW9uXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBvcHRpb24oIGtleSApID0+ICpcbiAgICAgICAgICAgICAqIEBncmFtbWFyIG9wdGlvbigga2V5LCB2YWwgKSA9PiBzZWxmXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC8vIOWIneWni+eKtuaAgeWbvueJh+S4iuS8oOWJjeS4jeS8muWOi+e8qVxuICAgICAgICAgICAgICogdmFyIHVwbG9hZGVyID0gbmV3IFdlYlVwbG9hZGVyLlVwbG9hZGVyKHtcbiAgICAgICAgICAgICAqICAgICByZXNpemU6IG51bGw7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAvLyDkv67mlLnlkI7lm77niYfkuIrkvKDliY3vvIzlsJ3or5XlsIblm77niYfljovnvKnliLAxNjAwICogMTYwMFxuICAgICAgICAgICAgICogdXBsb2FkZXIub3B0aW9ucyggJ3Jlc2l6ZScsIHtcbiAgICAgICAgICAgICAqICAgICB3aWR0aDogMTYwMCxcbiAgICAgICAgICAgICAqICAgICBoZWlnaHQ6IDE2MDBcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvcHRpb246IGZ1bmN0aW9uKCBrZXksIHZhbCApIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBzZXR0ZXJcbiAgICAgICAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPiAxICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoICQuaXNQbGFpbk9iamVjdCggdmFsICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmlzUGxhaW5PYmplY3QoIG9wdHNbIGtleSBdICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCggb3B0c1sga2V5IF0sIHZhbCApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0c1sga2V5IF0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAgICAvLyBnZXR0ZXJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleSA/IG9wdHNbIGtleSBdIDogb3B0cztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7bnu5/orqHkv6Hmga/jgILov5Tlm57kuIDkuKrljIXlkKvkuIDkuIvkv6Hmga/nmoTlr7nosaHjgIJcbiAgICAgICAgICAgICAqICogYHN1Y2Nlc3NOdW1gIOS4iuS8oOaIkOWKn+eahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgdXBsb2FkRmFpbE51bWAg5LiK5Lyg5aSx6LSl55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBjYW5jZWxOdW1gIOiiq+WIoOmZpOeahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgaW52YWxpZE51bWAg5peg5pWI55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiAqIGBxdWV1ZU51bWAg6L+Y5Zyo6Zif5YiX5Lit55qE5paH5Lu25pWwXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGdldFN0YXRzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRTdGF0cygpID0+IE9iamVjdFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdGF0czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoaXMuX21nci5nZXRTdGF0cy5hcHBseSggdGhpcy5fbWdyLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHMgPSB0aGlzLnJlcXVlc3QoJ2dldC1zdGF0cycpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NOdW06IHN0YXRzLm51bU9mU3VjY2VzcyxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hvIGNhcmU/XG4gICAgICAgICAgICAgICAgICAgIC8vIHF1ZXVlRmFpbE51bTogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsTnVtOiBzdGF0cy5udW1PZkNhbmNlbCxcbiAgICAgICAgICAgICAgICAgICAgaW52YWxpZE51bTogc3RhdHMubnVtT2ZJbnZhbGlkLFxuICAgICAgICAgICAgICAgICAgICB1cGxvYWRGYWlsTnVtOiBzdGF0cy5udW1PZlVwbG9hZEZhaWxlZCxcbiAgICAgICAgICAgICAgICAgICAgcXVldWVOdW06IHN0YXRzLm51bU9mUXVldWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOmcgOimgemHjeWGmeatpOaWueazleadpeadpeaUr+aMgW9wdHMub25FdmVudOWSjGluc3RhbmNlLm9uRXZlbnTnmoTlpITnkIblmahcbiAgICAgICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKCB0eXBlLyosIGFyZ3MuLi4qLyApIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gJ29uJyArIHR5cGUuc3Vic3RyaW5nKCAwLCAxICkudG9VcHBlckNhc2UoKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlLnN1YnN0cmluZyggMSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiwg+eUqOmAmui/h29u5pa55rOV5rOo5YaM55qEaGFuZGxlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIE1lZGlhdG9yLnRyaWdnZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApID09PSBmYWxzZSB8fFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6LCD55Sob3B0cy5vbkV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmlzRnVuY3Rpb24oIG9wdHNbIG5hbWUgXSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzWyBuYW1lIF0uYXBwbHkoIHRoaXMsIGFyZ3MgKSA9PT0gZmFsc2UgfHxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiwg+eUqHRoaXMub25FdmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgJC5pc0Z1bmN0aW9uKCB0aGlzWyBuYW1lIF0gKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1sgbmFtZSBdLmFwcGx5KCB0aGlzLCBhcmdzICkgPT09IGZhbHNlIHx8XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlub/mkq3miYDmnIl1cGxvYWRlcueahOS6i+S7tuOAglxuICAgICAgICAgICAgICAgICAgICAgICAgTWVkaWF0b3IudHJpZ2dlci5hcHBseSggTWVkaWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBbIHRoaXMsIHR5cGUgXS5jb25jYXQoIGFyZ3MgKSApID09PSBmYWxzZSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyB3aWRnZXRzL3dpZGdldC5qc+WwhuihpeWFheatpOaWueazleeahOivpue7huaWh+aho+OAglxuICAgICAgICAgICAgcmVxdWVzdDogQmFzZS5ub29wXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5Yib5bu6VXBsb2FkZXLlrp7kvovvvIznrYnlkIzkuo5uZXcgVXBsb2FkZXIoIG9wdHMgKTtcbiAgICAgICAgICogQG1ldGhvZCBjcmVhdGVcbiAgICAgICAgICogQGNsYXNzIEJhc2VcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAZ3JhbW1hciBCYXNlLmNyZWF0ZSggb3B0cyApID0+IFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgICAgICBCYXNlLmNyZWF0ZSA9IFVwbG9hZGVyLmNyZWF0ZSA9IGZ1bmN0aW9uKCBvcHRzICkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVcGxvYWRlciggb3B0cyApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyDmmrTpnLJVcGxvYWRlcu+8jOWPr+S7pemAmui/h+Wug+adpeaJqeWxleS4muWKoemAu+i+keOAglxuICAgICAgICBCYXNlLlVwbG9hZGVyID0gVXBsb2FkZXI7XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlcjtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvcnVudGltZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgZmFjdG9yaWVzID0ge30sXG4gICAgXG4gICAgICAgICAgICAvLyDojrflj5blr7nosaHnmoTnrKzkuIDkuKprZXlcbiAgICAgICAgICAgIGdldEZpcnN0S2V5ID0gZnVuY3Rpb24oIG9iaiApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIga2V5IGluIG9iaiApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBvYmouaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOaOpeWPo+exu+OAglxuICAgICAgICBmdW5jdGlvbiBSdW50aW1lKCBvcHRpb25zICkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogZG9jdW1lbnQuYm9keVxuICAgICAgICAgICAgfSwgb3B0aW9ucyApO1xuICAgICAgICAgICAgdGhpcy51aWQgPSBCYXNlLmd1aWQoJ3J0XycpO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBSdW50aW1lLnByb3RvdHlwZSwge1xuICAgIFxuICAgICAgICAgICAgZ2V0Q29udGFpbmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LCBjb250YWluZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLl9jb250YWluZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHBhcmVudCA9ICQoIG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHkgKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSAkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSApO1xuICAgIFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hdHRyKCAnaWQnLCAncnRfJyArIHRoaXMudWlkICk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgICAgICB0b3A6ICcwcHgnLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAnMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxcHgnLFxuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBwYXJlbnQuYXBwZW5kKCBjb250YWluZXIgKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IEJhc2Uubm9vcCxcbiAgICAgICAgICAgIGV4ZWM6IEJhc2Uubm9vcCxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy5fY29udGFpbmVyICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5fX2NvbnRhaW5lciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgUnVudGltZS5vcmRlcnMgPSAnaHRtbDUsZmxhc2gnO1xuICAgIFxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5re75YqgUnVudGltZeWunueOsOOAglxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSAgICDnsbvlnotcbiAgICAgICAgICogQHBhcmFtIHtSdW50aW1lfSBmYWN0b3J5IOWFt+S9k1J1bnRpbWXlrp7njrDjgIJcbiAgICAgICAgICovXG4gICAgICAgIFJ1bnRpbWUuYWRkUnVudGltZSA9IGZ1bmN0aW9uKCB0eXBlLCBmYWN0b3J5ICkge1xuICAgICAgICAgICAgZmFjdG9yaWVzWyB0eXBlIF0gPSBmYWN0b3J5O1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBSdW50aW1lLmhhc1J1bnRpbWUgPSBmdW5jdGlvbiggdHlwZSApIHtcbiAgICAgICAgICAgIHJldHVybiAhISh0eXBlID8gZmFjdG9yaWVzWyB0eXBlIF0gOiBnZXRGaXJzdEtleSggZmFjdG9yaWVzICkpO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICBSdW50aW1lLmNyZWF0ZSA9IGZ1bmN0aW9uKCBvcHRzLCBvcmRlcnMgKSB7XG4gICAgICAgICAgICB2YXIgdHlwZSwgcnVudGltZTtcbiAgICBcbiAgICAgICAgICAgIG9yZGVycyA9IG9yZGVycyB8fCBSdW50aW1lLm9yZGVycztcbiAgICAgICAgICAgICQuZWFjaCggb3JkZXJzLnNwbGl0KCAvXFxzKixcXHMqL2cgKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBmYWN0b3JpZXNbIHRoaXMgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IGdldEZpcnN0S2V5KCBmYWN0b3JpZXMgKTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIXR5cGUgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSdW50aW1lIEVycm9yJyk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBydW50aW1lID0gbmV3IGZhY3Rvcmllc1sgdHlwZSBdKCBvcHRzICk7XG4gICAgICAgICAgICByZXR1cm4gcnVudGltZTtcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBSdW50aW1lLnByb3RvdHlwZSApO1xuICAgICAgICByZXR1cm4gUnVudGltZTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvY2xpZW50JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IsIFJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIHZhciBjYWNoZTtcbiAgICBcbiAgICAgICAgY2FjaGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0ge307XG4gICAgXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFkZDogZnVuY3Rpb24oIHJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsgcnVudGltZS51aWQgXSA9IHJ1bnRpbWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCBydWlkLCBzdGFuZGFsb25lICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBydWlkICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialsgcnVpZCBdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgaW4gb2JqICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5Lqb57G75Z6L5LiN6IO96YeN55So77yM5q+U5aaCZmlsZXBpY2tlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc3RhbmRhbG9uZSAmJiBvYmpbIGkgXS5fX3N0YW5kYWxvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCBydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2JqWyBydW50aW1lLnVpZCBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKCk7XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIFJ1bnRpbWVDbGllbnQoIGNvbXBvbmVudCwgc3RhbmRhbG9uZSApIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKSxcbiAgICAgICAgICAgICAgICBydW50aW1lO1xuICAgIFxuICAgICAgICAgICAgdGhpcy51aWQgPSBCYXNlLmd1aWQoJ2NsaWVudF8nKTtcbiAgICBcbiAgICAgICAgICAgIC8vIOWFgeiuuHJ1bnRpbWXmsqHmnInliJ3lp4vljJbkuYvliY3vvIzms6jlhozkuIDkupvmlrnms5XlnKjliJ3lp4vljJblkI7miafooYzjgIJcbiAgICAgICAgICAgIHRoaXMucnVudGltZVJlYWR5ID0gZnVuY3Rpb24oIGNiICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5kb25lKCBjYiApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdFJ1bnRpbWUgPSBmdW5jdGlvbiggb3B0cywgY2IgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBjb25uZWN0ZWQuXG4gICAgICAgICAgICAgICAgaWYgKCBydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FscmVhZHkgY29ubmVjdGVkIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5kb25lKCBjYiApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9wdHMgPT09ICdzdHJpbmcnICYmIGNhY2hlLmdldCggb3B0cyApICkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lID0gY2FjaGUuZ2V0KCBvcHRzICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWDj2ZpbGVQaWNrZXLlj6rog73ni6znq4vlrZjlnKjvvIzkuI3og73lhaznlKjjgIJcbiAgICAgICAgICAgICAgICBydW50aW1lID0gcnVudGltZSB8fCBjYWNoZS5nZXQoIG51bGwsIHN0YW5kYWxvbmUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDpnIDopoHliJvlu7pcbiAgICAgICAgICAgICAgICBpZiAoICFydW50aW1lICkge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lID0gUnVudGltZS5jcmVhdGUoIG9wdHMsIG9wdHMucnVudGltZU9yZGVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUuX19wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZS5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLmFkZCggcnVudGltZSApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLl9fY2xpZW50ID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDmnaXoh6pjYWNoZVxuICAgICAgICAgICAgICAgICAgICBCYXNlLiQuZXh0ZW5kKCBydW50aW1lLm9wdGlvbnMsIG9wdHMgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZS5fX3Byb21pc2UudGhlbiggZGVmZXJyZWQucmVzb2x2ZSApO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLl9fY2xpZW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHN0YW5kYWxvbmUgJiYgKHJ1bnRpbWUuX19zdGFuZGFsb25lID0gc3RhbmRhbG9uZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggIXJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcnVudGltZS5fX2NsaWVudC0tO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggcnVudGltZS5fX2NsaWVudCA8PSAwICkge1xuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoIHJ1bnRpbWUgKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJ1bnRpbWUuX19wcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcnVudGltZSA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5leGVjID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAhcnVudGltZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudCAmJiBhcmdzLnVuc2hpZnQoIGNvbXBvbmVudCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBydW50aW1lLmV4ZWMuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmdldFJ1aWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVudGltZSAmJiBydW50aW1lLnVpZDtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3kgPSAoZnVuY3Rpb24oIGRlc3Ryb3kgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBkZXN0cm95ICYmIGRlc3Ryb3kuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vZmYoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzY29ubmVjdFJ1bnRpbWUoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoIHRoaXMuZGVzdHJveSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggUnVudGltZUNsaWVudC5wcm90b3R5cGUgKTtcbiAgICAgICAgcmV0dXJuIFJ1bnRpbWVDbGllbnQ7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDplJnor6/kv6Hmga9cbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9kbmQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbWVkaWF0b3InLFxuICAgICAgICAncnVudGltZS9jbGllbnQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIE1lZGlhdG9yLCBSdW50aW1lQ2xlbnQgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBEcmFnQW5kRHJvcCggb3B0cyApIHtcbiAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJhZ0FuZERyb3Aub3B0aW9ucywgb3B0cyApO1xuICAgIFxuICAgICAgICAgICAgb3B0cy5jb250YWluZXIgPSAkKCBvcHRzLmNvbnRhaW5lciApO1xuICAgIFxuICAgICAgICAgICAgaWYgKCAhb3B0cy5jb250YWluZXIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIFJ1bnRpbWVDbGVudC5jYWxsKCB0aGlzLCAnRHJhZ0FuZERyb3AnICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgRHJhZ0FuZERyb3Aub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGFjY2VwdDogbnVsbCxcbiAgICAgICAgICAgIGRpc2FibGVHbG9iYWxEbmQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGVudCwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IERyYWdBbmREcm9wLFxuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5jb25uZWN0UnVudGltZSggbWUub3B0aW9ucywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmV4ZWMoJ2luaXQnKTtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIERyYWdBbmREcm9wLnByb3RvdHlwZSApO1xuICAgIFxuICAgICAgICByZXR1cm4gRHJhZ0FuZERyb3A7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDnu4Tku7bln7rnsbvjgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvd2lkZ2V0JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICBfaW5pdCA9IFVwbG9hZGVyLnByb3RvdHlwZS5faW5pdCxcbiAgICAgICAgICAgIElHTk9SRSA9IHt9LFxuICAgICAgICAgICAgd2lkZ2V0Q2xhc3MgPSBbXTtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gaXNBcnJheUxpa2UoIG9iaiApIHtcbiAgICAgICAgICAgIGlmICggIW9iaiApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB0eXBlID0gJC50eXBlKCBvYmogKTtcbiAgICBcbiAgICAgICAgICAgIGlmICggb2JqLm5vZGVUeXBlID09PSAxICYmIGxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHJldHVybiB0eXBlID09PSAnYXJyYXknIHx8IHR5cGUgIT09ICdmdW5jdGlvbicgJiYgdHlwZSAhPT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgICAgICAgICAgKGxlbmd0aCA9PT0gMCB8fCB0eXBlb2YgbGVuZ3RoID09PSAnbnVtYmVyJyAmJiBsZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgICAgIChsZW5ndGggLSAxKSBpbiBvYmopO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIFdpZGdldCggdXBsb2FkZXIgKSB7XG4gICAgICAgICAgICB0aGlzLm93bmVyID0gdXBsb2FkZXI7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSB1cGxvYWRlci5vcHRpb25zO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgICQuZXh0ZW5kKCBXaWRnZXQucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBCYXNlLm5vb3AsXG4gICAgXG4gICAgICAgICAgICAvLyDnsbtCYWNrYm9uZeeahOS6i+S7tuebkeWQrOWjsOaYju+8jOebkeWQrHVwbG9hZGVy5a6e5L6L5LiK55qE5LqL5Lu2XG4gICAgICAgICAgICAvLyB3aWRnZXTnm7TmjqXml6Dms5Xnm5HlkKzkuovku7bvvIzkuovku7blj6rog73pgJrov4d1cGxvYWRlcuadpeS8oOmAklxuICAgICAgICAgICAgaW52b2tlOiBmdW5jdGlvbiggYXBpTmFtZSwgYXJncyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWFrZS10aHVtYic6ICdtYWtlVGh1bWInXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5yZXNwb25zZU1hcDtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzml6BBUEnlk43lupTlo7DmmI7liJnlv73nlaVcbiAgICAgICAgICAgICAgICBpZiAoICFtYXAgfHwgIShhcGlOYW1lIGluIG1hcCkgfHwgIShtYXBbIGFwaU5hbWUgXSBpbiB0aGlzKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgISQuaXNGdW5jdGlvbiggdGhpc1sgbWFwWyBhcGlOYW1lIF0gXSApICkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSUdOT1JFO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1sgbWFwWyBhcGlOYW1lIF0gXS5hcHBseSggdGhpcywgYXJncyApO1xuICAgIFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Y+R6YCB5ZG95Luk44CC5b2T5Lyg5YWlYGNhbGxiYWNrYOaIluiAhWBoYW5kbGVyYOS4rei/lOWbnmBwcm9taXNlYOaXtuOAgui/lOWbnuS4gOS4quW9k+aJgOaciWBoYW5kbGVyYOS4reeahHByb21pc2Xpg73lrozmiJDlkI7lrozmiJDnmoTmlrBgcHJvbWlzZWDjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2QgcmVxdWVzdFxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmVxdWVzdCggY29tbWFuZCwgYXJncyApID0+ICogfCBQcm9taXNlXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZXF1ZXN0KCBjb21tYW5kLCBhcmdzLCBjYWxsYmFjayApID0+IFByb21pc2VcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlcXVlc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm93bmVyLnJlcXVlc3QuYXBwbHkoIHRoaXMub3duZXIsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLy8g5omp5bGVVXBsb2FkZXIuXG4gICAgICAgICQuZXh0ZW5kKCBVcGxvYWRlci5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIC8vIOimhuWGmV9pbml055So5p2l5Yid5aeL5YyWd2lkZ2V0c1xuICAgICAgICAgICAgX2luaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHdpZGdldHMgPSBtZS5fd2lkZ2V0cyA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgICQuZWFjaCggd2lkZ2V0Q2xhc3MsIGZ1bmN0aW9uKCBfLCBrbGFzcyApIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkZ2V0cy5wdXNoKCBuZXcga2xhc3MoIG1lICkgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gX2luaXQuYXBwbHkoIG1lLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbiggYXBpTmFtZSwgYXJncywgY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgICAgICB3aWRnZXRzID0gdGhpcy5fd2lkZ2V0cyxcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gd2lkZ2V0cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHJsdHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgZGZkcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICB3aWRnZXQsIHJsdCwgcHJvbWlzZSwga2V5O1xuICAgIFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBpc0FycmF5TGlrZSggYXJncyApID8gYXJncyA6IFsgYXJncyBdO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICB3aWRnZXQgPSB3aWRnZXRzWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIHJsdCA9IHdpZGdldC5pbnZva2UoIGFwaU5hbWUsIGFyZ3MgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBybHQgIT09IElHTk9SRSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlZmVycmVk5a+56LGhXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIEJhc2UuaXNQcm9taXNlKCBybHQgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZmRzLnB1c2goIHJsdCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBybHRzLnB1c2goIHJsdCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOaciWNhbGxiYWNr77yM5YiZ55So5byC5q2l5pa55byP44CCXG4gICAgICAgICAgICAgICAgaWYgKCBjYWxsYmFjayB8fCBkZmRzLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSA9IEJhc2Uud2hlbi5hcHBseSggQmFzZSwgZGZkcyApO1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBwcm9taXNlLnBpcGUgPyAncGlwZScgOiAndGhlbic7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOW+iOmHjeimgeS4jeiDveWIoOmZpOOAguWIoOmZpOS6huS8muatu+W+queOr+OAglxuICAgICAgICAgICAgICAgICAgICAvLyDkv53or4HmiafooYzpobrluo/jgILorqljYWxsYmFja+aAu+aYr+WcqOS4i+S4gOS4qnRpY2vkuK3miafooYzjgIJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2VbIGtleSBdKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZS5hcHBseSggZGVmZXJyZWQsIGFyZ3MgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMSApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pWyBrZXkgXSggY2FsbGJhY2sgfHwgQmFzZS5ub29wICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJsdHNbIDAgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5re75Yqg57uE5Lu2XG4gICAgICAgICAqIEBwYXJhbSAge29iamVjdH0gd2lkZ2V0UHJvdG8g57uE5Lu25Y6f5Z6L77yM5p6E6YCg5Ye95pWw6YCa6L+HY29uc3RydWN0b3LlsZ7mgKflrprkuYlcbiAgICAgICAgICogQHBhcmFtICB7b2JqZWN0fSByZXNwb25zZU1hcCBBUEnlkI3np7DkuI7lh73mlbDlrp7njrDnmoTmmKDlsIRcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIFVwbG9hZGVyLnJlZ2lzdGVyKCB7XG4gICAgICAgICAqICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdGlvbnMgKSB7fSxcbiAgICAgICAgICogICAgICAgICBtYWtlVGh1bWI6IGZ1bmN0aW9uKCkge31cbiAgICAgICAgICogICAgIH0sIHtcbiAgICAgICAgICogICAgICAgICAnbWFrZS10aHVtYic6ICdtYWtlVGh1bWInXG4gICAgICAgICAqICAgICB9ICk7XG4gICAgICAgICAqL1xuICAgICAgICBVcGxvYWRlci5yZWdpc3RlciA9IFdpZGdldC5yZWdpc3RlciA9IGZ1bmN0aW9uKCByZXNwb25zZU1hcCwgd2lkZ2V0UHJvdG8gKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0geyBpbml0OiAnaW5pdCcgfSxcbiAgICAgICAgICAgICAgICBrbGFzcztcbiAgICBcbiAgICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICB3aWRnZXRQcm90byA9IHJlc3BvbnNlTWFwO1xuICAgICAgICAgICAgICAgIHdpZGdldFByb3RvLnJlc3BvbnNlTWFwID0gbWFwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aWRnZXRQcm90by5yZXNwb25zZU1hcCA9ICQuZXh0ZW5kKCBtYXAsIHJlc3BvbnNlTWFwICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBrbGFzcyA9IEJhc2UuaW5oZXJpdHMoIFdpZGdldCwgd2lkZ2V0UHJvdG8gKTtcbiAgICAgICAgICAgIHdpZGdldENsYXNzLnB1c2goIGtsYXNzICk7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4ga2xhc3M7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIHJldHVybiBXaWRnZXQ7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBEcmFnQW5kRHJvcCBXaWRnZXTjgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvZmlsZWRuZCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdsaWIvZG5kJyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgRG5kICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgVXBsb2FkZXIub3B0aW9ucy5kbmQgPSAnJztcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7U2VsZWN0b3J9IFtkbmQ9dW5kZWZpbmVkXSAg5oyH5a6aRHJhZyBBbmQgRHJvcOaLluaLveeahOWuueWZqO+8jOWmguaenOS4jeaMh+Wumu+8jOWImeS4jeWQr+WKqOOAglxuICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBldmVudCBkbmRBY2NlcHRcbiAgICAgICAgICogQHBhcmFtIHtEYXRhVHJhbnNmZXJJdGVtTGlzdH0gaXRlbXMgRGF0YVRyYW5zZmVySXRlbVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24g6Zi75q2i5q2k5LqL5Lu25Y+v5Lul5ouS57ud5p+Q5Lqb57G75Z6L55qE5paH5Lu25ouW5YWl6L+b5p2l44CC55uu5YmN5Y+q5pyJIGNocm9tZSDmj5Dkvpvov5nmoLfnmoQgQVBJ77yM5LiU5Y+q6IO96YCa6L+HIG1pbWUtdHlwZSDpqozor4HjgIJcbiAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiggb3B0cyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFvcHRzLmRuZCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0KCdwcmVkaWN0LXJ1bnRpbWUtdHlwZScpICE9PSAnaHRtbDUnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVHbG9iYWxEbmQ6IG9wdHMuZGlzYWJsZUdsb2JhbERuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogb3B0cy5kbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6IG9wdHMuYWNjZXB0XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBkbmQ7XG4gICAgXG4gICAgICAgICAgICAgICAgZG5kID0gbmV3IERuZCggb3B0aW9ucyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGRuZC5vbmNlKCAncmVhZHknLCBkZWZlcnJlZC5yZXNvbHZlICk7XG4gICAgICAgICAgICAgICAgZG5kLm9uKCAnZHJvcCcsIGZ1bmN0aW9uKCBmaWxlcyApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVxdWVzdCggJ2FkZC1maWxlJywgWyBmaWxlcyBdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDmo4DmtYvmlofku7bmmK/lkKblhajpg6jlhYHorrjmt7vliqDjgIJcbiAgICAgICAgICAgICAgICBkbmQub24oICdhY2NlcHQnLCBmdW5jdGlvbiggaXRlbXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5vd25lci50cmlnZ2VyKCAnZG5kQWNjZXB0JywgaXRlbXMgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBkbmQuaW5pdCgpO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg6ZSZ6K+v5L+h5oGvXG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvZmlsZXBhc3RlJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ21lZGlhdG9yJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciwgUnVudGltZUNsZW50ICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gRmlsZVBhc3RlKCBvcHRzICkge1xuICAgICAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRzICk7XG4gICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9ICQoIG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHkgKTtcbiAgICAgICAgICAgIFJ1bnRpbWVDbGVudC5jYWxsKCB0aGlzLCAnRmlsZVBhc3RlJyApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGVudCwge1xuICAgICAgICAgICAgY29uc3RydWN0b3I6IEZpbGVQYXN0ZSxcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuY29ubmVjdFJ1bnRpbWUoIG1lLm9wdGlvbnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCdpbml0Jyk7XG4gICAgICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIEZpbGVQYXN0ZS5wcm90b3R5cGUgKTtcbiAgICBcbiAgICAgICAgcmV0dXJuIEZpbGVQYXN0ZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOe7hOS7tuWfuuexu+OAglxuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9maWxlcGFzdGUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAnbGliL2ZpbGVwYXN0ZScsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIsIEZpbGVQYXN0ZSApIHtcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge1NlbGVjdG9yfSBbcGFzdGU9dW5kZWZpbmVkXSAg5oyH5a6a55uR5ZCscGFzdGXkuovku7bnmoTlrrnlmajvvIzlpoLmnpzkuI3mjIflrprvvIzkuI3lkK/nlKjmraTlip/og73jgILmraTlip/og73kuLrpgJrov4fnspjotLTmnaXmt7vliqDmiKrlsY/nmoTlm77niYfjgILlu7rorq7orr7nva7kuLpgZG9jdW1lbnQuYm9keWAuXG4gICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhb3B0cy5wYXN0ZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0KCdwcmVkaWN0LXJ1bnRpbWUtdHlwZScpICE9PSAnaHRtbDUnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkID0gQmFzZS5EZWZlcnJlZCgpLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogb3B0cy5wYXN0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdDogb3B0cy5hY2NlcHRcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIHBhc3RlO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhc3RlID0gbmV3IEZpbGVQYXN0ZSggb3B0aW9ucyApO1xuICAgIFxuICAgICAgICAgICAgICAgIHBhc3RlLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICBwYXN0ZS5vbiggJ3Bhc3RlJywgZnVuY3Rpb24oIGZpbGVzICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5vd25lci5yZXF1ZXN0KCAnYWRkLWZpbGUnLCBbIGZpbGVzIF0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHBhc3RlLmluaXQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEJsb2JcbiAgICAgKi9cbiAgICBkZWZpbmUoJ2xpYi9ibG9iJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lQ2xpZW50ICkge1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBCbG9iKCBydWlkLCBzb3VyY2UgKSB7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgbWUuc291cmNlID0gc291cmNlO1xuICAgICAgICAgICAgbWUucnVpZCA9IHJ1aWQ7XG4gICAgXG4gICAgICAgICAgICBSdW50aW1lQ2xpZW50LmNhbGwoIG1lLCAnQmxvYicgKTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMudWlkID0gc291cmNlLnVpZCB8fCB0aGlzLnVpZDtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHNvdXJjZS50eXBlIHx8ICcnO1xuICAgICAgICAgICAgdGhpcy5zaXplID0gc291cmNlLnNpemUgfHwgMDtcbiAgICBcbiAgICAgICAgICAgIGlmICggcnVpZCApIHtcbiAgICAgICAgICAgICAgICBtZS5jb25uZWN0UnVudGltZSggcnVpZCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgXG4gICAgICAgIEJhc2UuaW5oZXJpdHMoIFJ1bnRpbWVDbGllbnQsIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBCbG9iLFxuICAgIFxuICAgICAgICAgICAgc2xpY2U6IGZ1bmN0aW9uKCBzdGFydCwgZW5kICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWMoICdzbGljZScsIHN0YXJ0LCBlbmQgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNvdXJjZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIHJldHVybiBCbG9iO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIOS4uuS6hue7n+S4gOWMlkZsYXNo55qERmlsZeWSjEhUTUw155qERmlsZeiAjOWtmOWcqOOAglxuICAgICAqIOS7peiHs+S6juimgeiwg+eUqEZsYXNo6YeM6Z2i55qERmlsZe+8jOS5n+WPr+S7peWDj+iwg+eUqEhUTUw154mI5pys55qERmlsZeS4gOS4i+OAglxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRmlsZVxuICAgICAqL1xuICAgIGRlZmluZSgnbGliL2ZpbGUnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAnbGliL2Jsb2InXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEJsb2IgKSB7XG4gICAgXG4gICAgICAgIHZhciB1aWQgPSAxLFxuICAgICAgICAgICAgckV4dCA9IC9cXC4oW14uXSspJC87XG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIEZpbGUoIHJ1aWQsIGZpbGUgKSB7XG4gICAgICAgICAgICB2YXIgZXh0O1xuICAgIFxuICAgICAgICAgICAgQmxvYi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBmaWxlLm5hbWUgfHwgKCd1bnRpdGxlZCcgKyB1aWQrKyk7XG4gICAgICAgICAgICBleHQgPSByRXh0LmV4ZWMoIGZpbGUubmFtZSApID8gUmVnRXhwLiQxLnRvTG93ZXJDYXNlKCkgOiAnJztcbiAgICBcbiAgICAgICAgICAgIC8vIHRvZG8g5pSv5oyB5YW25LuW57G75Z6L5paH5Lu255qE6L2s5o2i44CCXG4gICAgXG4gICAgICAgICAgICAvLyDlpoLmnpzmnIltaW1ldHlwZSwg5L2G5piv5paH5Lu25ZCN6YeM6Z2i5rKh5pyJ5om+5Ye65ZCO57yA6KeE5b6LXG4gICAgICAgICAgICBpZiAoICFleHQgJiYgdGhpcy50eXBlICkge1xuICAgICAgICAgICAgICAgIGV4dCA9IC9cXC8oanBnfGpwZWd8cG5nfGdpZnxibXApJC9pLmV4ZWMoIHRoaXMudHlwZSApID9cbiAgICAgICAgICAgICAgICAgICAgICAgIFJlZ0V4cC4kMS50b0xvd2VyQ2FzZSgpIDogJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5uYW1lICs9ICcuJyArIGV4dDtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIOWmguaenOayoeacieaMh+Wumm1pbWV0eXBlLCDkvYbmmK/nn6XpgZPmlofku7blkI7nvIDjgIJcbiAgICAgICAgICAgIGlmICggIXRoaXMudHlwZSAmJiAgfidqcGcsanBlZyxwbmcsZ2lmLGJtcCcuaW5kZXhPZiggZXh0ICkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ2ltYWdlLycgKyAoZXh0ID09PSAnanBnJyA/ICdqcGVnJyA6IGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB0aGlzLmV4dCA9IGV4dDtcbiAgICAgICAgICAgIHRoaXMubGFzdE1vZGlmaWVkRGF0ZSA9IGZpbGUubGFzdE1vZGlmaWVkRGF0ZSB8fFxuICAgICAgICAgICAgICAgICAgICAobmV3IERhdGUoKSkudG9Mb2NhbGVTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4gQmFzZS5pbmhlcml0cyggQmxvYiwgRmlsZSApO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg6ZSZ6K+v5L+h5oGvXG4gICAgICovXG4gICAgZGVmaW5lKCdsaWIvZmlsZXBpY2tlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCcsXG4gICAgICAgICdsaWIvZmlsZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZUNsZW50LCBGaWxlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gRmlsZVBpY2tlciggb3B0cyApIHtcbiAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRmlsZVBpY2tlci5vcHRpb25zLCBvcHRzICk7XG4gICAgXG4gICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9ICQoIG9wdHMuaWQgKTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIW9wdHMuY29udGFpbmVyLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aMiemSruaMh+WumumUmeivrycpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgb3B0cy5pbm5lckhUTUwgPSBvcHRzLmlubmVySFRNTCB8fCBvcHRzLmxhYmVsIHx8XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyLmh0bWwoKSB8fCAnJztcbiAgICBcbiAgICAgICAgICAgIG9wdHMuYnV0dG9uID0gJCggb3B0cy5idXR0b24gfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykgKTtcbiAgICAgICAgICAgIG9wdHMuYnV0dG9uLmh0bWwoIG9wdHMuaW5uZXJIVE1MICk7XG4gICAgICAgICAgICBvcHRzLmNvbnRhaW5lci5odG1sKCBvcHRzLmJ1dHRvbiApO1xuICAgIFxuICAgICAgICAgICAgUnVudGltZUNsZW50LmNhbGwoIHRoaXMsICdGaWxlUGlja2VyJywgdHJ1ZSApO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIEZpbGVQaWNrZXIub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGJ1dHRvbjogbnVsbCxcbiAgICAgICAgICAgIGNvbnRhaW5lcjogbnVsbCxcbiAgICAgICAgICAgIGxhYmVsOiBudWxsLFxuICAgICAgICAgICAgaW5uZXJIVE1MOiBudWxsLFxuICAgICAgICAgICAgbXVsdGlwbGU6IHRydWUsXG4gICAgICAgICAgICBhY2NlcHQ6IG51bGwsXG4gICAgICAgICAgICBuYW1lOiAnZmlsZSdcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgQmFzZS5pbmhlcml0cyggUnVudGltZUNsZW50LCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogRmlsZVBpY2tlcixcbiAgICBcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBidXR0b24gPSBvcHRzLmJ1dHRvbjtcbiAgICBcbiAgICAgICAgICAgICAgICBidXR0b24uYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2snKTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5vbiggJ2FsbCcsIGZ1bmN0aW9uKCB0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZXM7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoIHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdtb3VzZWVudGVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24uYWRkQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2staG92ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ21vdXNlbGVhdmUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5yZW1vdmVDbGFzcygnd2VidXBsb2FkZXItcGljay1ob3ZlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hhbmdlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlcyA9IG1lLmV4ZWMoJ2dldEZpbGVzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ3NlbGVjdCcsICQubWFwKCBmaWxlcywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUgPSBuZXcgRmlsZSggbWUuZ2V0UnVpZCgpLCBmaWxlICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiusOW9leadpea6kOOAglxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLl9yZWZlciA9IG9wdHMuY29udGFpbmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSwgb3B0cy5jb250YWluZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLmNvbm5lY3RSdW50aW1lKCBvcHRzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCAnaW5pdCcsIG9wdHMgKTtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAkKCB3aW5kb3cgKS5vbiggJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVmcmVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNoaW1Db250YWluZXIgPSB0aGlzLmdldFJ1bnRpbWUoKS5nZXRDb250YWluZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uID0gdGhpcy5vcHRpb25zLmJ1dHRvbixcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBidXR0b24ub3V0ZXJXaWR0aCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLm91dGVyV2lkdGgoKSA6IGJ1dHRvbi53aWR0aCgpLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBidXR0b24ub3V0ZXJIZWlnaHQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5vdXRlckhlaWdodCgpIDogYnV0dG9uLmhlaWdodCgpLFxuICAgIFxuICAgICAgICAgICAgICAgICAgICBwb3MgPSBidXR0b24ub2Zmc2V0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgd2lkdGggJiYgaGVpZ2h0ICYmIHNoaW1Db250YWluZXIuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICsgJ3B4J1xuICAgICAgICAgICAgICAgIH0pLm9mZnNldCggcG9zICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnRuID0gdGhpcy5vcHRpb25zLmJ1dHRvbjtcbiAgICBcbiAgICAgICAgICAgICAgICBidG4ucmVtb3ZlQ2xhc3MoJ3dlYnVwbG9hZGVyLXBpY2stZGlzYWJsZScpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBidG4gPSB0aGlzLm9wdGlvbnMuYnV0dG9uO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UnVudGltZSgpLmdldENvbnRhaW5lcigpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogJy05OTk5OXB4J1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGJ0bi5hZGRDbGFzcygnd2VidXBsb2FkZXItcGljay1kaXNhYmxlJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnJ1bnRpbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhlYygnZGVzdHJveScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIEZpbGVQaWNrZXI7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDmlofku7bpgInmi6nnm7jlhbNcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3dpZGdldHMvZmlsZXBpY2tlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdsaWIvZmlsZXBpY2tlcicsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgVXBsb2FkZXIsIEZpbGVQaWNrZXIgKSB7XG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICAkLmV4dGVuZCggVXBsb2FkZXIub3B0aW9ucywge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge1NlbGVjdG9yIHwgT2JqZWN0fSBbcGljaz11bmRlZmluZWRdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmjIflrprpgInmi6nmlofku7bnmoTmjInpkq7lrrnlmajvvIzkuI3mjIflrprliJnkuI3liJvlu7rmjInpkq7jgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGBpZGAge1NlbGV0b3J9IOaMh+WumumAieaLqeaWh+S7tueahOaMiemSruWuueWZqO+8jOS4jeaMh+WumuWImeS4jeWIm+W7uuaMiemSruOAglxuICAgICAgICAgICAgICogKiBgbGFiZWxgIHtTdHJpbmd9IOivt+mHh+eUqCBgaW5uZXJIVE1MYCDku6Pmm79cbiAgICAgICAgICAgICAqICogYGlubmVySFRNTGAge1N0cmluZ30g5oyH5a6a5oyJ6ZKu5paH5a2X44CC5LiN5oyH5a6a5pe25LyY5YWI5LuO5oyH5a6a55qE5a655Zmo5Lit55yL5piv5ZCm6Ieq5bim5paH5a2X44CCXG4gICAgICAgICAgICAgKiAqIGBtdWx0aXBsZWAge0Jvb2xlYW59IOaYr+WQpuW8gOi1t+WQjOaXtumAieaLqeWkmuS4quaWh+S7tuiDveWKm+OAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwaWNrOiBudWxsLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Fycm95fSBbYWNjZXB0PW51bGxdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmjIflrprmjqXlj5flk6rkupvnsbvlnovnmoTmlofku7bjgIIg55Sx5LqO55uu5YmN6L+Y5pyJZXh06L2sbWltZVR5cGXooajvvIzmiYDku6Xov5nph4zpnIDopoHliIblvIDmjIflrprjgIJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAqIGB0aXRsZWAge1N0cmluZ30g5paH5a2X5o+P6L+wXG4gICAgICAgICAgICAgKiAqIGBleHRlbnNpb25zYCB7U3RyaW5nfSDlhYHorrjnmoTmlofku7blkI7nvIDvvIzkuI3luKbngrnvvIzlpJrkuKrnlKjpgJflj7fliIblibLjgIJcbiAgICAgICAgICAgICAqICogYG1pbWVUeXBlc2Age1N0cmluZ30g5aSa5Liq55So6YCX5Y+35YiG5Ymy44CCXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICog5aaC77yaXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogYGBgXG4gICAgICAgICAgICAgKiB7XG4gICAgICAgICAgICAgKiAgICAgdGl0bGU6ICdJbWFnZXMnLFxuICAgICAgICAgICAgICogICAgIGV4dGVuc2lvbnM6ICdnaWYsanBnLGpwZWcsYm1wLHBuZycsXG4gICAgICAgICAgICAgKiAgICAgbWltZVR5cGVzOiAnaW1hZ2UvKidcbiAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAqIGBgYFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhY2NlcHQ6IG51bGwvKntcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0ltYWdlcycsXG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uczogJ2dpZixqcGcsanBlZyxibXAscG5nJyxcbiAgICAgICAgICAgICAgICBtaW1lVHlwZXM6ICdpbWFnZS8qJ1xuICAgICAgICAgICAgfSovXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgJ2FkZC1idG4nOiAnYWRkQnV0dG9uJyxcbiAgICAgICAgICAgIHJlZnJlc2g6ICdyZWZyZXNoJyxcbiAgICAgICAgICAgIGRpc2FibGU6ICdkaXNhYmxlJyxcbiAgICAgICAgICAgIGVuYWJsZTogJ2VuYWJsZSdcbiAgICAgICAgfSwge1xuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5waWNrZXJzID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMucGljayAmJiB0aGlzLmFkZEJ1dHRvbiggb3B0cy5waWNrICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVmcmVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCB0aGlzLnBpY2tlcnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgYWRkQnV0dG9uXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBhZGRCdXR0b24oIHBpY2sgKSA9PiBQcm9taXNlXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAqIOa3u+WKoOaWh+S7tumAieaLqeaMiemSru+8jOWmguaenOS4gOS4quaMiemSruS4jeWkn++8jOmcgOimgeiwg+eUqOatpOaWueazleadpea3u+WKoOOAguWPguaVsOi3n1tvcHRpb25zLnBpY2tdKCNXZWJVcGxvYWRlcjpVcGxvYWRlcjpvcHRpb25zKeS4gOiHtOOAglxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHVwbG9hZGVyLmFkZEJ1dHRvbih7XG4gICAgICAgICAgICAgKiAgICAgaWQ6ICcjYnRuQ29udGFpbmVyJyxcbiAgICAgICAgICAgICAqICAgICBpbm5lckhUTUw6ICfpgInmi6nmlofku7YnXG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkQnV0dG9uOiBmdW5jdGlvbiggcGljayApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gbWUub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0ID0gb3B0cy5hY2NlcHQsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMsIHBpY2tlciwgZGVmZXJyZWQ7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAhcGljayApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgICAgICAkLmlzUGxhaW5PYmplY3QoIHBpY2sgKSB8fCAocGljayA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHBpY2tcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHBpY2ssIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0OiAkLmlzUGxhaW5PYmplY3QoIGFjY2VwdCApID8gWyBhY2NlcHQgXSA6IGFjY2VwdCxcbiAgICAgICAgICAgICAgICAgICAgc3dmOiBvcHRzLnN3ZixcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZU9yZGVyOiBvcHRzLnJ1bnRpbWVPcmRlclxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHBpY2tlciA9IG5ldyBGaWxlUGlja2VyKCBvcHRpb25zICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcGlja2VyLm9uY2UoICdyZWFkeScsIGRlZmVycmVkLnJlc29sdmUgKTtcbiAgICAgICAgICAgICAgICBwaWNrZXIub24oICdzZWxlY3QnLCBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnJlcXVlc3QoICdhZGQtZmlsZScsIFsgZmlsZXMgXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGlja2VyLmluaXQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLnBpY2tlcnMucHVzaCggcGlja2VyICk7XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkLmVhY2goIHRoaXMucGlja2VycywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCB0aGlzLnBpY2tlcnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVuYWJsZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOaWh+S7tuWxnuaAp+WwgeijhVxuICAgICAqL1xuICAgIGRlZmluZSgnZmlsZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgaWRQcmVmaXggPSAnV1VfRklMRV8nLFxuICAgICAgICAgICAgaWRTdWZmaXggPSAwLFxuICAgICAgICAgICAgckV4dCA9IC9cXC4oW14uXSspJC8sXG4gICAgICAgICAgICBzdGF0dXNNYXAgPSB7fTtcbiAgICBcbiAgICAgICAgZnVuY3Rpb24gZ2lkKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlkUHJlZml4ICsgaWRTdWZmaXgrKztcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICog5paH5Lu257G7XG4gICAgICAgICAqIEBjbGFzcyBGaWxlXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvciDmnoTpgKDlh73mlbBcbiAgICAgICAgICogQGdyYW1tYXIgbmV3IEZpbGUoIHNvdXJjZSApID0+IEZpbGVcbiAgICAgICAgICogQHBhcmFtIHtMaWIuRmlsZX0gc291cmNlIFtsaWIuRmlsZV0oI0xpYi5GaWxlKeWunuS+iywg5q2kc291cmNl5a+56LGh5piv5bim5pyJUnVudGltZeS/oeaBr+eahOOAglxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gV1VGaWxlKCBzb3VyY2UgKSB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuWQje+8jOWMheaLrOaJqeWxleWQje+8iOWQjue8gO+8iVxuICAgICAgICAgICAgICogQHByb3BlcnR5IG5hbWVcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMubmFtZSA9IHNvdXJjZS5uYW1lIHx8ICdVbnRpdGxlZCc7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuS9k+enr++8iOWtl+iKgu+8iVxuICAgICAgICAgICAgICogQHByb3BlcnR5IHNpemVcbiAgICAgICAgICAgICAqIEB0eXBlIHt1aW50fVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnNpemUgPSBzb3VyY2Uuc2l6ZSB8fCAwO1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlofku7ZNSU1FVFlQReexu+Wei++8jOS4juaWh+S7tuexu+Wei+eahOWvueW6lOWFs+ezu+ivt+WPguiAg1todHRwOi8vdC5jbi96OFpuRm55XShodHRwOi8vdC5jbi96OFpuRm55KVxuICAgICAgICAgICAgICogQHByb3BlcnR5IHR5cGVcbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCAnYXBwbGljYXRpb24nXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHNvdXJjZS50eXBlIHx8ICdhcHBsaWNhdGlvbic7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuacgOWQjuS/ruaUueaXpeacn1xuICAgICAgICAgICAgICogQHByb3BlcnR5IGxhc3RNb2RpZmllZERhdGVcbiAgICAgICAgICAgICAqIEB0eXBlIHtpbnR9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCDlvZPliY3ml7bpl7TmiLNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5sYXN0TW9kaWZpZWREYXRlID0gc291cmNlLmxhc3RNb2RpZmllZERhdGUgfHwgKG5ldyBEYXRlKCkgKiAxKTtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5paH5Lu2SUTvvIzmr4/kuKrlr7nosaHlhbfmnInllK/kuIBJRO+8jOS4juaWh+S7tuWQjeaXoOWFs1xuICAgICAgICAgICAgICogQHByb3BlcnR5IGlkXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmlkID0gZ2lkKCk7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaWh+S7tuaJqeWxleWQje+8jOmAmui/h+aWh+S7tuWQjeiOt+WPlu+8jOS+i+WmgnRlc3QucG5n55qE5omp5bGV5ZCN5Li6cG5nXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgZXh0XG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmV4dCA9IHJFeHQuZXhlYyggdGhpcy5uYW1lICkgPyBSZWdFeHAuJDEgOiAnJztcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog54q25oCB5paH5a2X6K+05piO44CC5Zyo5LiN5ZCM55qEc3RhdHVz6K+t5aKD5LiL5pyJ5LiN5ZCM55qE55So6YCU44CCXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgc3RhdHVzVGV4dFxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gJyc7XG4gICAgXG4gICAgICAgICAgICAvLyDlrZjlgqjmlofku7bnirbmgIHvvIzpmLLmraLpgJrov4flsZ7mgKfnm7TmjqXkv67mlLlcbiAgICAgICAgICAgIHN0YXR1c01hcFsgdGhpcy5pZCBdID0gV1VGaWxlLlN0YXR1cy5JTklURUQ7XG4gICAgXG4gICAgICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgICAgIHRoaXMubG9hZGVkID0gMDtcbiAgICBcbiAgICAgICAgICAgIHRoaXMub24oICdlcnJvcicsIGZ1bmN0aW9uKCBtc2cgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXMoIFdVRmlsZS5TdGF0dXMuRVJST1IsIG1zZyApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFdVRmlsZS5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6+572u54q25oCB77yM54q25oCB5Y+Y5YyW5pe25Lya6Kem5Y+RYGNoYW5nZWDkuovku7bjgIJcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc2V0U3RhdHVzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBzZXRTdGF0dXMoIHN0YXR1c1ssIHN0YXR1c1RleHRdICk7XG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGUuU3RhdHVzfFN0cmluZ30gc3RhdHVzIFvmlofku7bnirbmgIHlgLxdKCNXZWJVcGxvYWRlcjpGaWxlOkZpbGUuU3RhdHVzKVxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtzdGF0dXNUZXh0PScnXSDnirbmgIHor7TmmI7vvIzluLjlnKhlcnJvcuaXtuS9v+eUqO+8jOeUqGh0dHAsIGFib3J0LHNlcnZlcuetieadpeagh+iusOaYr+eUseS6juS7gOS5iOWOn+WboOWvvOiHtOaWh+S7tumUmeivr+OAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMsIHRleHQgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIHByZXZTdGF0dXMgPSBzdGF0dXNNYXBbIHRoaXMuaWQgXTtcbiAgICBcbiAgICAgICAgICAgICAgICB0eXBlb2YgdGV4dCAhPT0gJ3VuZGVmaW5lZCcgJiYgKHRoaXMuc3RhdHVzVGV4dCA9IHRleHQpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggc3RhdHVzICE9PSBwcmV2U3RhdHVzICkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNNYXBbIHRoaXMuaWQgXSA9IHN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIOaWh+S7tueKtuaAgeWPmOWMllxuICAgICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgc3RhdHVzY2hhbmdlXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoICdzdGF0dXNjaGFuZ2UnLCBzdGF0dXMsIHByZXZTdGF0dXMgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDojrflj5bmlofku7bnirbmgIFcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0ZpbGUuU3RhdHVzfVxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAgICAgICAgIOaWh+S7tueKtuaAgeWFt+S9k+WMheaLrOS7peS4i+WHoOenjeexu+Wei++8mlxuICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWIneWni+WMllxuICAgICAgICAgICAgICAgICAgICAgICAgSU5JVEVEOiAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW3suWFpemYn+WIl1xuICAgICAgICAgICAgICAgICAgICAgICAgUVVFVUVEOiAgICAgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOato+WcqOS4iuS8oFxuICAgICAgICAgICAgICAgICAgICAgICAgUFJPR1JFU1M6ICAgICAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LiK5Lyg5Ye66ZSZXG4gICAgICAgICAgICAgICAgICAgICAgICBFUlJPUjogICAgICAgICAzLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LiK5Lyg5oiQ5YqfXG4gICAgICAgICAgICAgICAgICAgICAgICBDT01QTEVURTogICAgIDQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkuIrkvKDlj5bmtohcbiAgICAgICAgICAgICAgICAgICAgICAgIENBTkNFTExFRDogICAgIDVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0dXNNYXBbIHRoaXMuaWQgXTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiOt+WPluaWh+S7tuWOn+Wni+S/oeaBr+OAglxuICAgICAgICAgICAgICogQHJldHVybiB7Kn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0U291cmNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdG9yeTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHN0YXR1c01hcFsgdGhpcy5pZCBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgTWVkaWF0b3IuaW5zdGFsbFRvKCBXVUZpbGUucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmlofku7bnirbmgIHlgLzvvIzlhbfkvZPljIXmi6zku6XkuIvlh6Dnp43nsbvlnovvvJpcbiAgICAgICAgICogKiBgaW5pdGVkYCDliJ3lp4vnirbmgIFcbiAgICAgICAgICogKiBgcXVldWVkYCDlt7Lnu4/ov5vlhaXpmJ/liJcsIOetieW+heS4iuS8oFxuICAgICAgICAgKiAqIGBwcm9ncmVzc2Ag5LiK5Lyg5LitXG4gICAgICAgICAqICogYGNvbXBsZXRlYCDkuIrkvKDlrozmiJDjgIJcbiAgICAgICAgICogKiBgZXJyb3JgIOS4iuS8oOWHuumUme+8jOWPr+mHjeivlVxuICAgICAgICAgKiAqIGBpbnRlcnJ1cHRgIOS4iuS8oOS4reaWre+8jOWPr+e7reS8oOOAglxuICAgICAgICAgKiAqIGBpbnZhbGlkYCDmlofku7bkuI3lkIjmoLzvvIzkuI3og73ph43or5XkuIrkvKDjgILkvJroh6rliqjku47pmJ/liJfkuK3np7vpmaTjgIJcbiAgICAgICAgICogKiBgY2FuY2VsbGVkYCDmlofku7booqvnp7vpmaTjgIJcbiAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFN0YXR1c1xuICAgICAgICAgKiBAbmFtZXNwYWNlIEZpbGVcbiAgICAgICAgICogQGNsYXNzIEZpbGVcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKi9cbiAgICAgICAgV1VGaWxlLlN0YXR1cyA9IHtcbiAgICAgICAgICAgIElOSVRFRDogICAgICdpbml0ZWQnLCAgICAvLyDliJ3lp4vnirbmgIFcbiAgICAgICAgICAgIFFVRVVFRDogICAgICdxdWV1ZWQnLCAgICAvLyDlt7Lnu4/ov5vlhaXpmJ/liJcsIOetieW+heS4iuS8oFxuICAgICAgICAgICAgUFJPR1JFU1M6ICAgJ3Byb2dyZXNzJywgICAgLy8g5LiK5Lyg5LitXG4gICAgICAgICAgICBFUlJPUjogICAgICAnZXJyb3InLCAgICAvLyDkuIrkvKDlh7rplJnvvIzlj6/ph43or5VcbiAgICAgICAgICAgIENPTVBMRVRFOiAgICdjb21wbGV0ZScsICAgIC8vIOS4iuS8oOWujOaIkOOAglxuICAgICAgICAgICAgQ0FOQ0VMTEVEOiAgJ2NhbmNlbGxlZCcsICAgIC8vIOS4iuS8oOWPlua2iOOAglxuICAgICAgICAgICAgSU5URVJSVVBUOiAgJ2ludGVycnVwdCcsICAgIC8vIOS4iuS8oOS4reaWre+8jOWPr+e7reS8oOOAglxuICAgICAgICAgICAgSU5WQUxJRDogICAgJ2ludmFsaWQnICAgIC8vIOaWh+S7tuS4jeWQiOagvO+8jOS4jeiDvemHjeivleS4iuS8oOOAglxuICAgICAgICB9O1xuICAgIFxuICAgICAgICByZXR1cm4gV1VGaWxlO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcg5paH5Lu26Zif5YiXXG4gICAgICovXG4gICAgZGVmaW5lKCdxdWV1ZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdtZWRpYXRvcicsXG4gICAgICAgICdmaWxlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBNZWRpYXRvciwgV1VGaWxlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIFNUQVRVUyA9IFdVRmlsZS5TdGF0dXM7XG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmlofku7bpmJ/liJcsIOeUqOadpeWtmOWCqOWQhOS4queKtuaAgeS4reeahOaWh+S7tuOAglxuICAgICAgICAgKiBAY2xhc3MgUXVldWVcbiAgICAgICAgICogQGV4dGVuZHMgTWVkaWF0b3JcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIFF1ZXVlKCkge1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnu5/orqHmlofku7bmlbDjgIJcbiAgICAgICAgICAgICAqICogYG51bU9mUXVldWVgIOmYn+WIl+S4reeahOaWh+S7tuaVsOOAglxuICAgICAgICAgICAgICogKiBgbnVtT2ZTdWNjZXNzYCDkuIrkvKDmiJDlip/nmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqICogYG51bU9mQ2FuY2VsYCDooqvnp7vpmaTnmoTmlofku7bmlbBcbiAgICAgICAgICAgICAqICogYG51bU9mUHJvZ3Jlc3NgIOato+WcqOS4iuS8oOS4reeahOaWh+S7tuaVsFxuICAgICAgICAgICAgICogKiBgbnVtT2ZVcGxvYWRGYWlsZWRgIOS4iuS8oOmUmeivr+eahOaWh+S7tuaVsOOAglxuICAgICAgICAgICAgICogKiBgbnVtT2ZJbnZhbGlkYCDml6DmlYjnmoTmlofku7bmlbDjgIJcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBzdGF0c1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnN0YXRzID0ge1xuICAgICAgICAgICAgICAgIG51bU9mUXVldWU6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZTdWNjZXNzOiAwLFxuICAgICAgICAgICAgICAgIG51bU9mQ2FuY2VsOiAwLFxuICAgICAgICAgICAgICAgIG51bU9mUHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZVcGxvYWRGYWlsZWQ6IDAsXG4gICAgICAgICAgICAgICAgbnVtT2ZJbnZhbGlkOiAwXG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8g5LiK5Lyg6Zif5YiX77yM5LuF5YyF5ous562J5b6F5LiK5Lyg55qE5paH5Lu2XG4gICAgICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgIFxuICAgICAgICAgICAgLy8g5a2Y5YKo5omA5pyJ5paH5Lu2XG4gICAgICAgICAgICB0aGlzLl9tYXAgPSB7fTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICAkLmV4dGVuZCggUXVldWUucHJvdG90eXBlLCB7XG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWwhuaWsOaWh+S7tuWKoOWFpeWvuemYn+WIl+WwvumDqFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZXRob2QgYXBwZW5kXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtGaWxlfSBmaWxlICAg5paH5Lu25a+56LGhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFwcGVuZDogZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcXVldWUucHVzaCggZmlsZSApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVBZGRlZCggZmlsZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5bCG5paw5paH5Lu25Yqg5YWl5a+56Zif5YiX5aS06YOoXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQG1ldGhvZCBwcmVwZW5kXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtGaWxlfSBmaWxlICAg5paH5Lu25a+56LGhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZXBlbmQ6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnVuc2hpZnQoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWxlQWRkZWQoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiOt+WPluaWh+S7tuWvueixoVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBtZXRob2QgZ2V0RmlsZVxuICAgICAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlSWQgICDmlofku7ZJRFxuICAgICAgICAgICAgICogQHJldHVybiB7RmlsZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RmlsZTogZnVuY3Rpb24oIGZpbGVJZCApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBmaWxlSWQgIT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZUlkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFwWyBmaWxlSWQgXTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOS7jumYn+WIl+S4reWPluWHuuS4gOS4quaMh+WumueKtuaAgeeahOaWh+S7tuOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgZmV0Y2goIHN0YXR1cyApID0+IEZpbGVcbiAgICAgICAgICAgICAqIEBtZXRob2QgZmV0Y2hcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdGF0dXMgW+aWh+S7tueKtuaAgeWAvF0oI1dlYlVwbG9hZGVyOkZpbGU6RmlsZS5TdGF0dXMpXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtGaWxlfSBbRmlsZV0oI1dlYlVwbG9hZGVyOkZpbGUpXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZldGNoOiBmdW5jdGlvbiggc3RhdHVzICkge1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLl9xdWV1ZS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGksIGZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgc3RhdHVzID0gc3RhdHVzIHx8IFNUQVRVUy5RVUVVRUQ7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHRoaXMuX3F1ZXVlWyBpIF07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggc3RhdHVzID09PSBmaWxlLmdldFN0YXR1cygpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlr7npmJ/liJfov5vooYzmjpLluo/vvIzog73lpJ/mjqfliLbmlofku7bkuIrkvKDpobrluo/jgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHNvcnQoIGZuICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHNvcnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIOaOkuW6j+aWueazlVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzb3J0OiBmdW5jdGlvbiggZm4gKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNvcnQoIGZuICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6I635Y+W5oyH5a6a57G75Z6L55qE5paH5Lu25YiX6KGoLCDliJfooajkuK3mr4/kuIDkuKrmiJDlkZjkuLpbRmlsZV0oI1dlYlVwbG9hZGVyOkZpbGUp5a+56LGh44CCXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRGaWxlcyggW3N0YXR1czFbLCBzdGF0dXMyIC4uLl1dICkgPT4gQXJyYXlcbiAgICAgICAgICAgICAqIEBtZXRob2QgZ2V0RmlsZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbc3RhdHVzXSBb5paH5Lu254q25oCB5YC8XSgjV2ViVXBsb2FkZXI6RmlsZTpGaWxlLlN0YXR1cylcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RmlsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBzdHMgPSBbXS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDAgKSxcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLl9xdWV1ZS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSB0aGlzLl9xdWV1ZVsgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN0cy5sZW5ndGggJiYgIX4kLmluQXJyYXkoIGZpbGUuZ2V0U3RhdHVzKCksIHN0cyApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goIGZpbGUgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfZmlsZUFkZGVkOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBleGlzdGluZyA9IHRoaXMuX21hcFsgZmlsZS5pZCBdO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWV4aXN0aW5nICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXBbIGZpbGUuaWQgXSA9IGZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGZpbGUub24oICdzdGF0dXNjaGFuZ2UnLCBmdW5jdGlvbiggY3VyLCBwcmUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fb25GaWxlU3RhdHVzQ2hhbmdlKCBjdXIsIHByZSApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFNUQVRVUy5RVUVVRUQgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfb25GaWxlU3RhdHVzQ2hhbmdlOiBmdW5jdGlvbiggY3VyU3RhdHVzLCBwcmVTdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRzID0gdGhpcy5zdGF0cztcbiAgICBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBwcmVTdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLlBST0dSRVNTOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHMubnVtT2ZQcm9ncmVzcy0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLlFVRVVFRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mUXVldWUgLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuRVJST1I6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlVwbG9hZEZhaWxlZC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLklOVkFMSUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZkludmFsaWQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBjdXJTdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLlFVRVVFRDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mUXVldWUrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5QUk9HUkVTUzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mUHJvZ3Jlc3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5FUlJPUjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLm51bU9mVXBsb2FkRmFpbGVkKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBTVEFUVVMuQ09NUExFVEU6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZlN1Y2Nlc3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFNUQVRVUy5DQU5DRUxMRUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZkNhbmNlbCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgU1RBVFVTLklOVkFMSUQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0cy5udW1PZkludmFsaWQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIE1lZGlhdG9yLmluc3RhbGxUbyggUXVldWUucHJvdG90eXBlICk7XG4gICAgXG4gICAgICAgIHJldHVybiBRdWV1ZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOmYn+WIl1xuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy9xdWV1ZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICd1cGxvYWRlcicsXG4gICAgICAgICdxdWV1ZScsXG4gICAgICAgICdmaWxlJyxcbiAgICAgICAgJ2xpYi9maWxlJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50JyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgUXVldWUsIFdVRmlsZSwgRmlsZSwgUnVudGltZUNsaWVudCApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQsXG4gICAgICAgICAgICByRXh0ID0gL1xcLlxcdyskLyxcbiAgICAgICAgICAgIFN0YXR1cyA9IFdVRmlsZS5TdGF0dXM7XG4gICAgXG4gICAgICAgIHJldHVybiBVcGxvYWRlci5yZWdpc3Rlcih7XG4gICAgICAgICAgICAnc29ydC1maWxlcyc6ICdzb3J0RmlsZXMnLFxuICAgICAgICAgICAgJ2FkZC1maWxlJzogJ2FkZEZpbGVzJyxcbiAgICAgICAgICAgICdnZXQtZmlsZSc6ICdnZXRGaWxlJyxcbiAgICAgICAgICAgICdmZXRjaC1maWxlJzogJ2ZldGNoRmlsZScsXG4gICAgICAgICAgICAnZ2V0LXN0YXRzJzogJ2dldFN0YXRzJyxcbiAgICAgICAgICAgICdnZXQtZmlsZXMnOiAnZ2V0RmlsZXMnLFxuICAgICAgICAgICAgJ3JlbW92ZS1maWxlJzogJ3JlbW92ZUZpbGUnLFxuICAgICAgICAgICAgJ3JldHJ5JzogJ3JldHJ5JyxcbiAgICAgICAgICAgICdyZXNldCc6ICdyZXNldCcsXG4gICAgICAgICAgICAnYWNjZXB0LWZpbGUnOiAnYWNjZXB0RmlsZSdcbiAgICAgICAgfSwge1xuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQsIGxlbiwgaSwgaXRlbSwgYXJyLCBhY2NlcHQsIHJ1bnRpbWU7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCAkLmlzUGxhaW5PYmplY3QoIG9wdHMuYWNjZXB0ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuYWNjZXB0ID0gWyBvcHRzLmFjY2VwdCBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBhY2NlcHTkuK3nmoTkuK3nlJ/miJDljLnphY3mraPliJnjgIJcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuYWNjZXB0ICkge1xuICAgICAgICAgICAgICAgICAgICBhcnIgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGxlbiA9IG9wdHMuYWNjZXB0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IG9wdHMuYWNjZXB0WyBpIF0uZXh0ZW5zaW9ucztcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gJiYgYXJyLnB1c2goIGl0ZW0gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGFyci5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHQgPSAnXFxcXC4nICsgYXJyLmpvaW4oJywnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSggLywvZywgJyR8XFxcXC4nIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoIC9cXCovZywgJy4qJyApICsgJyQnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIG1lLmFjY2VwdCA9IG5ldyBSZWdFeHAoIGFjY2VwdCwgJ2knICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnF1ZXVlID0gbmV3IFF1ZXVlKCk7XG4gICAgICAgICAgICAgICAgbWUuc3RhdHMgPSBtZS5xdWV1ZS5zdGF0cztcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzlvZPliY3kuI3mmK9odG1sNei/kOihjOaXtu+8jOmCo+Wwseeul+S6huOAglxuICAgICAgICAgICAgICAgIC8vIOS4jeaJp+ihjOWQjue7reaTjeS9nFxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5yZXF1ZXN0KCdwcmVkaWN0LXJ1bnRpbWUtdHlwZScpICE9PSAnaHRtbDUnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWIm+W7uuS4gOS4qiBodG1sNSDov5DooYzml7bnmoQgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgICAgICAvLyDku6Xoh7Pkuo7lpJbpg6jmt7vliqDljp/nlJ8gRmlsZSDlr7nosaHnmoTml7blgJnog73mraPnoa7ljIXoo7nkuIDkuIvkvpsgd2VidXBsb2FkZXIg5L2/55So44CCXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBCYXNlLkRlZmVycmVkKCk7XG4gICAgICAgICAgICAgICAgcnVudGltZSA9IG5ldyBSdW50aW1lQ2xpZW50KCdQbGFjZWhvbGRlcicpO1xuICAgICAgICAgICAgICAgIHJ1bnRpbWUuY29ubmVjdFJ1bnRpbWUoe1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lT3JkZXI6ICdodG1sNSdcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3J1aWQgPSBydW50aW1lLmdldFJ1aWQoKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgIFxuICAgICAgICAgICAgLy8g5Li65LqG5pSv5oyB5aSW6YOo55u05o6l5re75Yqg5LiA5Liq5Y6f55SfRmlsZeWvueixoeOAglxuICAgICAgICAgICAgX3dyYXBGaWxlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICBpZiAoICEoZmlsZSBpbnN0YW5jZW9mIFdVRmlsZSkgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggIShmaWxlIGluc3RhbmNlb2YgRmlsZSkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICF0aGlzLl9ydWlkICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBhZGQgZXh0ZXJuYWwgZmlsZXMuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlID0gbmV3IEZpbGUoIHRoaXMuX3J1aWQsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gbmV3IFdVRmlsZSggZmlsZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDliKTmlq3mlofku7bmmK/lkKblj6/ku6XooqvliqDlhaXpmJ/liJdcbiAgICAgICAgICAgIGFjY2VwdEZpbGU6IGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBpbnZhbGlkID0gIWZpbGUgfHwgZmlsZS5zaXplIDwgNiB8fCB0aGlzLmFjY2VwdCAmJlxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5ZCN5a2X5Lit5pyJ5ZCO57yA77yM5omN5YGa5ZCO57yA55m95ZCN5Y2V5aSE55CG44CCXG4gICAgICAgICAgICAgICAgICAgICAgICByRXh0LmV4ZWMoIGZpbGUubmFtZSApICYmICF0aGlzLmFjY2VwdC50ZXN0KCBmaWxlLm5hbWUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gIWludmFsaWQ7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgYmVmb3JlRmlsZVF1ZXVlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmlofku7booqvliqDlhaXpmJ/liJfkuYvliY3op6blj5HvvIzmraTkuovku7bnmoRoYW5kbGVy6L+U5Zue5YC85Li6YGZhbHNlYO+8jOWImeatpOaWh+S7tuS4jeS8muiiq+a3u+WKoOi/m+WFpemYn+WIl+OAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgZmlsZVF1ZXVlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmlofku7booqvliqDlhaXpmJ/liJfku6XlkI7op6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIF9hZGRGaWxlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUgPSBtZS5fd3JhcEZpbGUoIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkuI3ov4fnsbvlnovliKTmlq3lhYHorrjkuI3lhYHorrjvvIzlhYjmtL7pgIEgYGJlZm9yZUZpbGVRdWV1ZWRgXG4gICAgICAgICAgICAgICAgaWYgKCAhbWUub3duZXIudHJpZ2dlciggJ2JlZm9yZUZpbGVRdWV1ZWQnLCBmaWxlICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g57G75Z6L5LiN5Yy56YWN77yM5YiZ5rS+6YCB6ZSZ6K+v5LqL5Lu277yM5bm26L+U5Zue44CCXG4gICAgICAgICAgICAgICAgaWYgKCAhbWUuYWNjZXB0RmlsZSggZmlsZSApICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAnZXJyb3InLCAnUV9UWVBFX0RFTklFRCcsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5xdWV1ZS5hcHBlbmQoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAnZmlsZVF1ZXVlZCcsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRGaWxlOiBmdW5jdGlvbiggZmlsZUlkICkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLmdldEZpbGUoIGZpbGVJZCApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IGZpbGVzUXVldWVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGVzIOaVsOe7hO+8jOWGheWuueS4uuWOn+Wni0ZpbGUobGliL0ZpbGXvvInlr7nosaHjgIJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPkuIDmibnmlofku7bmt7vliqDov5vpmJ/liJfku6XlkI7op6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCBhZGRGaWxlc1xuICAgICAgICAgICAgICogQGdyYW1tYXIgYWRkRmlsZXMoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGFkZEZpbGVzKCBbZmlsZTEsIGZpbGUyIC4uLl0gKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7QXJyYXkgb2YgRmlsZSBvciBGaWxlfSBbZmlsZXNdIEZpbGVzIOWvueixoSDmlbDnu4RcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmt7vliqDmlofku7bliLDpmJ/liJdcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFkZEZpbGVzOiBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICFmaWxlcy5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVzID0gWyBmaWxlcyBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlcyA9ICQubWFwKCBmaWxlcywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5fYWRkRmlsZSggZmlsZSApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICdmaWxlc1F1ZXVlZCcsIGZpbGVzICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5vcHRpb25zLmF1dG8gKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnJlcXVlc3QoJ3N0YXJ0LXVwbG9hZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRTdGF0czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHM7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgZmlsZURlcXVldWVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aWh+S7tuiiq+enu+mZpOmYn+WIl+WQjuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHJlbW92ZUZpbGVcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlbW92ZUZpbGUoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlbW92ZUZpbGUoIGlkICkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV8aWR9IGZpbGUgRmlsZeWvueixoeaIlui/mUZpbGXlr7nosaHnmoRpZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOenu+mZpOafkOS4gOaWh+S7tuOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogJGxpLm9uKCdjbGljaycsICcucmVtb3ZlLXRoaXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAqICAgICB1cGxvYWRlci5yZW1vdmVGaWxlKCBmaWxlICk7XG4gICAgICAgICAgICAgKiB9KVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZW1vdmVGaWxlOiBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlLmlkID8gZmlsZSA6IG1lLnF1ZXVlLmdldEZpbGUoIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkNBTkNFTExFRCApO1xuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICdmaWxlRGVxdWV1ZWQnLCBmaWxlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIGdldEZpbGVzXG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRGaWxlcygpID0+IEFycmF5XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBnZXRGaWxlcyggc3RhdHVzMSwgc3RhdHVzMiwgc3RhdHVzLi4uICkgPT4gQXJyYXlcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDov5Tlm57mjIflrprnirbmgIHnmoTmlofku7bpm4blkIjvvIzkuI3kvKDlj4LmlbDlsIbov5Tlm57miYDmnInnirbmgIHnmoTmlofku7bjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogY29uc29sZS5sb2coIHVwbG9hZGVyLmdldEZpbGVzKCkgKTsgICAgLy8gPT4gYWxsIGZpbGVzXG4gICAgICAgICAgICAgKiBjb25zb2xlLmxvZyggdXBsb2FkZXIuZ2V0RmlsZXMoJ2Vycm9yJykgKSAgICAvLyA9PiBhbGwgZXJyb3IgZmlsZXMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEZpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5nZXRGaWxlcy5hcHBseSggdGhpcy5xdWV1ZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZmV0Y2hGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5mZXRjaC5hcHBseSggdGhpcy5xdWV1ZSwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHJldHJ5XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciByZXRyeSgpID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGdyYW1tYXIgcmV0cnkoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDph43or5XkuIrkvKDvvIzph43or5XmjIflrprmlofku7bvvIzmiJbogIXku47lh7rplJnnmoTmlofku7blvIDlp4vph43mlrDkuIrkvKDjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogZnVuY3Rpb24gcmV0cnkoKSB7XG4gICAgICAgICAgICAgKiAgICAgdXBsb2FkZXIucmV0cnkoKTtcbiAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmV0cnk6IGZ1bmN0aW9uKCBmaWxlLCBub0ZvcmNlU3RhcnQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMsIGksIGxlbjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlLmlkID8gZmlsZSA6IG1lLnF1ZXVlLmdldEZpbGUoIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5RVUVVRUQgKTtcbiAgICAgICAgICAgICAgICAgICAgbm9Gb3JjZVN0YXJ0IHx8IG1lLnJlcXVlc3QoJ3N0YXJ0LXVwbG9hZCcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGZpbGVzID0gbWUucXVldWUuZ2V0RmlsZXMoIFN0YXR1cy5FUlJPUiApO1xuICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgIGxlbiA9IGZpbGVzLmxlbmd0aDtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGZpbGVzWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuUVVFVUVEICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnJlcXVlc3QoJ3N0YXJ0LXVwbG9hZCcpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG1ldGhvZCBzb3J0XG4gICAgICAgICAgICAgKiBAZ3JhbW1hciBzb3J0KCBmbiApID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaOkuW6j+mYn+WIl+S4reeahOaWh+S7tu+8jOWcqOS4iuS8oOS5i+WJjeiwg+aVtOWPr+S7peaOp+WItuS4iuS8oOmhuuW6j+OAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc29ydEZpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5zb3J0LmFwcGx5KCB0aGlzLnF1ZXVlLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBtZXRob2QgcmVzZXRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHJlc2V0KCkgPT4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6YeN572udXBsb2FkZXLjgILnm67liY3lj6rph43nva7kuobpmJ/liJfjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogdXBsb2FkZXIucmVzZXQoKTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucXVldWUgPSBuZXcgUXVldWUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRzID0gdGhpcy5xdWV1ZS5zdGF0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgXG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDmt7vliqDojrflj5ZSdW50aW1l55u45YWz5L+h5oGv55qE5pa55rOV44CCXG4gICAgICovXG4gICAgZGVmaW5lKCd3aWRnZXRzL3J1bnRpbWUnLFtcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZScsXG4gICAgICAgICd3aWRnZXRzL3dpZGdldCdcbiAgICBdLCBmdW5jdGlvbiggVXBsb2FkZXIsIFJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgIFVwbG9hZGVyLnN1cHBvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBSdW50aW1lLmhhc1J1bnRpbWUuYXBwbHkoIFJ1bnRpbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICByZXR1cm4gVXBsb2FkZXIucmVnaXN0ZXIoe1xuICAgICAgICAgICAgJ3ByZWRpY3QtcnVudGltZS10eXBlJzogJ3ByZWRpY3RSdW50bWVUeXBlJ1xuICAgICAgICB9LCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoICF0aGlzLnByZWRpY3RSdW50bWVUeXBlKCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdSdW50aW1lIEVycm9yJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6aKE5rWLVXBsb2FkZXLlsIbph4fnlKjlk6rkuKpgUnVudGltZWBcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHByZWRpY3RSdW50bWVUeXBlKCkgPT4gU3RyaW5nXG4gICAgICAgICAgICAgKiBAbWV0aG9kIHByZWRpY3RSdW50bWVUeXBlXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwcmVkaWN0UnVudG1lVHlwZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9yZGVycyA9IHRoaXMub3B0aW9ucy5ydW50aW1lT3JkZXIgfHwgUnVudGltZS5vcmRlcnMsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0aGlzLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGksIGxlbjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoICF0eXBlICkge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcnMgPSBvcmRlcnMuc3BsaXQoIC9cXHMqLFxccyovZyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gb3JkZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBSdW50aW1lLmhhc1J1bnRpbWUoIG9yZGVyc1sgaSBdICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlID0gdHlwZSA9IG9yZGVyc1sgaSBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFRyYW5zcG9ydFxuICAgICAqL1xuICAgIGRlZmluZSgnbGliL3RyYW5zcG9ydCcsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2NsaWVudCcsXG4gICAgICAgICdtZWRpYXRvcidcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZUNsaWVudCwgTWVkaWF0b3IgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBUcmFuc3BvcnQoIG9wdHMgKSB7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMgPSAkLmV4dGVuZCggdHJ1ZSwge30sIFRyYW5zcG9ydC5vcHRpb25zLCBvcHRzIHx8IHt9ICk7XG4gICAgICAgICAgICBSdW50aW1lQ2xpZW50LmNhbGwoIHRoaXMsICdUcmFuc3BvcnQnICk7XG4gICAgXG4gICAgICAgICAgICB0aGlzLl9ibG9iID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1EYXRhID0gb3B0cy5mb3JtRGF0YSB8fCB7fTtcbiAgICAgICAgICAgIHRoaXMuX2hlYWRlcnMgPSBvcHRzLmhlYWRlcnMgfHwge307XG4gICAgXG4gICAgICAgICAgICB0aGlzLm9uKCAncHJvZ3Jlc3MnLCB0aGlzLl90aW1lb3V0ICk7XG4gICAgICAgICAgICB0aGlzLm9uKCAnbG9hZCBlcnJvcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG1lLnRyaWdnZXIoICdwcm9ncmVzcycsIDEgKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIG1lLl90aW1lciApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgVHJhbnNwb3J0Lm9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzZXJ2ZXI6ICcnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgXG4gICAgICAgICAgICAvLyDot6jln5/ml7bvvIzmmK/lkKblhYHorrjmkLrluKZjb29raWUsIOWPquaciWh0bWw1IHJ1bnRpbWXmiY3mnInmlYhcbiAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogZmFsc2UsXG4gICAgICAgICAgICBmaWxlVmFsOiAnZmlsZScsXG4gICAgICAgICAgICB0aW1lb3V0OiAyICogNjAgKiAxMDAwLCAgICAvLyAy5YiG6ZKfXG4gICAgICAgICAgICBmb3JtRGF0YToge30sXG4gICAgICAgICAgICBoZWFkZXJzOiB7fSxcbiAgICAgICAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2VcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgJC5leHRlbmQoIFRyYW5zcG9ydC5wcm90b3R5cGUsIHtcbiAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoEJsb2IsIOWPquiDvea3u+WKoOS4gOasoe+8jOacgOWQjuS4gOasoeacieaViOOAglxuICAgICAgICAgICAgYXBwZW5kQmxvYjogZnVuY3Rpb24oIGtleSwgYmxvYiwgZmlsZW5hbWUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnM7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBtZS5nZXRSdWlkKCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmRpc2Nvbm5lY3RSdW50aW1lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIOi/nuaOpeWIsGJsb2LlvZLlsZ7nmoTlkIzkuIDkuKpydW50aW1lLlxuICAgICAgICAgICAgICAgIG1lLmNvbm5lY3RSdW50aW1lKCBibG9iLnJ1aWQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5leGVjKCdpbml0Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX2Jsb2IgPSBibG9iO1xuICAgICAgICAgICAgICAgIG9wdHMuZmlsZVZhbCA9IGtleSB8fCBvcHRzLmZpbGVWYWw7XG4gICAgICAgICAgICAgICAgb3B0cy5maWxlbmFtZSA9IGZpbGVuYW1lIHx8IG9wdHMuZmlsZW5hbWU7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg5YW25LuW5a2X5q61XG4gICAgICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKCBrZXksIHZhbHVlICkge1xuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGtleSA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKCB0aGlzLl9mb3JtRGF0YSwga2V5ICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZm9ybURhdGFbIGtleSBdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIHNldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCBrZXksIHZhbHVlICkge1xuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGtleSA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKCB0aGlzLl9oZWFkZXJzLCBrZXkgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oZWFkZXJzWyBrZXkgXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBzZW5kOiBmdW5jdGlvbiggbWV0aG9kICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXhlYyggJ3NlbmQnLCBtZXRob2QgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl90aW1lb3V0KCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgYWJvcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggdGhpcy5fdGltZXIgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCdhYm9ydCcpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcignZGVzdHJveScpO1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5leGVjKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0UnVudGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCdnZXRSZXNwb25zZScpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlQXNKc29uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjKCdnZXRSZXNwb25zZUFzSnNvbicpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlYygnZ2V0U3RhdHVzJyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3RpbWVvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gbWUub3B0aW9ucy50aW1lb3V0O1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIWR1cmF0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCggbWUuX3RpbWVyICk7XG4gICAgICAgICAgICAgICAgbWUuX3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ2Vycm9yJywgJ3RpbWVvdXQnICk7XG4gICAgICAgICAgICAgICAgfSwgZHVyYXRpb24gKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIC8vIOiuqVRyYW5zcG9ydOWFt+Wkh+S6i+S7tuWKn+iDveOAglxuICAgICAgICBNZWRpYXRvci5pbnN0YWxsVG8oIFRyYW5zcG9ydC5wcm90b3R5cGUgKTtcbiAgICBcbiAgICAgICAgcmV0dXJuIFRyYW5zcG9ydDtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOi0n+i0o+aWh+S7tuS4iuS8oOebuOWFs+OAglxuICAgICAqL1xuICAgIGRlZmluZSgnd2lkZ2V0cy91cGxvYWQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAndXBsb2FkZXInLFxuICAgICAgICAnZmlsZScsXG4gICAgICAgICdsaWIvdHJhbnNwb3J0JyxcbiAgICAgICAgJ3dpZGdldHMvd2lkZ2V0J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBVcGxvYWRlciwgV1VGaWxlLCBUcmFuc3BvcnQgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgaXNQcm9taXNlID0gQmFzZS5pc1Byb21pc2UsXG4gICAgICAgICAgICBTdGF0dXMgPSBXVUZpbGUuU3RhdHVzO1xuICAgIFxuICAgICAgICAvLyDmt7vliqDpu5jorqTphY3nva7poblcbiAgICAgICAgJC5leHRlbmQoIFVwbG9hZGVyLm9wdGlvbnMsIHtcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCb29sZWFufSBbcHJlcGFyZU5leHRGaWxlPWZhbHNlXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5piv5ZCm5YWB6K645Zyo5paH5Lu25Lyg6L6T5pe25o+Q5YmN5oqK5LiL5LiA5Liq5paH5Lu25YeG5aSH5aW944CCXG4gICAgICAgICAgICAgKiDlr7nkuo7kuIDkuKrmlofku7bnmoTlh4blpIflt6XkvZzmr5TovoPogJfml7bvvIzmr5TlpoLlm77niYfljovnvKnvvIxtZDXluo/liJfljJbjgIJcbiAgICAgICAgICAgICAqIOWmguaenOiDveaPkOWJjeWcqOW9k+WJjeaWh+S7tuS8oOi+k+acn+WkhOeQhu+8jOWPr+S7peiKguecgeaAu+S9k+iAl+aXtuOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwcmVwYXJlTmV4dEZpbGU6IGZhbHNlLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFtjaHVua2VkPWZhbHNlXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5piv5ZCm6KaB5YiG54mH5aSE55CG5aSn5paH5Lu25LiK5Lyg44CCXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNodW5rZWQ6IGZhbHNlLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFtjaHVua1NpemU9NTI0Mjg4MF1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOWmguaenOimgeWIhueJh++8jOWIhuWkmuWkp+S4gOeJh++8nyDpu5jorqTlpKflsI/kuLo1TS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2h1bmtTaXplOiA1ICogMTAyNCAqIDEwMjQsXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gW2NodW5rUmV0cnk9Ml1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOWmguaenOafkOS4quWIhueJh+eUseS6jue9kee7nOmXrumimOWHuumUme+8jOWFgeiuuOiHquWKqOmHjeS8oOWkmuWwkeasoe+8n1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjaHVua1JldHJ5OiAyLFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFt0aHJlYWRzPTNdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDkuIrkvKDlubblj5HmlbDjgILlhYHorrjlkIzml7bmnIDlpKfkuIrkvKDov5vnqIvmlbDjgIJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhyZWFkczogMyxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtmb3JtRGF0YV1cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaWh+S7tuS4iuS8oOivt+axgueahOWPguaVsOihqO+8jOavj+asoeWPkemAgemDveS8muWPkemAgeatpOWvueixoeS4reeahOWPguaVsOOAglxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmb3JtRGF0YTogbnVsbFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge09iamVjdH0gW2ZpbGVWYWw9J2ZpbGUnXVxuICAgICAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAgICAgKiBAZm9yIFVwbG9hZGVyXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g6K6+572u5paH5Lu25LiK5Lyg5Z+f55qEbmFtZeOAglxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbbWV0aG9kPSdQT1NUJ11cbiAgICAgICAgICAgICAqIEBuYW1lc3BhY2Ugb3B0aW9uc1xuICAgICAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOaWh+S7tuS4iuS8oOaWueW8j++8jGBQT1NUYOaIluiAhWBHRVRg44CCXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtPYmplY3R9IFtzZW5kQXNCaW5hcnk9ZmFsc2VdXG4gICAgICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmmK/lkKblt7Lkuozov5vliLbnmoTmtYHnmoTmlrnlvI/lj5HpgIHmlofku7bvvIzov5nmoLfmlbTkuKrkuIrkvKDlhoXlrrlgcGhwOi8vaW5wdXRg6YO95Li65paH5Lu25YaF5a6577yMXG4gICAgICAgICAgICAgKiDlhbbku5blj4LmlbDlnKgkX0dFVOaVsOe7hOS4reOAglxuICAgICAgICAgICAgICovXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvLyDotJ/otKPlsIbmlofku7bliIfniYfjgIJcbiAgICAgICAgZnVuY3Rpb24gQ3V0ZUZpbGUoIGZpbGUsIGNodW5rU2l6ZSApIHtcbiAgICAgICAgICAgIHZhciBwZW5kaW5nID0gW10sXG4gICAgICAgICAgICAgICAgYmxvYiA9IGZpbGUuc291cmNlLFxuICAgICAgICAgICAgICAgIHRvdGFsID0gYmxvYi5zaXplLFxuICAgICAgICAgICAgICAgIGNodW5rcyA9IGNodW5rU2l6ZSA/IE1hdGguY2VpbCggdG90YWwgLyBjaHVua1NpemUgKSA6IDEsXG4gICAgICAgICAgICAgICAgc3RhcnQgPSAwLFxuICAgICAgICAgICAgICAgIGluZGV4ID0gMCxcbiAgICAgICAgICAgICAgICBsZW47XG4gICAgXG4gICAgICAgICAgICB3aGlsZSAoIGluZGV4IDwgY2h1bmtzICkge1xuICAgICAgICAgICAgICAgIGxlbiA9IE1hdGgubWluKCBjaHVua1NpemUsIHRvdGFsIC0gc3RhcnQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBwZW5kaW5nLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIGVuZDogY2h1bmtTaXplID8gKHN0YXJ0ICsgbGVuKSA6IHRvdGFsLFxuICAgICAgICAgICAgICAgICAgICB0b3RhbDogdG90YWwsXG4gICAgICAgICAgICAgICAgICAgIGNodW5rczogY2h1bmtzLFxuICAgICAgICAgICAgICAgICAgICBjaHVuazogaW5kZXgrK1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0YXJ0ICs9IGxlbjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGZpbGUuYmxvY2tzID0gcGVuZGluZy5jb25jYXQoKTtcbiAgICAgICAgICAgIGZpbGUucmVtYW5pbmcgPSBwZW5kaW5nLmxlbmd0aDtcbiAgICBcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZmlsZTogZmlsZSxcbiAgICBcbiAgICAgICAgICAgICAgICBoYXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISFwZW5kaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgICAgIGZldGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBlbmRpbmcuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICdzdGFydC11cGxvYWQnOiAnc3RhcnQnLFxuICAgICAgICAgICAgJ3N0b3AtdXBsb2FkJzogJ3N0b3AnLFxuICAgICAgICAgICAgJ3NraXAtZmlsZSc6ICdza2lwRmlsZScsXG4gICAgICAgICAgICAnaXMtaW4tcHJvZ3Jlc3MnOiAnaXNJblByb2dyZXNzJ1xuICAgICAgICB9LCB7XG4gICAgXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucnVuaW5nID0gZmFsc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g6K6w5b2V5b2T5YmN5q2j5Zyo5Lyg55qE5pWw5o2u77yM6LefdGhyZWFkc+ebuOWFs1xuICAgICAgICAgICAgICAgIHRoaXMucG9vbCA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOe8k+WtmOWNs+WwhuS4iuS8oOeahOaWh+S7tuOAglxuICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZyA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOi3n+i4qui/mOacieWkmuWwkeWIhueJh+ayoeacieWujOaIkOS4iuS8oOOAglxuICAgICAgICAgICAgICAgIHRoaXMucmVtYW5pbmcgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX190aWNrID0gQmFzZS5iaW5kRm4oIHRoaXMuX3RpY2ssIHRoaXMgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBvd25lci5vbiggJ3VwbG9hZENvbXBsZXRlJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaKiuWFtuS7luWdl+WPlua2iOS6huOAglxuICAgICAgICAgICAgICAgICAgICBmaWxlLmJsb2NrcyAmJiAkLmVhY2goIGZpbGUuYmxvY2tzLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYudHJhbnNwb3J0ICYmICh2LnRyYW5zcG9ydC5hYm9ydCgpLCB2LnRyYW5zcG9ydC5kZXN0cm95KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYudHJhbnNwb3J0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGZpbGUuYmxvY2tzO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZmlsZS5yZW1hbmluZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCBzdGFydFVwbG9hZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+W8gOWni+S4iuS8oOa1geeoi+aXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlvIDlp4vkuIrkvKDjgILmraTmlrnms5Xlj6/ku6Xku47liJ3lp4vnirbmgIHosIPnlKjlvIDlp4vkuIrkvKDmtYHnqIvvvIzkuZ/lj6/ku6Xku47mmoLlgZznirbmgIHosIPnlKjvvIznu6fnu63kuIrkvKDmtYHnqIvjgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHVwbG9hZCgpID0+IHVuZGVmaW5lZFxuICAgICAgICAgICAgICogQG1ldGhvZCB1cGxvYWRcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOenu+WHumludmFsaWTnmoTmlofku7ZcbiAgICAgICAgICAgICAgICAkLmVhY2goIG1lLnJlcXVlc3QoICdnZXQtZmlsZXMnLCBTdGF0dXMuSU5WQUxJRCApLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUucmVxdWVzdCggJ3JlbW92ZS1maWxlJywgdGhpcyApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggbWUucnVuaW5nICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIG1lLnJ1bmluZyA9IHRydWU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyJ5pqC5YGc55qE77yM5YiZ57ut5LygXG4gICAgICAgICAgICAgICAgJC5lYWNoKCBtZS5wb29sLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGUgPSB2LmZpbGU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLklOVEVSUlVQVCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBTdGF0dXMuUFJPR1JFU1MgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl90cmlnZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB2LnRyYW5zcG9ydCAmJiB2LnRyYW5zcG9ydC5zZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ3N0YXJ0VXBsb2FkJyk7XG4gICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgc3RvcFVwbG9hZFxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+W8gOWni+S4iuS8oOa1geeoi+aaguWBnOaXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmmoLlgZzkuIrkvKDjgILnrKzkuIDkuKrlj4LmlbDkuLrmmK/lkKbkuK3mlq3kuIrkvKDlvZPliY3mraPlnKjkuIrkvKDnmoTmlofku7bjgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHN0b3AoKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBncmFtbWFyIHN0b3AoIHRydWUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc3RvcFxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24oIGludGVycnVwdCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggbWUucnVuaW5nID09PSBmYWxzZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5ydW5pbmcgPSBmYWxzZTtcbiAgICBcbiAgICAgICAgICAgICAgICBpbnRlcnJ1cHQgJiYgJC5lYWNoKCBtZS5wb29sLCBmdW5jdGlvbiggXywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgdi50cmFuc3BvcnQgJiYgdi50cmFuc3BvcnQuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgdi5maWxlLnNldFN0YXR1cyggU3RhdHVzLklOVEVSUlVQVCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ3N0b3BVcGxvYWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWIpOaWrWBVcGxhb2RlYHLmmK/lkKbmraPlnKjkuIrkvKDkuK3jgIJcbiAgICAgICAgICAgICAqIEBncmFtbWFyIGlzSW5Qcm9ncmVzcygpID0+IEJvb2xlYW5cbiAgICAgICAgICAgICAqIEBtZXRob2QgaXNJblByb2dyZXNzXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0luUHJvZ3Jlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIXRoaXMucnVuaW5nO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFN0YXRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCdnZXQtc3RhdHMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaOiei/h+S4gOS4quaWh+S7tuS4iuS8oO+8jOebtOaOpeagh+iusOaMh+WumuaWh+S7tuS4uuW3suS4iuS8oOeKtuaAgeOAglxuICAgICAgICAgICAgICogQGdyYW1tYXIgc2tpcEZpbGUoIGZpbGUgKSA9PiB1bmRlZmluZWRcbiAgICAgICAgICAgICAqIEBtZXRob2Qgc2tpcEZpbGVcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNraXBGaWxlOiBmdW5jdGlvbiggZmlsZSwgc3RhdHVzICkge1xuICAgICAgICAgICAgICAgIGZpbGUgPSB0aGlzLnJlcXVlc3QoICdnZXQtZmlsZScsIGZpbGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggc3RhdHVzIHx8IFN0YXR1cy5DT01QTEVURSApO1xuICAgICAgICAgICAgICAgIGZpbGUuc2tpcHBlZCA9IHRydWU7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5q2j5Zyo5LiK5Lyg44CCXG4gICAgICAgICAgICAgICAgZmlsZS5ibG9ja3MgJiYgJC5lYWNoKCBmaWxlLmJsb2NrcywgZnVuY3Rpb24oIF8sIHYgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfdHIgPSB2LnRyYW5zcG9ydDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBfdHIgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdHIuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90ci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdi50cmFuc3BvcnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLm93bmVyLnRyaWdnZXIoICd1cGxvYWRTa2lwJywgZmlsZSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZEZpbmlzaGVkXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5omA5pyJ5paH5Lu25LiK5Lyg57uT5p2f5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBfdGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0cyA9IG1lLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGZuLCB2YWw7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5LiK5LiA5LiqcHJvbWlzZei/mOayoeaciee7k+adn++8jOWImeetieW+heWujOaIkOWQjuWGjeaJp+ihjOOAglxuICAgICAgICAgICAgICAgIGlmICggbWUuX3Byb21pc2UgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5fcHJvbWlzZS5hbHdheXMoIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyDov5jmnInkvY3nva7vvIzkuJTov5jmnInmlofku7bopoHlpITnkIbnmoTor53jgIJcbiAgICAgICAgICAgICAgICBpZiAoIG1lLnBvb2wubGVuZ3RoIDwgb3B0cy50aHJlYWRzICYmICh2YWwgPSBtZS5fbmV4dEJsb2NrKCkpICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCA9IGZhbHNlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmbiA9IGZ1bmN0aW9uKCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcHJvbWlzZSA9IG51bGw7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnInlj6/og73mmK9yZWplY3Tov4fmnaXnmoTvvIzmiYDku6XopoHmo4DmtYt2YWznmoTnsbvlnovjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCAmJiB2YWwuZmlsZSAmJiBtZS5fc3RhcnRTZW5kKCB2YWwgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEJhc2UubmV4dFRpY2soIG1lLl9fdGljayApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBtZS5fcHJvbWlzZSA9IGlzUHJvbWlzZSggdmFsICkgPyB2YWwuYWx3YXlzKCBmbiApIDogZm4oIHZhbCApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOayoeacieimgeS4iuS8oOeahOS6hu+8jOS4lOayoeacieato+WcqOS8oOi+k+eahOS6huOAglxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoICFtZS5yZW1hbmluZyAmJiAhbWUuZ2V0U3RhdHMoKS5udW1PZlF1ZXVlICkge1xuICAgICAgICAgICAgICAgICAgICBtZS5ydW5pbmcgPSBmYWxzZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuX3RyaWdnZWQgfHwgQmFzZS5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoJ3VwbG9hZEZpbmlzaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBtZS5fdHJpZ2dlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9uZXh0QmxvY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGFjdCA9IG1lLl9hY3QsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBuZXh0LCBkb25lO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOW9k+WJjeaWh+S7tui/mOacieayoeaciemcgOimgeS8oOi+k+eahO+8jOWImeebtOaOpei/lOWbnuWJqeS4i+eahOOAglxuICAgICAgICAgICAgICAgIGlmICggYWN0ICYmIGFjdC5oYXMoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0LmZpbGUuZ2V0U3RhdHVzKCkgPT09IFN0YXR1cy5QUk9HUkVTUyApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5piv5ZCm5o+Q5YmN5YeG5aSH5LiL5LiA5Liq5paH5Lu2XG4gICAgICAgICAgICAgICAgICAgIGlmICggb3B0cy5wcmVwYXJlTmV4dEZpbGUgJiYgIW1lLnBlbmRpbmcubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3ByZXBhcmVOZXh0RmlsZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3QuZmV0Y2goKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlkKbliJnvvIzlpoLmnpzmraPlnKjov5DooYzvvIzliJnlh4blpIfkuIvkuIDkuKrmlofku7bvvIzlubbnrYnlvoXlrozmiJDlkI7ov5Tlm57kuIvkuKrliIbniYfjgIJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBtZS5ydW5pbmcgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOe8k+WtmOS4reacie+8jOWImeebtOaOpeWcqOe8k+WtmOS4reWPlu+8jOayoeacieWImeWOu3F1ZXVl5Lit5Y+W44CCXG4gICAgICAgICAgICAgICAgICAgIGlmICggIW1lLnBlbmRpbmcubGVuZ3RoICYmIG1lLmdldFN0YXRzKCkubnVtT2ZRdWV1ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wcmVwYXJlTmV4dEZpbGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBuZXh0ID0gbWUucGVuZGluZy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBkb25lID0gZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0ID0gQ3V0ZUZpbGUoIGZpbGUsIG9wdHMuY2h1bmtlZCA/IG9wdHMuY2h1bmtTaXplIDogMCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX2FjdCA9IGFjdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3QuZmV0Y2goKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5paH5Lu25Y+v6IO96L+Y5ZyocHJlcGFyZeS4re+8jOS5n+acieWPr+iDveW3sue7j+WujOWFqOWHhuWkh+WlveS6huOAglxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNQcm9taXNlKCBuZXh0ICkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRbIG5leHQucGlwZSA/ICdwaXBlJyA6ICd0aGVuJ10oIGRvbmUgKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZSggbmV4dCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRTdGFydFxuICAgICAgICAgICAgICogQHBhcmFtIHtGaWxlfSBmaWxlIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDmn5DkuKrmlofku7blvIDlp4vkuIrkvKDliY3op6blj5HvvIzkuIDkuKrmlofku7blj6rkvJrop6blj5HkuIDmrKHjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIF9wcmVwYXJlTmV4dEZpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBtZS5yZXF1ZXN0KCdmZXRjaC1maWxlJyksXG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmcgPSBtZS5wZW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZmlsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSA9IG1lLnJlcXVlc3QoICdiZWZvcmUtc2VuZC1maWxlJywgZmlsZSwgZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnInlj6/og73mlofku7booqtza2lw5o6J5LqG44CC5paH5Lu26KKrc2tpcOaOieWQju+8jOeKtuaAgeWdkeWumuS4jeaYr1F1ZXVlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLlFVRVVFRCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAndXBsb2FkU3RhcnQnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5QUk9HUkVTUyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLl9maW5pc2hGaWxlKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzov5jlnKhwZW5kaW5n5Lit77yM5YiZ5pu/5o2i5oiQ5paH5Lu25pys6Lqr44CCXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZHggPSAkLmluQXJyYXkoIHByb21pc2UsIHBlbmRpbmcgKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH5pZHggJiYgcGVuZGluZy5zcGxpY2UoIGlkeCwgMSwgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gYmVmZW9yZS1zZW5kLWZpbGXnmoTpkqnlrZDlsLHmnInplJnor6/lj5HnlJ/jgIJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS5mYWlsKGZ1bmN0aW9uKCByZWFzb24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkVSUk9SLCByZWFzb24gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm93bmVyLnRyaWdnZXIoICd1cGxvYWRFcnJvcicsIGZpbGUsIHJlYXNvbiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3duZXIudHJpZ2dlciggJ3VwbG9hZENvbXBsZXRlJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZy5wdXNoKCBwcm9taXNlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOiuqeWHuuS9jee9ruS6hu+8jOWPr+S7peiuqeWFtuS7luWIhueJh+W8gOWni+S4iuS8oFxuICAgICAgICAgICAgX3BvcEJsb2NrOiBmdW5jdGlvbiggYmxvY2sgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9ICQuaW5BcnJheSggYmxvY2ssIHRoaXMucG9vbCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucG9vbC5zcGxpY2UoIGlkeCwgMSApO1xuICAgICAgICAgICAgICAgIGJsb2NrLmZpbGUucmVtYW5pbmctLTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbWFuaW5nLS07XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgLy8g5byA5aeL5LiK5Lyg77yM5Y+v5Lul6KKr5o6J6L+H44CC5aaC5p6ccHJvbWlzZeiiq3JlamVjdOS6hu+8jOWImeihqOekuui3s+i/h+atpOWIhueJh+OAglxuICAgICAgICAgICAgX3N0YXJ0U2VuZDogZnVuY3Rpb24oIGJsb2NrICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBibG9jay5maWxlLFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lLnBvb2wucHVzaCggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICBtZS5yZW1hbmluZysrO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOayoeacieWIhueJh++8jOWImeebtOaOpeS9v+eUqOWOn+Wni+eahOOAglxuICAgICAgICAgICAgICAgIC8vIOS4jeS8muS4ouWksWNvbnRlbnQtdHlwZeS/oeaBr+OAglxuICAgICAgICAgICAgICAgIGJsb2NrLmJsb2IgPSBibG9jay5jaHVua3MgPT09IDEgPyBmaWxlLnNvdXJjZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNvdXJjZS5zbGljZSggYmxvY2suc3RhcnQsIGJsb2NrLmVuZCApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGhvb2ssIOavj+S4quWIhueJh+WPkemAgeS5i+WJjeWPr+iDveimgeWBmuS6m+W8guatpeeahOS6i+aDheOAglxuICAgICAgICAgICAgICAgIHByb21pc2UgPSBtZS5yZXF1ZXN0KCAnYmVmb3JlLXNlbmQnLCBibG9jaywgZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOacieWPr+iDveaWh+S7tuW3sue7j+S4iuS8oOWHuumUmeS6hu+8jOaJgOS7peS4jemcgOimgeWGjeS8oOi+k+S6huOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoIGZpbGUuZ2V0U3RhdHVzKCkgPT09IFN0YXR1cy5QUk9HUkVTUyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9kb1NlbmQoIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcG9wQmxvY2soIGJsb2NrICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBCYXNlLm5leHRUaWNrKCBtZS5fX3RpY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOS4umZhaWzkuobvvIzliJnot7Pov4fmraTliIbniYfjgIJcbiAgICAgICAgICAgICAgICBwcm9taXNlLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5yZW1hbmluZyA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9maW5pc2hGaWxlKCBmaWxlICkuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnBlcmNlbnRhZ2UgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9wb3BCbG9jayggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vd25lci50cmlnZ2VyKCAndXBsb2FkQ29tcGxldGUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnBlcmNlbnRhZ2UgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3BvcEJsb2NrKCBibG9jayApO1xuICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRCZWZvcmVTZW5kXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSDpu5jorqTnmoTkuIrkvKDlj4LmlbDvvIzlj6/ku6XmianlsZXmraTlr7nosaHmnaXmjqfliLbkuIrkvKDlj4LmlbDjgIJcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDlvZPmn5DkuKrmlofku7bnmoTliIblnZflnKjlj5HpgIHliY3op6blj5HvvIzkuLvopoHnlKjmnaXor6Lpl67mmK/lkKbopoHmt7vliqDpmYTluKblj4LmlbDvvIzlpKfmlofku7blnKjlvIDotbfliIbniYfkuIrkvKDnmoTliY3mj5DkuIvmraTkuovku7blj6/og73kvJrop6blj5HlpJrmrKHjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZEFjY2VwdFxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHJldCDmnI3liqHnq6/nmoTov5Tlm57mlbDmja7vvIxqc29u5qC85byP77yM5aaC5p6c5pyN5Yqh56uv5LiN5pivanNvbuagvOW8j++8jOS7jnJldC5fcmF35Lit5Y+W5pWw5o2u77yM6Ieq6KGM6Kej5p6Q44CCXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5p+Q5Liq5paH5Lu25LiK5Lyg5Yiw5pyN5Yqh56uv5ZON5bqU5ZCO77yM5Lya5rS+6YCB5q2k5LqL5Lu25p2l6K+i6Zeu5pyN5Yqh56uv5ZON5bqU5piv5ZCm5pyJ5pWI44CC5aaC5p6c5q2k5LqL5Lu2aGFuZGxlcui/lOWbnuWAvOS4umBmYWxzZWAsIOWImeatpOaWh+S7tuWwhua0vumAgWBzZXJ2ZXJg57G75Z6L55qEYHVwbG9hZEVycm9yYOS6i+S7tuOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkUHJvZ3Jlc3NcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gZmlsZSBGaWxl5a+56LGhXG4gICAgICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gcGVyY2VudGFnZSDkuIrkvKDov5vluqZcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDkuIrkvKDov4fnqIvkuK3op6blj5HvvIzmkLrluKbkuIrkvKDov5vluqbjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICBcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQGV2ZW50IHVwbG9hZEVycm9yXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHJlYXNvbiDlh7rplJnnmoRjb2RlXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2T5paH5Lu25LiK5Lyg5Ye66ZSZ5pe26Kem5Y+R44CCXG4gICAgICAgICAgICAgKiBAZm9yICBVcGxvYWRlclxuICAgICAgICAgICAgICovXG4gICAgXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBldmVudCB1cGxvYWRTdWNjZXNzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ZpbGV9IGZpbGUgRmlsZeWvueixoVxuICAgICAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIOacjeWKoeerr+i/lOWbnueahOaVsOaNrlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIOW9k+aWh+S7tuS4iuS8oOaIkOWKn+aXtuinpuWPkeOAglxuICAgICAgICAgICAgICogQGZvciAgVXBsb2FkZXJcbiAgICAgICAgICAgICAqL1xuICAgIFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAZXZlbnQgdXBsb2FkQ29tcGxldGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RmlsZX0gW2ZpbGVdIEZpbGXlr7nosaFcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiDkuI3nrqHmiJDlip/miJbogIXlpLHotKXvvIzmlofku7bkuIrkvKDlrozmiJDml7bop6blj5HjgIJcbiAgICAgICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAgICAgKi9cbiAgICBcbiAgICAgICAgICAgIC8vIOWBmuS4iuS8oOaTjeS9nOOAglxuICAgICAgICAgICAgX2RvU2VuZDogZnVuY3Rpb24oIGJsb2NrICkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG93bmVyID0gbWUub3duZXIsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gYmxvY2suZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgdHIgPSBuZXcgVHJhbnNwb3J0KCBvcHRzICksXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZCh7fSwgb3B0cy5mb3JtRGF0YSApLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzID0gJC5leHRlbmQoe30sIG9wdHMuaGVhZGVycyApLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0QWNjZXB0LCByZXQ7XG4gICAgXG4gICAgICAgICAgICAgICAgYmxvY2sudHJhbnNwb3J0ID0gdHI7XG4gICAgXG4gICAgICAgICAgICAgICAgdHIub24oICdkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBibG9jay50cmFuc3BvcnQ7XG4gICAgICAgICAgICAgICAgICAgIG1lLl9wb3BCbG9jayggYmxvY2sgKTtcbiAgICAgICAgICAgICAgICAgICAgQmFzZS5uZXh0VGljayggbWUuX190aWNrICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5bm/5pKt5LiK5Lyg6L+b5bqm44CC5Lul5paH5Lu25Li65Y2V5L2N44CCXG4gICAgICAgICAgICAgICAgdHIub24oICdwcm9ncmVzcycsIGZ1bmN0aW9uKCBwZXJjZW50YWdlICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG90YWxQZXJjZW50ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGVkID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y+v6IO95rKh5pyJYWJvcnTmjonvvIxwcm9ncmVzc+i/mOaYr+aJp+ihjOi/m+adpeS6huOAglxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoICFmaWxlLmJsb2NrcyApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB0b3RhbFBlcmNlbnQgPSBibG9jay5wZXJjZW50YWdlID0gcGVyY2VudGFnZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBibG9jay5jaHVua3MgPiAxICkgeyAgICAvLyDorqHnrpfmlofku7bnmoTmlbTkvZPpgJ/luqbjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCggZmlsZS5ibG9ja3MsIGZ1bmN0aW9uKCBfLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGVkICs9ICh2LnBlcmNlbnRhZ2UgfHwgMCkgKiAodi5lbmQgLSB2LnN0YXJ0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxQZXJjZW50ID0gdXBsb2FkZWQgLyBmaWxlLnNpemU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZFByb2dyZXNzJywgZmlsZSwgdG90YWxQZXJjZW50IHx8IDAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDnlKjmnaXor6Lpl67vvIzmmK/lkKbov5Tlm57nmoTnu5PmnpzmmK/mnInplJnor6/nmoTjgIJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QWNjZXB0ID0gZnVuY3Rpb24oIHJlamVjdCApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXQgPSB0ci5nZXRSZXNwb25zZUFzSnNvbigpIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICByZXQuX3JhdyA9IHRyLmdldFJlc3BvbnNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGZuID0gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOacjeWKoeerr+WTjeW6lOS6hu+8jOS4jeS7o+ihqOaIkOWKn+S6hu+8jOivoumXruaYr+WQpuWTjeW6lOato+ehruOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoICFvd25lci50cmlnZ2VyKCAndXBsb2FkQWNjZXB0JywgYmxvY2ssIHJldCwgZm4gKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCA9IHJlamVjdCB8fCAnc2VydmVyJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5bCd6K+V6YeN6K+V77yM54S25ZCO5bm/5pKt5paH5Lu25LiK5Lyg5Ye66ZSZ44CCXG4gICAgICAgICAgICAgICAgdHIub24oICdlcnJvcicsIGZ1bmN0aW9uKCB0eXBlLCBmbGFnICkge1xuICAgICAgICAgICAgICAgICAgICBibG9jay5yZXRyaWVkID0gYmxvY2sucmV0cmllZCB8fCAwO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDoh6rliqjph43or5VcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBibG9jay5jaHVua3MgPiAxICYmIH4naHR0cCxhYm9ydCcuaW5kZXhPZiggdHlwZSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2sucmV0cmllZCA8IG9wdHMuY2h1bmtSZXRyeSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLnJldHJpZWQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyLnNlbmQoKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHAgc3RhdHVzIDUwMCB+IDYwMFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhZmxhZyAmJiB0eXBlID09PSAnc2VydmVyJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gcmVxdWVzdEFjY2VwdCggdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zZXRTdGF0dXMoIFN0YXR1cy5FUlJPUiwgdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZEVycm9yJywgZmlsZSwgdHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZENvbXBsZXRlJywgZmlsZSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5LiK5Lyg5oiQ5YqfXG4gICAgICAgICAgICAgICAgdHIub24oICdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWFzb247XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOmdnumihOacn++8jOi9rOWQkeS4iuS8oOWHuumUmeOAglxuICAgICAgICAgICAgICAgICAgICBpZiAoIChyZWFzb24gPSByZXF1ZXN0QWNjZXB0KCkpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHIudHJpZ2dlciggJ2Vycm9yJywgcmVhc29uLCB0cnVlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5YWo6YOo5LiK5Lyg5a6M5oiQ44CCXG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5yZW1hbmluZyA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9maW5pc2hGaWxlKCBmaWxlLCByZXQgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOmFjee9rum7mOiupOeahOS4iuS8oOWtl+auteOAglxuICAgICAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZCggZGF0YSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWxlLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGxhc3RNb2RpZmllZERhdGU6IGZpbGUubGFzdE1vZGlmaWVkRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgYmxvY2suY2h1bmtzID4gMSAmJiAkLmV4dGVuZCggZGF0YSwge1xuICAgICAgICAgICAgICAgICAgICBjaHVua3M6IGJsb2NrLmNodW5rcyxcbiAgICAgICAgICAgICAgICAgICAgY2h1bms6IGJsb2NrLmNodW5rXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Zyo5Y+R6YCB5LmL6Ze05Y+v5Lul5re75Yqg5a2X5q615LuA5LmI55qE44CC44CC44CCXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c6buY6K6k55qE5a2X5q615LiN5aSf5L2/55So77yM5Y+v5Lul6YCa6L+H55uR5ZCs5q2k5LqL5Lu25p2l5omp5bGVXG4gICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZEJlZm9yZVNlbmQnLCBibG9jaywgZGF0YSwgaGVhZGVycyApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIOW8gOWni+WPkemAgeOAglxuICAgICAgICAgICAgICAgIHRyLmFwcGVuZEJsb2IoIG9wdHMuZmlsZVZhbCwgYmxvY2suYmxvYiwgZmlsZS5uYW1lICk7XG4gICAgICAgICAgICAgICAgdHIuYXBwZW5kKCBkYXRhICk7XG4gICAgICAgICAgICAgICAgdHIuc2V0UmVxdWVzdEhlYWRlciggaGVhZGVycyApO1xuICAgICAgICAgICAgICAgIHRyLnNlbmQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDlrozmiJDkuIrkvKDjgIJcbiAgICAgICAgICAgIF9maW5pc2hGaWxlOiBmdW5jdGlvbiggZmlsZSwgcmV0LCBoZHMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG93bmVyID0gdGhpcy5vd25lcjtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gb3duZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXF1ZXN0KCAnYWZ0ZXItc2VuZC1maWxlJywgYXJndW1lbnRzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkNPTVBMRVRFICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZFN1Y2Nlc3MnLCBmaWxlLCByZXQsIGhkcyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKCByZWFzb24gKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5aSW6YOo5bey57uP5qCH6K6w5Li6aW52YWxpZOS7gOS5iOeahO+8jOS4jeWGjeaUueeKtuaAgeOAglxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZmlsZS5nZXRTdGF0dXMoKSA9PT0gU3RhdHVzLlBST0dSRVNTICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNldFN0YXR1cyggU3RhdHVzLkVSUk9SLCByZWFzb24gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3duZXIudHJpZ2dlciggJ3VwbG9hZEVycm9yJywgZmlsZSwgcmVhc29uICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCAndXBsb2FkQ29tcGxldGUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyDlkITnp43pqozor4HvvIzljIXmi6zmlofku7bmgLvlpKflsI/mmK/lkKbotoXlh7rjgIHljZXmlofku7bmmK/lkKbotoXlh7rlkozmlofku7bmmK/lkKbph43lpI3jgIJcbiAgICAgKi9cbiAgICBcbiAgICBkZWZpbmUoJ3dpZGdldHMvdmFsaWRhdG9yJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3VwbG9hZGVyJyxcbiAgICAgICAgJ2ZpbGUnLFxuICAgICAgICAnd2lkZ2V0cy93aWRnZXQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIFVwbG9hZGVyLCBXVUZpbGUgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgdmFsaWRhdG9ycyA9IHt9LFxuICAgICAgICAgICAgYXBpO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQGV2ZW50IGVycm9yXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIOmUmeivr+exu+Wei+OAglxuICAgICAgICAgKiBAZGVzY3JpcHRpb24g5b2TdmFsaWRhdGXkuI3pgJrov4fml7bvvIzkvJrku6XmtL7pgIHplJnor6/kuovku7bnmoTlvaLlvI/pgJrnn6XosIPnlKjogIXjgILpgJrov4dgdXBsb2FkLm9uKCdlcnJvcicsIGhhbmRsZXIpYOWPr+S7peaNleiOt+WIsOatpOexu+mUmeivr++8jOebruWJjeacieS7peS4i+mUmeivr+S8muWcqOeJueWumueahOaDheWGteS4i+a0vumAgemUmeadpeOAglxuICAgICAgICAgKlxuICAgICAgICAgKiAqIGBRX0VYQ0VFRF9OVU1fTElNSVRgIOWcqOiuvue9ruS6hmBmaWxlTnVtTGltaXRg5LiU5bCd6K+V57uZYHVwbG9hZGVyYOa3u+WKoOeahOaWh+S7tuaVsOmHj+i2heWHuui/meS4quWAvOaXtua0vumAgeOAglxuICAgICAgICAgKiAqIGBRX0VYQ0VFRF9TSVpFX0xJTUlUYCDlnKjorr7nva7kuoZgUV9FWENFRURfU0laRV9MSU1JVGDkuJTlsJ3or5Xnu5lgdXBsb2FkZXJg5re75Yqg55qE5paH5Lu25oC75aSn5bCP6LaF5Ye66L+Z5Liq5YC85pe25rS+6YCB44CCXG4gICAgICAgICAqIEBmb3IgIFVwbG9hZGVyXG4gICAgICAgICAqL1xuICAgIFxuICAgICAgICAvLyDmmrTpnLLnu5nlpJbpnaLnmoRhcGlcbiAgICAgICAgYXBpID0ge1xuICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg6aqM6K+B5ZmoXG4gICAgICAgICAgICBhZGRWYWxpZGF0b3I6IGZ1bmN0aW9uKCB0eXBlLCBjYiApIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzWyB0eXBlIF0gPSBjYjtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICAvLyDnp7vpmaTpqozor4HlmahcbiAgICAgICAgICAgIHJlbW92ZVZhbGlkYXRvcjogZnVuY3Rpb24oIHR5cGUgKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHZhbGlkYXRvcnNbIHR5cGUgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgLy8g5ZyoVXBsb2FkZXLliJ3lp4vljJbnmoTml7blgJnlkK/liqhWYWxpZGF0b3Jz55qE5Yid5aeL5YyWXG4gICAgICAgIFVwbG9hZGVyLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCB2YWxpZGF0b3JzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsKCBtZS5vd25lciApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7aW50fSBbZmlsZU51bUxpbWl0PXVuZGVmaW5lZF1cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOmqjOivgeaWh+S7tuaAu+aVsOmHjywg6LaF5Ye65YiZ5LiN5YWB6K645Yqg5YWl6Zif5YiX44CCXG4gICAgICAgICAqL1xuICAgICAgICBhcGkuYWRkVmFsaWRhdG9yKCAnZmlsZU51bUxpbWl0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLFxuICAgICAgICAgICAgICAgIG9wdHMgPSB1cGxvYWRlci5vcHRpb25zLFxuICAgICAgICAgICAgICAgIGNvdW50ID0gMCxcbiAgICAgICAgICAgICAgICBtYXggPSBvcHRzLmZpbGVOdW1MaW1pdCA+PiAwLFxuICAgICAgICAgICAgICAgIGZsYWcgPSB0cnVlO1xuICAgIFxuICAgICAgICAgICAgaWYgKCAhbWF4ICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnYmVmb3JlRmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY291bnQgPj0gbWF4ICYmIGZsYWcgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCAnZXJyb3InLCAnUV9FWENFRURfTlVNX0xJTUlUJywgbWF4LCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gY291bnQgPj0gbWF4ID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVRdWV1ZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVEZXF1ZXVlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvdW50LS07XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAndXBsb2FkRmluaXNoZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb3VudCA9IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgXG4gICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge2ludH0gW2ZpbGVTaXplTGltaXQ9dW5kZWZpbmVkXVxuICAgICAgICAgKiBAbmFtZXNwYWNlIG9wdGlvbnNcbiAgICAgICAgICogQGZvciBVcGxvYWRlclxuICAgICAgICAgKiBAZGVzY3JpcHRpb24g6aqM6K+B5paH5Lu25oC75aSn5bCP5piv5ZCm6LaF5Ye66ZmQ5Yi2LCDotoXlh7rliJnkuI3lhYHorrjliqDlhaXpmJ/liJfjgIJcbiAgICAgICAgICovXG4gICAgICAgIGFwaS5hZGRWYWxpZGF0b3IoICdmaWxlU2l6ZUxpbWl0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLFxuICAgICAgICAgICAgICAgIG9wdHMgPSB1cGxvYWRlci5vcHRpb25zLFxuICAgICAgICAgICAgICAgIGNvdW50ID0gMCxcbiAgICAgICAgICAgICAgICBtYXggPSBvcHRzLmZpbGVTaXplTGltaXQgPj4gMCxcbiAgICAgICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICBcbiAgICAgICAgICAgIGlmICggIW1heCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2JlZm9yZUZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgaW52YWxpZCA9IGNvdW50ICsgZmlsZS5zaXplID4gbWF4O1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggaW52YWxpZCAmJiBmbGFnICkge1xuICAgICAgICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ2Vycm9yJywgJ1FfRVhDRUVEX1NJWkVfTElNSVQnLCBtYXgsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9LCAxICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpbnZhbGlkID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ2ZpbGVRdWV1ZWQnLCBmdW5jdGlvbiggZmlsZSApIHtcbiAgICAgICAgICAgICAgICBjb3VudCArPSBmaWxlLnNpemU7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnZmlsZURlcXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgY291bnQgLT0gZmlsZS5zaXplO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICB1cGxvYWRlci5vbiggJ3VwbG9hZEZpbmlzaGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY291bnQgPSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQHByb3BlcnR5IHtpbnR9IFtmaWxlU2luZ2xlU2l6ZUxpbWl0PXVuZGVmaW5lZF1cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOmqjOivgeWNleS4quaWh+S7tuWkp+Wwj+aYr+WQpui2heWHuumZkOWItiwg6LaF5Ye65YiZ5LiN5YWB6K645Yqg5YWl6Zif5YiX44CCXG4gICAgICAgICAqL1xuICAgICAgICBhcGkuYWRkVmFsaWRhdG9yKCAnZmlsZVNpbmdsZVNpemVMaW1pdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcyxcbiAgICAgICAgICAgICAgICBvcHRzID0gdXBsb2FkZXIub3B0aW9ucyxcbiAgICAgICAgICAgICAgICBtYXggPSBvcHRzLmZpbGVTaW5nbGVTaXplTGltaXQ7XG4gICAgXG4gICAgICAgICAgICBpZiAoICFtYXggKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgdXBsb2FkZXIub24oICdiZWZvcmVGaWxlUXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCBmaWxlLnNpemUgPiBtYXggKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuc2V0U3RhdHVzKCBXVUZpbGUuU3RhdHVzLklOVkFMSUQsICdleGNlZWRfc2l6ZScgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCAnZXJyb3InLCAnRl9FWENFRURfU0laRScsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7aW50fSBbZHVwbGljYXRlPXVuZGVmaW5lZF1cbiAgICAgICAgICogQG5hbWVzcGFjZSBvcHRpb25zXG4gICAgICAgICAqIEBmb3IgVXBsb2FkZXJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIOWOu+mHje+8jCDmoLnmja7mlofku7blkI3lrZfjgIHmlofku7blpKflsI/lkozmnIDlkI7kv67mlLnml7bpl7TmnaXnlJ/miJBoYXNoIEtleS5cbiAgICAgICAgICovXG4gICAgICAgIGFwaS5hZGRWYWxpZGF0b3IoICdkdXBsaWNhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMsXG4gICAgICAgICAgICAgICAgb3B0cyA9IHVwbG9hZGVyLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgbWFwcGluZyA9IHt9O1xuICAgIFxuICAgICAgICAgICAgaWYgKCBvcHRzLmR1cGxpY2F0ZSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBoYXNoU3RyaW5nKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSAwLFxuICAgICAgICAgICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gc3RyLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgX2NoYXI7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIF9jaGFyID0gc3RyLmNoYXJDb2RlQXQoIGkgKTtcbiAgICAgICAgICAgICAgICAgICAgaGFzaCA9IF9jaGFyICsgKGhhc2ggPDwgNikgKyAoaGFzaCA8PCAxNikgLSBoYXNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnYmVmb3JlRmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gZmlsZS5fX2hhc2ggfHwgKGZpbGUuX19oYXNoID0gaGFzaFN0cmluZyggZmlsZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2l6ZSArIGZpbGUubGFzdE1vZGlmaWVkRGF0ZSApKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDlt7Lnu4/ph43lpI3kuoZcbiAgICAgICAgICAgICAgICBpZiAoIG1hcHBpbmdbIGhhc2ggXSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCAnZXJyb3InLCAnRl9EVVBMSUNBVEUnLCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnZmlsZVF1ZXVlZCcsIGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gZmlsZS5fX2hhc2g7XG4gICAgXG4gICAgICAgICAgICAgICAgaGFzaCAmJiAobWFwcGluZ1sgaGFzaCBdID0gdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIHVwbG9hZGVyLm9uKCAnZmlsZURlcXVldWVkJywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBmaWxlLl9faGFzaDtcbiAgICBcbiAgICAgICAgICAgICAgICBoYXNoICYmIChkZWxldGUgbWFwcGluZ1sgaGFzaCBdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgcmV0dXJuIGFwaTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IFJ1bnRpbWXnrqHnkIblmajvvIzotJ/otKNSdW50aW1l55qE6YCJ5oupLCDov57mjqVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvY29tcGJhc2UnLFtdLGZ1bmN0aW9uKCkge1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBDb21wQmFzZSggb3duZXIsIHJ1bnRpbWUgKSB7XG4gICAgXG4gICAgICAgICAgICB0aGlzLm93bmVyID0gb3duZXI7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvd25lci5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWU7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5nZXRSdWlkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bnRpbWUudWlkO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvd25lci50cmlnZ2VyLmFwcGx5KCBvd25lciwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBDb21wQmFzZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEh0bWw1UnVudGltZVxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9ydW50aW1lJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvcnVudGltZScsXG4gICAgICAgICdydW50aW1lL2NvbXBiYXNlJ1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBSdW50aW1lLCBDb21wQmFzZSApIHtcbiAgICBcbiAgICAgICAgdmFyIHR5cGUgPSAnaHRtbDUnLFxuICAgICAgICAgICAgY29tcG9uZW50cyA9IHt9O1xuICAgIFxuICAgICAgICBmdW5jdGlvbiBIdG1sNVJ1bnRpbWUoKSB7XG4gICAgICAgICAgICB2YXIgcG9vbCA9IHt9LFxuICAgICAgICAgICAgICAgIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICBkZXN0b3J5ID0gdGhpcy5kZXN0b3J5O1xuICAgIFxuICAgICAgICAgICAgUnVudGltZS5hcHBseSggbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgbWUudHlwZSA9IHR5cGU7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAvLyDov5nkuKrmlrnms5XnmoTosIPnlKjogIXvvIzlrp7pmYXkuIrmmK9SdW50aW1lQ2xpZW50XG4gICAgICAgICAgICBtZS5leGVjID0gZnVuY3Rpb24oIGNvbXAsIGZuLyosIGFyZ3MuLi4qLykge1xuICAgICAgICAgICAgICAgIHZhciBjbGllbnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB1aWQgPSBjbGllbnQudWlkLFxuICAgICAgICAgICAgICAgICAgICBhcmdzID0gQmFzZS5zbGljZSggYXJndW1lbnRzLCAyICksXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggY29tcG9uZW50c1sgY29tcCBdICkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IHBvb2xbIHVpZCBdID0gcG9vbFsgdWlkIF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgY29tcG9uZW50c1sgY29tcCBdKCBjbGllbnQsIG1lICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5zdGFuY2VbIGZuIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2VbIGZuIF0uYXBwbHkoIGluc3RhbmNlLCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgbWUuZGVzdG9yeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEB0b2RvIOWIoOmZpOaxoOWtkOS4reeahOaJgOacieWunuS+i1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXN0b3J5ICYmIGRlc3RvcnkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBCYXNlLmluaGVyaXRzKCBSdW50aW1lLCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogSHRtbDVSdW50aW1lLFxuICAgIFxuICAgICAgICAgICAgLy8g5LiN6ZyA6KaB6L+e5o6l5YW25LuW56iL5bqP77yM55u05o6l5omn6KGMY2FsbGJhY2tcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9LCAxICk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgIH0pO1xuICAgIFxuICAgICAgICAvLyDms6jlhoxDb21wb25lbnRzXG4gICAgICAgIEh0bWw1UnVudGltZS5yZWdpc3RlciA9IGZ1bmN0aW9uKCBuYW1lLCBjb21wb25lbnQgKSB7XG4gICAgICAgICAgICB2YXIga2xhc3MgPSBjb21wb25lbnRzWyBuYW1lIF0gPSBCYXNlLmluaGVyaXRzKCBDb21wQmFzZSwgY29tcG9uZW50ICk7XG4gICAgICAgICAgICByZXR1cm4ga2xhc3M7XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vIOazqOWGjGh0bWw16L+Q6KGM5pe244CCXG4gICAgICAgIC8vIOWPquacieWcqOaUr+aMgeeahOWJjeaPkOS4i+azqOWGjOOAglxuICAgICAgICBpZiAoIHdpbmRvdy5CbG9iICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5EYXRhVmlldyApIHtcbiAgICAgICAgICAgIFJ1bnRpbWUuYWRkUnVudGltZSggdHlwZSwgSHRtbDVSdW50aW1lICk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEJsb2IgSHRtbOWunueOsFxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9odG1sNS9ibG9iJyxbXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAnbGliL2Jsb2InXG4gICAgXSwgZnVuY3Rpb24oIEh0bWw1UnVudGltZSwgQmxvYiApIHtcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ0Jsb2InLCB7XG4gICAgICAgICAgICBzbGljZTogZnVuY3Rpb24oIHN0YXJ0LCBlbmQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsb2IgPSB0aGlzLm93bmVyLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgc2xpY2UgPSBibG9iLnNsaWNlIHx8IGJsb2Iud2Via2l0U2xpY2UgfHwgYmxvYi5tb3pTbGljZTtcbiAgICBcbiAgICAgICAgICAgICAgICBibG9iID0gc2xpY2UuY2FsbCggYmxvYiwgc3RhcnQsIGVuZCApO1xuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYiggdGhpcy5nZXRSdWlkKCksIGJsb2IgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBGaWxlUGFzdGVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvZG5kJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvcnVudGltZScsXG4gICAgICAgICdsaWIvZmlsZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgSHRtbDVSdW50aW1lLCBGaWxlICkge1xuICAgIFxuICAgICAgICB2YXIgJCA9IEJhc2UuJCxcbiAgICAgICAgICAgIHByZWZpeCA9ICd3ZWJ1cGxvYWRlci1kbmQtJztcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ0RyYWdBbmREcm9wJywge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmVsZW0gPSB0aGlzLm9wdGlvbnMuY29udGFpbmVyO1xuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ0VudGVySGFuZGxlciA9IEJhc2UuYmluZEZuKCB0aGlzLl9kcmFnRW50ZXJIYW5kbGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnT3ZlckhhbmRsZXIgPSBCYXNlLmJpbmRGbiggdGhpcy5fZHJhZ092ZXJIYW5kbGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnTGVhdmVIYW5kbGVyID0gQmFzZS5iaW5kRm4oIHRoaXMuX2RyYWdMZWF2ZUhhbmRsZXIsIHRoaXMgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3BIYW5kbGVyID0gQmFzZS5iaW5kRm4oIHRoaXMuX2Ryb3BIYW5kbGVyLCB0aGlzICk7XG4gICAgICAgICAgICAgICAgdGhpcy5kbmRPdmVyID0gZmFsc2U7XG4gICAgXG4gICAgICAgICAgICAgICAgZWxlbS5vbiggJ2RyYWdlbnRlcicsIHRoaXMuZHJhZ0VudGVySGFuZGxlciApO1xuICAgICAgICAgICAgICAgIGVsZW0ub24oICdkcmFnb3ZlcicsIHRoaXMuZHJhZ092ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgZWxlbS5vbiggJ2RyYWdsZWF2ZScsIHRoaXMuZHJhZ0xlYXZlSGFuZGxlciApO1xuICAgICAgICAgICAgICAgIGVsZW0ub24oICdkcm9wJywgdGhpcy5kcm9wSGFuZGxlciApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5vcHRpb25zLmRpc2FibGVHbG9iYWxEbmQgKSB7XG4gICAgICAgICAgICAgICAgICAgICQoIGRvY3VtZW50ICkub24oICdkcmFnb3ZlcicsIHRoaXMuZHJhZ092ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgICAgICQoIGRvY3VtZW50ICkub24oICdkcm9wJywgdGhpcy5kcm9wSGFuZGxlciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfZHJhZ0VudGVySGFuZGxlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZGVuaWVkID0gbWUuX2RlbmllZCB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM7XG4gICAgXG4gICAgICAgICAgICAgICAgZSA9IGUub3JpZ2luYWxFdmVudCB8fCBlO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggIW1lLmRuZE92ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmRuZE92ZXIgPSB0cnVlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDms6jmhI/lj6rmnIkgY2hyb21lIOaUr+aMgeOAglxuICAgICAgICAgICAgICAgICAgICBpdGVtcyA9IGUuZGF0YVRyYW5zZmVyLml0ZW1zO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zICYmIGl0ZW1zLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLl9kZW5pZWQgPSBkZW5pZWQgPSAhbWUudHJpZ2dlciggJ2FjY2VwdCcsIGl0ZW1zICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuZWxlbS5hZGRDbGFzcyggcHJlZml4ICsgJ292ZXInICk7XG4gICAgICAgICAgICAgICAgICAgIG1lLmVsZW1bIGRlbmllZCA/ICdhZGRDbGFzcycgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZW1vdmVDbGFzcycgXSggcHJlZml4ICsgJ2RlbmllZCcgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgXG4gICAgICAgICAgICAgICAgZS5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IGRlbmllZCA/ICdub25lJyA6ICdjb3B5JztcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX2RyYWdPdmVySGFuZGxlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgLy8g5Y+q5aSE55CG5qGG5YaF55qE44CCXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudEVsZW0gPSB0aGlzLmVsZW0ucGFyZW50KCkuZ2V0KCAwICk7XG4gICAgICAgICAgICAgICAgaWYgKCBwYXJlbnRFbGVtICYmICEkLmNvbnRhaW5zKCBwYXJlbnRFbGVtLCBlLmN1cnJlbnRUYXJnZXQgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoIHRoaXMuX2xlYXZlVGltZXIgKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kcmFnRW50ZXJIYW5kbGVyLmNhbGwoIHRoaXMsIGUgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX2RyYWdMZWF2ZUhhbmRsZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5kbmRPdmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG1lLmVsZW0ucmVtb3ZlQ2xhc3MoIHByZWZpeCArICdvdmVyICcgKyBwcmVmaXggKyAnZGVuaWVkJyApO1xuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KCBtZS5fbGVhdmVUaW1lciApO1xuICAgICAgICAgICAgICAgIG1lLl9sZWF2ZVRpbWVyID0gc2V0VGltZW91dCggaGFuZGxlciwgMTAwICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9kcm9wSGFuZGxlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgcnVpZCA9IG1lLmdldFJ1aWQoKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbSA9IG1lLmVsZW0ucGFyZW50KCkuZ2V0KCAwICk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Y+q5aSE55CG5qGG5YaF55qE44CCXG4gICAgICAgICAgICAgICAgaWYgKCBwYXJlbnRFbGVtICYmICEkLmNvbnRhaW5zKCBwYXJlbnRFbGVtLCBlLmN1cnJlbnRUYXJnZXQgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBtZS5fZ2V0VGFuc2ZlckZpbGVzKCBlLCBmdW5jdGlvbiggcmVzdWx0cyApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ2Ryb3AnLCAkLm1hcCggcmVzdWx0cywgZnVuY3Rpb24oIGZpbGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZpbGUoIHJ1aWQsIGZpbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfSkgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5kbmRPdmVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbWUuZWxlbS5yZW1vdmVDbGFzcyggcHJlZml4ICsgJ292ZXInICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIC8vIOWmguaenOS8oOWFpSBjYWxsYmFjayDliJnljrvmn6XnnIvmlofku7blpLnvvIzlkKbliJnlj6rnrqHlvZPliY3mlofku7blpLnjgIJcbiAgICAgICAgICAgIF9nZXRUYW5zZmVyRmlsZXM6IGZ1bmN0aW9uKCBlLCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyAgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMsIGZpbGVzLCBkYXRhVHJhbnNmZXIsIGZpbGUsIGl0ZW0sIGksIGxlbiwgY2FuQWNjZXNzRm9sZGVyO1xuICAgIFxuICAgICAgICAgICAgICAgIGUgPSBlLm9yaWdpbmFsRXZlbnQgfHwgZTtcbiAgICBcbiAgICAgICAgICAgICAgICBkYXRhVHJhbnNmZXIgPSBlLmRhdGFUcmFuc2ZlcjtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGRhdGFUcmFuc2Zlci5pdGVtcztcbiAgICAgICAgICAgICAgICBmaWxlcyA9IGRhdGFUcmFuc2Zlci5maWxlcztcbiAgICBcbiAgICAgICAgICAgICAgICBjYW5BY2Nlc3NGb2xkZXIgPSAhIShpdGVtcyAmJiBpdGVtc1sgMCBdLndlYmtpdEdldEFzRW50cnkpO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsZW4gPSBmaWxlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IGZpbGVzWyBpIF07XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtcyAmJiBpdGVtc1sgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNhbkFjY2Vzc0ZvbGRlciAmJiBpdGVtLndlYmtpdEdldEFzRW50cnkoKS5pc0RpcmVjdG9yeSApIHtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goIHRoaXMuX3RyYXZlcnNlRGlyZWN0b3J5VHJlZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS53ZWJraXRHZXRBc0VudHJ5KCksIHJlc3VsdHMgKSApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgQmFzZS53aGVuLmFwcGx5KCBCYXNlLCBwcm9taXNlcyApLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXJlc3VsdHMubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCByZXN1bHRzICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3RyYXZlcnNlRGlyZWN0b3J5VHJlZTogZnVuY3Rpb24oIGVudHJ5LCByZXN1bHRzICkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IEJhc2UuRGVmZXJyZWQoKSxcbiAgICAgICAgICAgICAgICAgICAgbWUgPSB0aGlzO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggZW50cnkuaXNGaWxlICkge1xuICAgICAgICAgICAgICAgICAgICBlbnRyeS5maWxlKGZ1bmN0aW9uKCBmaWxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBmaWxlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGVudHJ5LmlzRGlyZWN0b3J5ICkge1xuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jcmVhdGVSZWFkZXIoKS5yZWFkRW50cmllcyhmdW5jdGlvbiggZW50cmllcyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSBlbnRyaWVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyciA9IFtdLCAgICAvLyDkuLrkuobkv53or4Hpobrluo/jgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKCBtZS5fdHJhdmVyc2VEaXJlY3RvcnlUcmVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cmllc1sgaSBdLCBhcnIgKSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgQmFzZS53aGVuLmFwcGx5KCBCYXNlLCBwcm9taXNlcyApLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoLmFwcGx5KCByZXN1bHRzLCBhcnIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBkZWZlcnJlZC5yZWplY3QgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmVsZW07XG4gICAgXG4gICAgICAgICAgICAgICAgZWxlbS5vZmYoICdkcmFnZW50ZXInLCB0aGlzLmRyYWdFbnRlckhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9mZiggJ2RyYWdvdmVyJywgdGhpcy5kcmFnRW50ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgZWxlbS5vZmYoICdkcmFnbGVhdmUnLCB0aGlzLmRyYWdMZWF2ZUhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9mZiggJ2Ryb3AnLCB0aGlzLmRyb3BIYW5kbGVyICk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9wdGlvbnMuZGlzYWJsZUdsb2JhbERuZCApIHtcbiAgICAgICAgICAgICAgICAgICAgJCggZG9jdW1lbnQgKS5vZmYoICdkcmFnb3ZlcicsIHRoaXMuZHJhZ092ZXJIYW5kbGVyICk7XG4gICAgICAgICAgICAgICAgICAgICQoIGRvY3VtZW50ICkub2ZmKCAnZHJvcCcsIHRoaXMuZHJvcEhhbmRsZXIgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRmlsZVBhc3RlXG4gICAgICovXG4gICAgZGVmaW5lKCdydW50aW1lL2h0bWw1L2ZpbGVwYXN0ZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnLFxuICAgICAgICAnbGliL2ZpbGUnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEh0bWw1UnVudGltZSwgRmlsZSApIHtcbiAgICBcbiAgICAgICAgcmV0dXJuIEh0bWw1UnVudGltZS5yZWdpc3RlciggJ0ZpbGVQYXN0ZScsIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpcy5lbGVtID0gb3B0cy5jb250YWluZXIsXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdCA9ICcuKicsXG4gICAgICAgICAgICAgICAgICAgIGFyciwgaSwgbGVuLCBpdGVtO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGFjY2V0cOeahG1pbWVUeXBlc+S4reeUn+aIkOWMuemFjeato+WImeOAglxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5hY2NlcHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyciA9IFtdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gb3B0cy5hY2NlcHQubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gb3B0cy5hY2NlcHRbIGkgXS5taW1lVHlwZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtICYmIGFyci5wdXNoKCBpdGVtICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhcnIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0ID0gYXJyLmpvaW4oJywnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdCA9IGFjY2VwdC5yZXBsYWNlKCAvLC9nLCAnfCcgKS5yZXBsYWNlKCAvXFwqL2csICcuKicgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmFjY2VwdCA9IGFjY2VwdCA9IG5ldyBSZWdFeHAoIGFjY2VwdCwgJ2knICk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kZXIgPSBCYXNlLmJpbmRGbiggdGhpcy5fcGFzdGVIYW5kZXIsIHRoaXMgKTtcbiAgICAgICAgICAgICAgICBlbGVtLm9uKCAncGFzdGUnLCB0aGlzLmhhbmRlciApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9wYXN0ZUhhbmRlcjogZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFsbG93ZWQgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgcnVpZCA9IHRoaXMuZ2V0UnVpZCgpLFxuICAgICAgICAgICAgICAgICAgICBpdGVtcywgaXRlbSwgYmxvYiwgaSwgbGVuO1xuICAgIFxuICAgICAgICAgICAgICAgIGUgPSBlLm9yaWdpbmFsRXZlbnQgfHwgZTtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGUuY2xpcGJvYXJkRGF0YS5pdGVtcztcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbGVuID0gaXRlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1sgaSBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW0ua2luZCAhPT0gJ2ZpbGUnIHx8ICEoYmxvYiA9IGl0ZW0uZ2V0QXNGaWxlKCkpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZC5wdXNoKCBuZXcgRmlsZSggcnVpZCwgYmxvYiApICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggYWxsb3dlZC5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4jemYu+atoumdnuaWh+S7tueymOi0tO+8iOaWh+Wtl+eymOi0tO+8ieeahOS6i+S7tuWGkuazoVxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlciggJ3Bhc3RlJywgYWxsb3dlZCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW0ub2ZmKCAncGFzdGUnLCB0aGlzLmhhbmRlciApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IEZpbGVQaWNrZXJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvZmlsZXBpY2tlcicsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3J1bnRpbWUnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UsIEh0bWw1UnVudGltZSApIHtcbiAgICBcbiAgICAgICAgdmFyICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdGaWxlUGlja2VyJywge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuZ2V0UnVudGltZSgpLmdldENvbnRhaW5lcigpLFxuICAgICAgICAgICAgICAgICAgICBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG93bmVyID0gbWUub3duZXIsXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBtZS5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBsYWJsZSA9ICQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJykgKSxcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSAkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpICksXG4gICAgICAgICAgICAgICAgICAgIGFyciwgaSwgbGVuLCBtb3VzZUhhbmRsZXI7XG4gICAgXG4gICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ3R5cGUnLCAnZmlsZScgKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5hdHRyKCAnbmFtZScsIG9wdHMubmFtZSApO1xuICAgICAgICAgICAgICAgIGlucHV0LmFkZENsYXNzKCd3ZWJ1cGxvYWRlci1lbGVtZW50LWludmlzaWJsZScpO1xuICAgIFxuICAgICAgICAgICAgICAgIGxhYmxlLm9uKCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQudHJpZ2dlcignY2xpY2snKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBsYWJsZS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjZmZmZmZmJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy5tdWx0aXBsZSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ211bHRpcGxlJywgJ211bHRpcGxlJyApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBAdG9kbyBGaXJlZm945LiN5pSv5oyB5Y2V54us5oyH5a6a5ZCO57yAXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRzLmFjY2VwdCAmJiBvcHRzLmFjY2VwdC5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAgICAgICBhcnIgPSBbXTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGxlbiA9IG9wdHMuYWNjZXB0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goIG9wdHMuYWNjZXB0WyBpIF0ubWltZVR5cGVzICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuYXR0ciggJ2FjY2VwdCcsIGFyci5qb2luKCcsJykgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZCggaW5wdXQgKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kKCBsYWJsZSApO1xuICAgIFxuICAgICAgICAgICAgICAgIG1vdXNlSGFuZGxlciA9IGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCBlLnR5cGUgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIGlucHV0Lm9uKCAnY2hhbmdlJywgZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IGFyZ3VtZW50cy5jYWxsZWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgbWUuZmlsZXMgPSBlLnRhcmdldC5maWxlcztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVzZXQgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSB0aGlzLmNsb25lTm9kZSggdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKCBjbG9uZSwgdGhpcyApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpbnB1dC5vZmYoKTtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPSAkKCBjbG9uZSApLm9uKCAnY2hhbmdlJywgZm4gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbiggJ21vdXNlZW50ZXIgbW91c2VsZWF2ZScsIG1vdXNlSGFuZGxlciApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBvd25lci50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICBsYWJsZS5vbiggJ21vdXNlZW50ZXIgbW91c2VsZWF2ZScsIG1vdXNlSGFuZGxlciApO1xuICAgIFxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICBcbiAgICAgICAgICAgIGdldEZpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maWxlcztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyB0b2RvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgVHJhbnNwb3J0XG4gICAgICogQHRvZG8g5pSv5oyBY2h1bmtlZOS8oOi+k++8jOS8mOWKv++8mlxuICAgICAqIOWPr+S7peWwhuWkp+aWh+S7tuWIhuaIkOWwj+Wdl++8jOaMqOS4quS8oOi+k++8jOWPr+S7peaPkOmrmOWkp+aWh+S7tuaIkOWKn+eOh++8jOW9k+Wksei0peeahOaXtuWAme+8jOS5n+WPqumcgOimgemHjeS8oOmCo+Wwj+mDqOWIhu+8jFxuICAgICAqIOiAjOS4jemcgOimgemHjeWktOWGjeS8oOS4gOasoeOAguWPpuWkluaWreeCuee7reS8oOS5n+mcgOimgeeUqGNodW5rZWTmlrnlvI/jgIJcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvaHRtbDUvdHJhbnNwb3J0JyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgSHRtbDVSdW50aW1lICkge1xuICAgIFxuICAgICAgICB2YXIgbm9vcCA9IEJhc2Uubm9vcCxcbiAgICAgICAgICAgICQgPSBCYXNlLiQ7XG4gICAgXG4gICAgICAgIHJldHVybiBIdG1sNVJ1bnRpbWUucmVnaXN0ZXIoICdUcmFuc3BvcnQnLCB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3BvbnNlID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBzZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICB4aHIgPSB0aGlzLl9pbml0QWpheCgpLFxuICAgICAgICAgICAgICAgICAgICBibG9iID0gb3duZXIuX2Jsb2IsXG4gICAgICAgICAgICAgICAgICAgIHNlcnZlciA9IG9wdHMuc2VydmVyLFxuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YSwgYmluYXJ5LCBmcjtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuc2VuZEFzQmluYXJ5ICkge1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIgKz0gKC9cXD8vLnRlc3QoIHNlcnZlciApID8gJyYnIDogJz8nKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wYXJhbSggb3duZXIuX2Zvcm1EYXRhICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGJpbmFyeSA9IGJsb2IuZ2V0U291cmNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKCBvd25lci5fZm9ybURhdGEsIGZ1bmN0aW9uKCBrLCB2ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKCBrLCB2ICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoIG9wdHMuZmlsZVZhbCwgYmxvYi5nZXRTb3VyY2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmZpbGVuYW1lIHx8IG93bmVyLl9mb3JtRGF0YS5uYW1lIHx8ICcnICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy53aXRoQ3JlZGVudGlhbHMgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3Blbiggb3B0cy5tZXRob2QsIHNlcnZlciwgdHJ1ZSApO1xuICAgICAgICAgICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3Blbiggb3B0cy5tZXRob2QsIHNlcnZlciApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRSZXF1ZXN0SGVhZGVyKCB4aHIsIG9wdHMuaGVhZGVycyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggYmluYXJ5ICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIub3ZlcnJpZGVNaW1lVHlwZSgnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZHJvaWTnm7TmjqXlj5HpgIFibG9i5Lya5a+86Ie05pyN5Yqh56uv5o6l5pS25Yiw55qE5piv56m65paH5Lu244CCXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1Z+ivpuaDheOAglxuICAgICAgICAgICAgICAgICAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2FuZHJvaWQvaXNzdWVzL2RldGFpbD9pZD0zOTg4MlxuICAgICAgICAgICAgICAgICAgICAvLyDmiYDku6XlhYjnlKhmaWxlUmVhZGVy6K+75Y+W5Ye65p2l5YaN6YCa6L+HYXJyYXlidWZmZXLnmoTmlrnlvI/lj5HpgIHjgIJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBCYXNlLm9zLmFuZHJvaWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2VuZCggdGhpcy5yZXN1bHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmciA9IGZyLm9ubG9hZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZnIucmVhZEFzQXJyYXlCdWZmZXIoIGJpbmFyeSApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoIGJpbmFyeSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoIGZvcm1EYXRhICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzcG9uc2U7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0UmVzcG9uc2VBc0pzb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJzZUpzb24oIHRoaXMuX3Jlc3BvbnNlICk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZ2V0U3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gdGhpcy5feGhyO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggeGhyICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBub29wO1xuICAgICAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gbm9vcDtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3hociA9IHhociA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWJvcnQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBfaW5pdEFqYXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggb3B0cy53aXRoQ3JlZGVudGlhbHMgJiYgISgnd2l0aENyZWRlbnRpYWxzJyBpbiB4aHIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgWERvbWFpblJlcXVlc3QgIT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwZXJjZW50YWdlID0gMDtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlLmxlbmd0aENvbXB1dGFibGUgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50YWdlID0gZS5sb2FkZWQgLyBlLnRvdGFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS50cmlnZ2VyKCAncHJvZ3Jlc3MnLCBwZXJjZW50YWdlICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICggeGhyLnJlYWR5U3RhdGUgIT09IDQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gbm9vcDtcbiAgICAgICAgICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG5vb3A7XG4gICAgICAgICAgICAgICAgICAgIG1lLl94aHIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBtZS5fc3RhdHVzID0geGhyLnN0YXR1cztcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Jlc3BvbnNlID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS50cmlnZ2VyKCdsb2FkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHhoci5zdGF0dXMgPj0gNTAwICYmIHhoci5zdGF0dXMgPCA2MDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcmVzcG9uc2UgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdlcnJvcicsICdzZXJ2ZXInICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdlcnJvcicsIG1lLl9zdGF0dXMgPyAnaHR0cCcgOiAnYWJvcnQnICk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZS5feGhyID0geGhyO1xuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgX3NldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCB4aHIsIGhlYWRlcnMgKSB7XG4gICAgICAgICAgICAgICAgJC5lYWNoKCBoZWFkZXJzLCBmdW5jdGlvbigga2V5LCB2YWwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCBrZXksIHZhbCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9wYXJzZUpzb246IGZ1bmN0aW9uKCBzdHIgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGpzb247XG4gICAgXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UoIHN0ciApO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKCBleCApIHtcbiAgICAgICAgICAgICAgICAgICAganNvbiA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLyoqXG4gICAgICogQGZpbGVPdmVydmlldyBGbGFzaFJ1bnRpbWVcbiAgICAgKi9cbiAgICBkZWZpbmUoJ3J1bnRpbWUvZmxhc2gvcnVudGltZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgICAgICdydW50aW1lL3J1bnRpbWUnLFxuICAgICAgICAncnVudGltZS9jb21wYmFzZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgUnVudGltZSwgQ29tcEJhc2UgKSB7XG4gICAgXG4gICAgICAgIHZhciAkID0gQmFzZS4kLFxuICAgICAgICAgICAgdHlwZSA9ICdmbGFzaCcsXG4gICAgICAgICAgICBjb21wb25lbnRzID0ge307XG4gICAgXG4gICAgXG4gICAgICAgIGZ1bmN0aW9uIGdldEZsYXNoVmVyc2lvbigpIHtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uO1xuICAgIFxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uID0gbmF2aWdhdG9yLnBsdWdpbnNbICdTaG9ja3dhdmUgRmxhc2gnIF07XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IHZlcnNpb24uZGVzY3JpcHRpb247XG4gICAgICAgICAgICB9IGNhdGNoICggZXggKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbiA9IG5ldyBBY3RpdmVYT2JqZWN0KCdTaG9ja3dhdmVGbGFzaC5TaG9ja3dhdmVGbGFzaCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLkdldFZhcmlhYmxlKCckdmVyc2lvbicpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKCBleDIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb24gPSAnMC4wJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2ZXJzaW9uID0gdmVyc2lvbi5tYXRjaCggL1xcZCsvZyApO1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoIHZlcnNpb25bIDAgXSArICcuJyArIHZlcnNpb25bIDEgXSwgMTAgKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBmdW5jdGlvbiBGbGFzaFJ1bnRpbWUoKSB7XG4gICAgICAgICAgICB2YXIgcG9vbCA9IHt9LFxuICAgICAgICAgICAgICAgIGNsaWVudHMgPSB7fSxcbiAgICAgICAgICAgICAgICBkZXN0b3J5ID0gdGhpcy5kZXN0b3J5LFxuICAgICAgICAgICAgICAgIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICBqc3JlY2l2ZXIgPSBCYXNlLmd1aWQoJ3dlYnVwbG9hZGVyXycpO1xuICAgIFxuICAgICAgICAgICAgUnVudGltZS5hcHBseSggbWUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgbWUudHlwZSA9IHR5cGU7XG4gICAgXG4gICAgXG4gICAgICAgICAgICAvLyDov5nkuKrmlrnms5XnmoTosIPnlKjogIXvvIzlrp7pmYXkuIrmmK9SdW50aW1lQ2xpZW50XG4gICAgICAgICAgICBtZS5leGVjID0gZnVuY3Rpb24oIGNvbXAsIGZuLyosIGFyZ3MuLi4qLyApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xpZW50ID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgdWlkID0gY2xpZW50LnVpZCxcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IEJhc2Uuc2xpY2UoIGFyZ3VtZW50cywgMiApLFxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZTtcbiAgICBcbiAgICAgICAgICAgICAgICBjbGllbnRzWyB1aWQgXSA9IGNsaWVudDtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIGNvbXBvbmVudHNbIGNvbXAgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhcG9vbFsgdWlkIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb29sWyB1aWQgXSA9IG5ldyBjb21wb25lbnRzWyBjb21wIF0oIGNsaWVudCwgbWUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IHBvb2xbIHVpZCBdO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluc3RhbmNlWyBmbiBdICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlWyBmbiBdLmFwcGx5KCBpbnN0YW5jZSwgYXJncyApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBtZS5mbGFzaEV4ZWMuYXBwbHkoIGNsaWVudCwgYXJndW1lbnRzICk7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlciggZXZ0LCBvYmogKSB7XG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBldnQudHlwZSB8fCBldnQsXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzLCB1aWQ7XG4gICAgXG4gICAgICAgICAgICAgICAgcGFydHMgPSB0eXBlLnNwbGl0KCc6OicpO1xuICAgICAgICAgICAgICAgIHVpZCA9IHBhcnRzWyAwIF07XG4gICAgICAgICAgICAgICAgdHlwZSA9IHBhcnRzWyAxIF07XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cuYXBwbHkoIGNvbnNvbGUsIGFyZ3VtZW50cyApO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggdHlwZSA9PT0gJ1JlYWR5JyAmJiB1aWQgPT09IG1lLnVpZCApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlcigncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBjbGllbnRzWyB1aWQgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50c1sgdWlkIF0udHJpZ2dlciggdHlwZS50b0xvd2VyQ2FzZSgpLCBldnQsIG9iaiApO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBCYXNlLmxvZyggZXZ0LCBvYmogKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIC8vIGZsYXNo55qE5o6l5Y+X5Zmo44CCXG4gICAgICAgICAgICB3aW5kb3dbIGpzcmVjaXZlciBdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8g5Li65LqG6IO95o2V6I635b6X5Yiw44CCXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSggbnVsbCwgYXJncyApO1xuICAgICAgICAgICAgICAgIH0sIDEgKTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLmpzcmVjaXZlciA9IGpzcmVjaXZlcjtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuZGVzdG9yeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEB0b2RvIOWIoOmZpOaxoOWtkOS4reeahOaJgOacieWunuS+i1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXN0b3J5ICYmIGRlc3RvcnkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuZmxhc2hFeGVjID0gZnVuY3Rpb24oIGNvbXAsIGZuICkge1xuICAgICAgICAgICAgICAgIHZhciBmbGFzaCA9IG1lLmdldEZsYXNoKCksXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBCYXNlLnNsaWNlKCBhcmd1bWVudHMsIDIgKTtcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZmxhc2guZXhlYyggdGhpcy51aWQsIGNvbXAsIGZuLCBhcmdzICk7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8gQHRvZG9cbiAgICAgICAgfVxuICAgIFxuICAgICAgICBCYXNlLmluaGVyaXRzKCBSdW50aW1lLCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogRmxhc2hSdW50aW1lLFxuICAgIFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuZ2V0Q29udGFpbmVyKCksXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGh0bWw7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gaWYgbm90IHRoZSBtaW5pbWFsIGhlaWdodCwgc2hpbXMgYXJlIG5vdCBpbml0aWFsaXplZFxuICAgICAgICAgICAgICAgIC8vIGluIG9sZGVyIGJyb3dzZXJzIChlLmcgRkYzLjYsIElFNiw3LDgsIFNhZmFyaSA0LjAsNS4wLCBldGMpXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgICAgICB0b3A6ICctOHB4JyxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogJy04cHgnLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzlweCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzlweCcsXG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGluc2VydCBmbGFzaCBvYmplY3RcbiAgICAgICAgICAgICAgICBodG1sID0gJzxvYmplY3QgaWQ9XCInICsgdGhpcy51aWQgKyAnXCIgdHlwZT1cImFwcGxpY2F0aW9uLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3gtc2hvY2t3YXZlLWZsYXNoXCIgZGF0YT1cIicgKyAgb3B0cy5zd2YgKyAnXCIgJztcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIEJhc2UuYnJvd3Nlci5pZSApIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAnY2xhc3NpZD1cImNsc2lkOmQyN2NkYjZlLWFlNmQtMTFjZi05NmI4LTQ0NDU1MzU0MDAwMFwiICc7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGh0bWwgKz0gJ3dpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIiBzdHlsZT1cIm91dGxpbmU6MFwiPicgICtcbiAgICAgICAgICAgICAgICAgICAgJzxwYXJhbSBuYW1lPVwibW92aWVcIiB2YWx1ZT1cIicgKyBvcHRzLnN3ZiArICdcIiAvPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHBhcmFtIG5hbWU9XCJmbGFzaHZhcnNcIiB2YWx1ZT1cInVpZD0nICsgdGhpcy51aWQgK1xuICAgICAgICAgICAgICAgICAgICAnJmpzcmVjaXZlcj0nICsgdGhpcy5qc3JlY2l2ZXIgKyAnXCIgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxwYXJhbSBuYW1lPVwid21vZGVcIiB2YWx1ZT1cInRyYW5zcGFyZW50XCIgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxwYXJhbSBuYW1lPVwiYWxsb3dzY3JpcHRhY2Nlc3NcIiB2YWx1ZT1cImFsd2F5c1wiIC8+JyArXG4gICAgICAgICAgICAgICAgJzwvb2JqZWN0Pic7XG4gICAgXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmh0bWwoIGh0bWwgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRGbGFzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLl9mbGFzaCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZsYXNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl9mbGFzaCA9ICQoICcjJyArIHRoaXMudWlkICkuZ2V0KCAwICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZsYXNoO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgRmxhc2hSdW50aW1lLnJlZ2lzdGVyID0gZnVuY3Rpb24oIG5hbWUsIGNvbXBvbmVudCApIHtcbiAgICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudHNbIG5hbWUgXSA9IEJhc2UuaW5oZXJpdHMoIENvbXBCYXNlLCAkLmV4dGVuZCh7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gQHRvZG8gZml4IHRoaXMgbGF0ZXJcbiAgICAgICAgICAgICAgICBmbGFzaEV4ZWM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcnVudGltZSA9IHRoaXMuZ2V0UnVudGltZSgpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVudGltZS5mbGFzaEV4ZWMuYXBwbHkoIG93bmVyLCBhcmd1bWVudHMgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBjb21wb25lbnQgKSApO1xuICAgIFxuICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgICAgICAgfTtcbiAgICBcbiAgICAgICAgaWYgKCBnZXRGbGFzaFZlcnNpb24oKSA+PSAxMS40ICkge1xuICAgICAgICAgICAgUnVudGltZS5hZGRSdW50aW1lKCB0eXBlLCBGbGFzaFJ1bnRpbWUgKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4gRmxhc2hSdW50aW1lO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgRmlsZVBpY2tlclxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9mbGFzaC9maWxlcGlja2VyJyxbXG4gICAgICAgICdiYXNlJyxcbiAgICAgICAgJ3J1bnRpbWUvZmxhc2gvcnVudGltZSdcbiAgICBdLCBmdW5jdGlvbiggQmFzZSwgRmxhc2hSdW50aW1lICkge1xuICAgICAgICB2YXIgJCA9IEJhc2UuJDtcbiAgICBcbiAgICAgICAgcmV0dXJuIEZsYXNoUnVudGltZS5yZWdpc3RlciggJ0ZpbGVQaWNrZXInLCB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiggb3B0cyApIHtcbiAgICAgICAgICAgICAgICB2YXIgY29weSA9ICQuZXh0ZW5kKHt9LCBvcHRzICksXG4gICAgICAgICAgICAgICAgICAgIGxlbiwgaTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyDkv67lpI1GbGFzaOWGjeayoeacieiuvue9rnRpdGxl55qE5oOF5Ya15LiL5peg5rOV5by55Ye6Zmxhc2jmlofku7bpgInmi6nmoYbnmoRidWcuXG4gICAgICAgICAgICAgICAgbGVuID0gY29weS5hY2NlcHQgJiYgY29weS5hY2NlcHQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoICBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICFjb3B5LmFjY2VwdFsgaSBdLnRpdGxlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29weS5hY2NlcHRbIGkgXS50aXRsZSA9ICdGaWxlcyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvcHkuYnV0dG9uO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb3B5LmNvbnRhaW5lcjtcbiAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmZsYXNoRXhlYyggJ0ZpbGVQaWNrZXInLCAnaW5pdCcsIGNvcHkgKTtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyB0b2RvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEBmaWxlT3ZlcnZpZXcgIFRyYW5zcG9ydCBmbGFzaOWunueOsFxuICAgICAqL1xuICAgIGRlZmluZSgncnVudGltZS9mbGFzaC90cmFuc3BvcnQnLFtcbiAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAncnVudGltZS9mbGFzaC9ydW50aW1lJyxcbiAgICAgICAgJ3J1bnRpbWUvY2xpZW50J1xuICAgIF0sIGZ1bmN0aW9uKCBCYXNlLCBGbGFzaFJ1bnRpbWUsIFJ1bnRpbWVDbGllbnQgKSB7XG4gICAgICAgIHZhciAkID0gQmFzZS4kO1xuICAgIFxuICAgICAgICByZXR1cm4gRmxhc2hSdW50aW1lLnJlZ2lzdGVyKCAnVHJhbnNwb3J0Jywge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNwb25zZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzcG9uc2VKc29uID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBzZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3duZXIgPSB0aGlzLm93bmVyLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICB4aHIgPSB0aGlzLl9pbml0QWpheCgpLFxuICAgICAgICAgICAgICAgICAgICBibG9iID0gb3duZXIuX2Jsb2IsXG4gICAgICAgICAgICAgICAgICAgIHNlcnZlciA9IG9wdHMuc2VydmVyLFxuICAgICAgICAgICAgICAgICAgICBiaW5hcnk7XG4gICAgXG4gICAgICAgICAgICAgICAgeGhyLmNvbm5lY3RSdW50aW1lKCBibG9iLnJ1aWQgKTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIG9wdHMuc2VuZEFzQmluYXJ5ICkge1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIgKz0gKC9cXD8vLnRlc3QoIHNlcnZlciApID8gJyYnIDogJz8nKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wYXJhbSggb3duZXIuX2Zvcm1EYXRhICk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGJpbmFyeSA9IGJsb2IudWlkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZWFjaCggb3duZXIuX2Zvcm1EYXRhLCBmdW5jdGlvbiggaywgdiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5leGVjKCAnYXBwZW5kJywgaywgdiApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgeGhyLmV4ZWMoICdhcHBlbmRCbG9iJywgb3B0cy5maWxlVmFsLCBibG9iLnVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmZpbGVuYW1lIHx8IG93bmVyLl9mb3JtRGF0YS5uYW1lIHx8ICcnICk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFJlcXVlc3RIZWFkZXIoIHhociwgb3B0cy5oZWFkZXJzICk7XG4gICAgICAgICAgICAgICAgeGhyLmV4ZWMoICdzZW5kJywge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IG9wdHMubWV0aG9kLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHNlcnZlclxuICAgICAgICAgICAgICAgIH0sIGJpbmFyeSApO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cztcbiAgICAgICAgICAgIH0sXG4gICAgXG4gICAgICAgICAgICBnZXRSZXNwb25zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3BvbnNlO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGdldFJlc3BvbnNlQXNKc29uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzcG9uc2VKc29uO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gdGhpcy5feGhyO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICggeGhyICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuZXhlYygnYWJvcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5feGhyID0geGhyID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hYm9ydCgpO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9pbml0QWpheDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgeGhyID0gbmV3IFJ1bnRpbWVDbGllbnQoJ1hNTEh0dHBSZXF1ZXN0Jyk7XG4gICAgXG4gICAgICAgICAgICAgICAgeGhyLm9uKCAndXBsb2FkcHJvZ3Jlc3MgcHJvZ3Jlc3MnLCBmdW5jdGlvbiggZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnRyaWdnZXIoICdwcm9ncmVzcycsIGUubG9hZGVkIC8gZS50b3RhbCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIHhoci5vbiggJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHhoci5leGVjKCdnZXRTdGF0dXMnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyciA9ICcnO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB4aHIub2ZmKCk7XG4gICAgICAgICAgICAgICAgICAgIG1lLl94aHIgPSBudWxsO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Jlc3BvbnNlID0geGhyLmV4ZWMoJ2dldFJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcmVzcG9uc2VKc29uID0geGhyLmV4ZWMoJ2dldFJlc3BvbnNlQXNKc29uJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cyA+PSA1MDAgJiYgc3RhdHVzIDwgNjAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuX3Jlc3BvbnNlID0geGhyLmV4ZWMoJ2dldFJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5fcmVzcG9uc2VKc29uID0geGhyLmV4ZWMoJ2dldFJlc3BvbnNlQXNKc29uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgPSAnc2VydmVyJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyciA9ICdodHRwJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB4aHIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICB4aHIgPSBudWxsO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyID8gbWUudHJpZ2dlciggJ2Vycm9yJywgZXJyICkgOiBtZS50cmlnZ2VyKCdsb2FkJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgeGhyLm9uKCAnZXJyb3InLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLm9mZigpO1xuICAgICAgICAgICAgICAgICAgICBtZS5feGhyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgbWUudHJpZ2dlciggJ2Vycm9yJywgJ2h0dHAnICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWUuX3hociA9IHhocjtcbiAgICAgICAgICAgICAgICByZXR1cm4geGhyO1xuICAgICAgICAgICAgfSxcbiAgICBcbiAgICAgICAgICAgIF9zZXRSZXF1ZXN0SGVhZGVyOiBmdW5jdGlvbiggeGhyLCBoZWFkZXJzICkge1xuICAgICAgICAgICAgICAgICQuZWFjaCggaGVhZGVycywgZnVuY3Rpb24oIGtleSwgdmFsICkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuZXhlYyggJ3NldFJlcXVlc3RIZWFkZXInLCBrZXksIHZhbCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBAZmlsZU92ZXJ2aWV3IOayoeacieWbvuWDj+WkhOeQhueahOeJiOacrOOAglxuICAgICAqL1xuICAgIGRlZmluZSgncHJlc2V0L3dpdGhvdXRpbWFnZScsW1xuICAgICAgICAnYmFzZScsXG4gICAgXG4gICAgICAgIC8vIHdpZGdldHNcbiAgICAgICAgJ3dpZGdldHMvZmlsZWRuZCcsXG4gICAgICAgICd3aWRnZXRzL2ZpbGVwYXN0ZScsXG4gICAgICAgICd3aWRnZXRzL2ZpbGVwaWNrZXInLFxuICAgICAgICAnd2lkZ2V0cy9xdWV1ZScsXG4gICAgICAgICd3aWRnZXRzL3J1bnRpbWUnLFxuICAgICAgICAnd2lkZ2V0cy91cGxvYWQnLFxuICAgICAgICAnd2lkZ2V0cy92YWxpZGF0b3InLFxuICAgIFxuICAgICAgICAvLyBydW50aW1lc1xuICAgICAgICAvLyBodG1sNVxuICAgICAgICAncnVudGltZS9odG1sNS9ibG9iJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvZG5kJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvZmlsZXBhc3RlJyxcbiAgICAgICAgJ3J1bnRpbWUvaHRtbDUvZmlsZXBpY2tlcicsXG4gICAgICAgICdydW50aW1lL2h0bWw1L3RyYW5zcG9ydCcsXG4gICAgXG4gICAgICAgIC8vIGZsYXNoXG4gICAgICAgICdydW50aW1lL2ZsYXNoL2ZpbGVwaWNrZXInLFxuICAgICAgICAncnVudGltZS9mbGFzaC90cmFuc3BvcnQnXG4gICAgXSwgZnVuY3Rpb24oIEJhc2UgKSB7XG4gICAgICAgIHJldHVybiBCYXNlO1xuICAgIH0pO1xuICAgIGRlZmluZSgnd2VidXBsb2FkZXInLFtcbiAgICAgICAgJ3ByZXNldC93aXRob3V0aW1hZ2UnXG4gICAgXSwgZnVuY3Rpb24oIHByZXNldCApIHtcbiAgICAgICAgcmV0dXJuIHByZXNldDtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVxdWlyZSgnd2VidXBsb2FkZXInKTtcbn0pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvd2VidXBsb2FkZXIvd2VidXBsb2FkZXIud2l0aG91dGltYWdlLmpzIn0=
