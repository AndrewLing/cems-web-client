'use strict';

var gulp = require('gulp');
//var jshint = require('jshint');
var $ = require('gulp-load-plugins')();
var del = require('del');
var merge = require('merge-stream');
var runSequence = require('run-sequence');
var amdOptimize = require('amd-optimize');
var argv = require('minimist')(process.argv.slice(2));
var pkgs = require('./package.json').dependencies;

// 设置参数
var RELEASE = !!argv.release;             // 是否在构建时压缩和打包处理
var DEMO = !!argv.demo;                   // 是否在构建Demo环境
console.log('release =', RELEASE);
console.log('demo =', DEMO);

var AUTOPREFIXER_BROWSERS = [             // autoprefixer 配置
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];
var src = {
    base: 'www',
    assets: 'assets/**/*',
    images: 'images/**/*.{jpg,jpeg,png,gif,svg}',
    pages: 'pages/**/*.{html,htm}',
    styles: 'styles/modules/**/*.{css,less}',
    scripts: 'scripts/**/*'
};
var dist = {
    base: 'build',
    vendor: '/js/vendor',
    fonts: '/fonts',
    images: '/images',
    pages: '/pages',
    styles: '/css',
    scripts: '/js'
};

gulp.task('default', ['server'], function () {
    gulp.start('help');
});

// 清除
gulp.task('clean', del.bind(null, ['build/*'], {dot: true}));

// 第三方插件管理
gulp.task('vendor', function () {
    return merge(
        gulp.src('node_modules/jquery/dist/*.*')
            .pipe(gulp.dest(dist.base + dist.vendor + '/jquery')),
        gulp.src('node_modules/bootstrap/dist/js/*.*')
            .pipe(gulp.dest(dist.base + dist.vendor + '/bootstrap'))
    );
});

// 字体
gulp.task('fonts', function () {
    return gulp.src('node_modules/bootstrap/fonts/**')
        .pipe(gulp.dest(dist.base + dist.fonts));
});

// 静态资源文件
gulp.task('assets', function () {
    return gulp.src(src.assets)
        .pipe(gulp.dest(dist.base));
});

// 图片
gulp.task('images', function () {
    return gulp.src(src.images)
        .pipe($.plumber({errorHandler: $.notify.onError('images Error: <%= error.message %>')}))
        //.pipe($.cache($.imagemin({
        //    progressive: true,
        //    interlaced: true
        //})))
        .pipe($.changed(dist.base + dist.images))
        .pipe(gulp.dest(dist.base + dist.images));
});

// HTML 页面
gulp.task('pages', function () {
    return gulp.src(src.pages)
        .pipe($.plumber({errorHandler: $.notify.onError('pages Error: <%= error.message %>')}))
        .pipe($.if(RELEASE, $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: true,
            minifyCSS: true
        })))
        .pipe($.changed(dist.base, {extension: '.html'}))
        .pipe(gulp.dest(dist.base));
});

// CSS 样式
gulp.task('styles', function () {
    return gulp.src(src.styles)
        .pipe($.plumber({errorHandler: $.notify.onError('styles Error: <%= error.message %>')}))
        .pipe($.if(!RELEASE, $.sourcemaps.init()))
        .pipe($.less())
        .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
        .pipe($.csscomb())
        .pipe(RELEASE ? $.cssmin() : $.util.noop())
        //.pipe($.cssmin())
        //.pipe($.rename('style.css'))
        .pipe($.if(!RELEASE, $.sourcemaps.write()))
        .pipe($.changed(dist.base + dist.styles, {extension: '.less'}))
        .pipe(gulp.dest(dist.base + dist.styles));
});

// JavaScript
gulp.task('scripts', function () {
    return gulp.src(src.scripts)
        //.pipe(jshint()) // 进行js静态检查
        //.pipe(jshint.reporter('default')) // 对js代码进行报错提示
        .pipe($.plumber({errorHandler: $.notify.onError('scripts Error: <%= error.message %>')}))
        .pipe($.if(!RELEASE, $.sourcemaps.init()))
        //.pipe($.if(RELEASE, amdOptimize("main", {})))
        //.pipe($.if(RELEASE, $.concat("main.js")))   // 合并
        .pipe($.if(RELEASE, $.uglify()))
        //.pipe($.rename({suffix:'.min'}))
        .pipe($.if(!RELEASE, $.sourcemaps.write()))
        .pipe($.changed(dist.base + dist.scripts))
        .pipe(gulp.dest(dist.base + dist.scripts));
});

// Build
gulp.task('build', ['clean'], function (cb) {
    runSequence(['pages', 'assets', 'vendor', 'images', 'fonts', 'styles', 'scripts'], cb);
});

// 运行 BrowserSync
gulp.task('server', ['build'], function () {

    var path = require('path');
    var url = require('url');
    var fs = require('fs');
    var browserSync = require('browser-sync');
    var proxyMiddleware = require('http-proxy-middleware');
    var Mock = require('mockjs');
    var uuid = require('uuid');

    var middleware = [];
    var isMock = false;

    if (isMock) {
        middleware = function (req, res, next) {
            var urlObj = url.parse(req.url, true),
                method = req.method,
                paramObj = urlObj.query;

            if (urlObj.pathname.match(/\..+$/) || urlObj.pathname.match(/\/$/)) {
                next();
                return;
            }
            console.log('[requist] ', method, urlObj.pathname, paramObj);

            var pathTree = urlObj.pathname.split('/');
            var mockDataFile = path.join(__dirname + path.sep + 'data', pathTree[1]) + ".js";
            //file exist or not
            fs.access(mockDataFile, fs.F_OK, function (err) {
                if (err) {
                    var c = {
                        "success": false,
                        "data": null,
                        "failCode": 404,
                        "params": null,
                        "message": "没有找到此文件",
                        "notFound": mockDataFile
                    };
                    //console.log('[response] ', c);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(c));
                    next();
                    return;
                }

                try {
                    var data = fs.readFileSync(mockDataFile, 'utf-8');
                    eval(data);
                    var result = (module.exports[pathTree[2]]) && Mock.mock(module.exports[pathTree[2]]);
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    //res.setHeader('Content-Type', 'application/json');
                    res.setHeader('tokenId', uuid.v1());
                    var s = result || {
                            "success": false,
                            "data": null,
                            "failCode": 0,
                            "params": null,
                            "message": null
                        };
                    //console.log('[response] ', JSON.stringify(s));
                    res.end(JSON.stringify(s) || s);
                } catch (e) {
                    console.error(e);
                }
            });
            //next();
        };
    }
    else {
        var host = 'http://127.0.0.1:8080';
        var ssohost = 'http://127.0.0.1:8085';
        middleware = [
            proxyMiddleware(['/user'],   {target: host, changeOrigin: true}),
            proxyMiddleware(['/home'],  {target: host, changeOrigin: true}),
            proxyMiddleware(['/log'],    {target: host, changeOrigin: true}),
            proxyMiddleware(['/role'],   {target: host, changeOrigin: true}),
            proxyMiddleware(['/pile'],   {target: host, changeOrigin: true}), 
            proxyMiddleware(['/domain'], {target: host, changeOrigin: true}),
            proxyMiddleware(['/station'], {target: host, changeOrigin: true}),
            proxyMiddleware(['/fileManager'], {target: host, changeOrigin: true}),
            proxyMiddleware(['/order'], {target: host, changeOrigin: true}),
            proxyMiddleware(['/alarm'], {target: host, changeOrigin: true}),
            proxyMiddleware(['/gunMonitor'], {target: host, changeOrigin: true}),
            proxyMiddleware(['/card'], {target: host, changeOrigin: true}),
            proxyMiddleware(['/websocket'], {target: host, ws: true}),
            proxyMiddleware(['/sso'], {target: ssohost, changeOrigin: true}),
            proxyMiddleware(['/chargeHistory'], {target: host, changeOrigin: true})
            
        ];
    }

    browserSync({
        files: '/build/**', //监听整个项目
        open: false, // 'external' 打开外部URL, 'local' 打开本地主机URL
        //https: true,
        port: 80,
        online: false,
        notify: false,
        logLevel: "info",
        logPrefix: "cems mock",
        logConnections: true, //日志中记录连接
        logFileChanges: true, //日志信息有关更改的文件
        scrollProportionally: false, //视口同步到顶部位置
        ghostMode: {
            clicks: false,
            forms: false,
            scroll: false
        },
        server: {
            baseDir: './build',
            middleware: middleware
        }
    });

    gulp.watch(src.assets, ['assets']);
    gulp.watch(src.images, ['images']);
    gulp.watch(src.pages, ['pages']);
    gulp.watch(src.styles, ['styles']);
    gulp.watch(src.scripts, ['scripts']);
    gulp.watch('./build/**/*.*', function (file) {
        browserSync.reload(path.relative(__dirname, file.path));
    });
});

gulp.task('help', function () {
    console.log('	gulp build			        文件发布打包');
    console.log('	gulp assets			        静态资源文件发布');
    console.log('	gulp images			        图片文件发布');
    console.log('	gulp pages			        html（模板）页面文件发布');
    console.log('	gulp styles			        css（less）层叠样式文件发布');
    console.log('	gulp scripts			    JavaScript脚本文件发布');
    console.log('	gulp help			        gulp参数说明');
    console.log('	gulp server			        测试server');
    console.log('	gulp --demo  			    生产环境（默认生产环境）');
    console.log('	gulp --deploy			    生产环境（默认生产环境）');
    console.log('	gulp --release			    开发环境');
});