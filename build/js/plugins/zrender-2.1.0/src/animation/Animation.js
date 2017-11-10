/**
 * 动画主类, 调度和管理所有动画控制器
 * 
 * @module zrender/animation/Animation
 * @author pissang(https://github.com/pissang)
 */
define(
    function(require) {
        
        'use strict';

        var Clip = require('./Clip');
        var color = require('../tool/color');
        var util = require('../tool/util');
        var Dispatcher = require('../tool/event').Dispatcher;

        var requestAnimationFrame = window.requestAnimationFrame
                                    || window.msRequestAnimationFrame
                                    || window.mozRequestAnimationFrame
                                    || window.webkitRequestAnimationFrame
                                    || function (func) {
                                        setTimeout(func, 16);
                                    };

        var arraySlice = Array.prototype.slice;

        /**
         * @typedef {Object} IZRenderStage
         * @property {Function} update
         */
        
        /** 
         * @alias module:zrender/animation/Animation
         * @constructor
         * @param {Object} [options]
         * @param {Function} [options.onframe]
         * @param {IZRenderStage} [options.stage]
         * @example
         *     var animation = new Animation();
         *     var obj = {
         *         x: 100,
         *         y: 100
         *     };
         *     animation.animate(node.position)
         *         .when(1000, {
         *             x: 500,
         *             y: 500
         *         })
         *         .when(2000, {
         *             x: 100,
         *             y: 100
         *         })
         *         .start('spline');
         */
        var Animation = function (options) {

            options = options || {};

            this.stage = options.stage || {};

            this.onframe = options.onframe || function() {};

            // private properties
            this._clips = [];

            this._running = false;

            this._time = 0;

            Dispatcher.call(this);
        };

        Animation.prototype = {
            /**
             * 添加动画片段
             * @param {module:zrender/animation/Clip} clip
             */
            add: function(clip) {
                this._clips.push(clip);
            },
            /**
             * 删除动画片段
             * @param {module:zrender/animation/Clip} clip
             */
            remove: function(clip) {
                var idx = util.indexOf(this._clips, clip);
                if (idx >= 0) {
                    this._clips.splice(idx, 1);
                }
            },
            _update: function() {

                var time = new Date().getTime();
                var delta = time - this._time;
                var clips = this._clips;
                var len = clips.length;

                var deferredEvents = [];
                var deferredClips = [];
                for (var i = 0; i < len; i++) {
                    var clip = clips[i];
                    var e = clip.step(time);
                    // Throw out the events need to be called after
                    // stage.update, like destroy
                    if (e) {
                        deferredEvents.push(e);
                        deferredClips.push(clip);
                    }
                }

                // Remove the finished clip
                for (var i = 0; i < len;) {
                    if (clips[i]._needsRemove) {
                        clips[i] = clips[len - 1];
                        clips.pop();
                        len--;
                    }
                    else {
                        i++;
                    }
                }

                len = deferredEvents.length;
                for (var i = 0; i < len; i++) {
                    deferredClips[i].fire(deferredEvents[i]);
                }

                this._time = time;

                this.onframe(delta);

                this.dispatch('frame', delta);

                if (this.stage.update) {
                    this.stage.update();
                }
            },
            /**
             * 开始运行动画
             */
            start: function () {
                var self = this;

                this._running = true;

                function step() {
                    if (self._running) {
                        
                        requestAnimationFrame(step);

                        self._update();
                    }
                }

                this._time = new Date().getTime();
                requestAnimationFrame(step);
            },
            /**
             * 停止运行动画
             */
            stop: function () {
                this._running = false;
            },
            /**
             * 清除所有动画片段
             */
            clear : function () {
                this._clips = [];
            },
            /**
             * 对一个目标创建一个animator对象，可以指定目标中的属性使用动画
             * @param  {Object} target
             * @param  {Object} options
             * @param  {boolean} [options.loop=false] 是否循环播放动画
             * @param  {Function} [options.getter=null]
             *         如果指定getter函数，会通过getter函数取属性值
             * @param  {Function} [options.setter=null]
             *         如果指定setter函数，会通过setter函数设置属性值
             * @return {module:zrender/animation/Animation~Animator}
             */
            animate : function (target, options) {
                options = options || {};
                var deferred = new Animator(
                    target,
                    options.loop,
                    options.getter, 
                    options.setter
                );
                deferred.animation = this;
                return deferred;
            },
            constructor: Animation
        };

        util.merge(Animation.prototype, Dispatcher.prototype, true);

        function _defaultGetter(target, key) {
            return target[key];
        }

        function _defaultSetter(target, key, value) {
            target[key] = value;
        }

        function _interpolateNumber(p0, p1, percent) {
            return (p1 - p0) * percent + p0;
        }

        function _interpolateArray(p0, p1, percent, out, arrDim) {
            var len = p0.length;
            if (arrDim == 1) {
                for (var i = 0; i < len; i++) {
                    out[i] = _interpolateNumber(p0[i], p1[i], percent); 
                }
            }
            else {
                var len2 = p0[0].length;
                for (var i = 0; i < len; i++) {
                    for (var j = 0; j < len2; j++) {
                        out[i][j] = _interpolateNumber(
                            p0[i][j], p1[i][j], percent
                        );
                    }
                }
            }
        }

        function _isArrayLike(data) {
            switch (typeof data) {
                case 'undefined':
                case 'string':
                    return false;
            }
            
            return typeof data.length !== 'undefined';
        }

        function _catmullRomInterpolateArray(
            p0, p1, p2, p3, t, t2, t3, out, arrDim
        ) {
            var len = p0.length;
            if (arrDim == 1) {
                for (var i = 0; i < len; i++) {
                    out[i] = _catmullRomInterpolate(
                        p0[i], p1[i], p2[i], p3[i], t, t2, t3
                    );
                }
            }
            else {
                var len2 = p0[0].length;
                for (var i = 0; i < len; i++) {
                    for (var j = 0; j < len2; j++) {
                        out[i][j] = _catmullRomInterpolate(
                            p0[i][j], p1[i][j], p2[i][j], p3[i][j],
                            t, t2, t3
                        );
                    }
                }
            }
        }

        function _catmullRomInterpolate(p0, p1, p2, p3, t, t2, t3) {
            var v0 = (p2 - p0) * 0.5;
            var v1 = (p3 - p1) * 0.5;
            return (2 * (p1 - p2) + v0 + v1) * t3 
                    + (-3 * (p1 - p2) - 2 * v0 - v1) * t2
                    + v0 * t + p1;
        }

        function _cloneValue(value) {
            if (_isArrayLike(value)) {
                var len = value.length;
                if (_isArrayLike(value[0])) {
                    var ret = [];
                    for (var i = 0; i < len; i++) {
                        ret.push(arraySlice.call(value[i]));
                    }
                    return ret;
                }
                else {
                    return arraySlice.call(value);
                }
            }
            else {
                return value;
            }
        }

        function rgba2String(rgba) {
            rgba[0] = Math.floor(rgba[0]);
            rgba[1] = Math.floor(rgba[1]);
            rgba[2] = Math.floor(rgba[2]);

            return 'rgba(' + rgba.join(',') + ')';
        }

        /**
         * @alias module:zrender/animation/Animation~Animator
         * @constructor
         * @param {Object} target
         * @param {boolean} loop
         * @param {Function} getter
         * @param {Function} setter
         */
        var Animator = function(target, loop, getter, setter) {
            this._tracks = {};
            this._target = target;

            this._loop = loop || false;

            this._getter = getter || _defaultGetter;
            this._setter = setter || _defaultSetter;

            this._clipCount = 0;

            this._delay = 0;

            this._doneList = [];

            this._onframeList = [];

            this._clipList = [];
        };

        Animator.prototype = {
            /**
             * 设置动画关键帧
             * @param  {number} time 关键帧时间，单位是ms
             * @param  {Object} props 关键帧的属性值，key-value表示
             * @return {module:zrender/animation/Animation~Animator}
             */
            when : function(time /* ms */, props) {
                for (var propName in props) {
                    if (!this._tracks[propName]) {
                        this._tracks[propName] = [];
                        // If time is 0 
                        //  Then props is given initialize value
                        // Else
                        //  Initialize value from current prop value
                        if (time !== 0) {
                            this._tracks[propName].push({
                                time : 0,
                                value : _cloneValue(
                                    this._getter(this._target, propName)
                                )
                            });
                        }
                    }
                    this._tracks[propName].push({
                        time : parseInt(time, 10),
                        value : props[propName]
                    });
                }
                return this;
            },
            /**
             * 添加动画每一帧的回调函数
             * @param  {Function} callback
             * @return {module:zrender/animation/Animation~Animator}
             */
            during: function (callback) {
                this._onframeList.push(callback);
                return this;
            },
            /**
             * 开始执行动画
             * @param  {string|Function} easing 
             *         动画缓动函数，详见{@link module:zrender/animation/easing}
             * @return {module:zrender/animation/Animation~Animator}
             */
            start: function (easing) {

                var self = this;
                var setter = this._setter;
                var getter = this._getter;
                var useSpline = easing === 'spline';

                var ondestroy = function() {
                    self._clipCount--;
                    if (self._clipCount === 0) {
                        // Clear all tracks
                        self._tracks = {};

                        var len = self._doneList.length;
                        for (var i = 0; i < len; i++) {
                            self._doneList[i].call(self);
                        }
                    }
                };

                var createTrackClip = function (keyframes, propName) {
                    var trackLen = keyframes.length;
                    if (!trackLen) {
                        return;
                    }
                    // Guess data type
                    var firstVal = keyframes[0].value;
                    var isValueArray = _isArrayLike(firstVal);
                    var isValueColor = false;

                    // For vertices morphing
                    var arrDim = (
                            isValueArray 
                            && _isArrayLike(firstVal[0])
                        )
                        ? 2 : 1;
                    // Sort keyframe as ascending
                    keyframes.sort(function(a, b) {
                        return a.time - b.time;
                    });
                    var trackMaxTime;
                    if (trackLen) {
                        trackMaxTime = keyframes[trackLen - 1].time;
                    }
                    else {
                        return;
                    }
                    // Percents of each keyframe
                    var kfPercents = [];
                    // Value of each keyframe
                    var kfValues = [];
                    for (var i = 0; i < trackLen; i++) {
                        kfPercents.push(keyframes[i].time / trackMaxTime);
                        // Assume value is a color when it is a string
                        var value = keyframes[i].value;
                        if (typeof(value) == 'string') {
                            value = color.toArray(value);
                            if (value.length === 0) {    // Invalid color
                                value[0] = value[1] = value[2] = 0;
                                value[3] = 1;
                            }
                            isValueColor = true;
                        }
                        kfValues.push(value);
                    }

                    // Cache the key of last frame to speed up when 
                    // animation playback is sequency
                    var cacheKey = 0;
                    var cachePercent = 0;
                    var start;
                    var i;
                    var w;
                    var p0;
                    var p1;
                    var p2;
                    var p3;


                    if (isValueColor) {
                        var rgba = [ 0, 0, 0, 0 ];
                    }

                    var onframe = function (target, percent) {
                        // Find the range keyframes
                        // kf1-----kf2---------current--------kf3
                        // find kf2 and kf3 and do interpolation
                        if (percent < cachePercent) {
                            // Start from next key
                            start = Math.min(cacheKey + 1, trackLen - 1);
                            for (i = start; i >= 0; i--) {
                                if (kfPercents[i] <= percent) {
                                    break;
                                }
                            }
                            i = Math.min(i, trackLen - 2);
                        }
                        else {
                            for (i = cacheKey; i < trackLen; i++) {
                                if (kfPercents[i] > percent) {
                                    break;
                                }
                            }
                            i = Math.min(i - 1, trackLen - 2);
                        }
                        cacheKey = i;
                        cachePercent = percent;

                        var range = (kfPercents[i + 1] - kfPercents[i]);
                        if (range === 0) {
                            return;
                        }
                        else {
                            w = (percent - kfPercents[i]) / range;
                        }
                        if (useSpline) {
                            p1 = kfValues[i];
                            p0 = kfValues[i === 0 ? i : i - 1];
                            p2 = kfValues[i > trackLen - 2 ? trackLen - 1 : i + 1];
                            p3 = kfValues[i > trackLen - 3 ? trackLen - 1 : i + 2];
                            if (isValueArray) {
                                _catmullRomInterpolateArray(
                                    p0, p1, p2, p3, w, w * w, w * w * w,
                                    getter(target, propName),
                                    arrDim
                                );
                            }
                            else {
                                var value;
                                if (isValueColor) {
                                    value = _catmullRomInterpolateArray(
                                        p0, p1, p2, p3, w, w * w, w * w * w,
                                        rgba, 1
                                    );
                                    value = rgba2String(rgba);
                                }
                                else {
                                    value = _catmullRomInterpolate(
                                        p0, p1, p2, p3, w, w * w, w * w * w
                                    );
                                }
                                setter(
                                    target,
                                    propName,
                                    value
                                );
                            }
                        }
                        else {
                            if (isValueArray) {
                                _interpolateArray(
                                    kfValues[i], kfValues[i + 1], w,
                                    getter(target, propName),
                                    arrDim
                                );
                            }
                            else {
                                var value;
                                if (isValueColor) {
                                    _interpolateArray(
                                        kfValues[i], kfValues[i + 1], w,
                                        rgba, 1
                                    );
                                    value = rgba2String(rgba);
                                }
                                else {
                                    value = _interpolateNumber(kfValues[i], kfValues[i + 1], w);
                                }
                                setter(
                                    target,
                                    propName,
                                    value
                                );
                            }
                        }

                        for (i = 0; i < self._onframeList.length; i++) {
                            self._onframeList[i](target, percent);
                        }
                    };

                    var clip = new Clip({
                        target : self._target,
                        life : trackMaxTime,
                        loop : self._loop,
                        delay : self._delay,
                        onframe : onframe,
                        ondestroy : ondestroy
                    });

                    if (easing && easing !== 'spline') {
                        clip.easing = easing;
                    }
                    self._clipList.push(clip);
                    self._clipCount++;
                    self.animation.add(clip);
                };

                for (var propName in this._tracks) {
                    createTrackClip(this._tracks[propName], propName);
                }
                return this;
            },
            /**
             * 停止动画
             */
            stop : function() {
                for (var i = 0; i < this._clipList.length; i++) {
                    var clip = this._clipList[i];
                    this.animation.remove(clip);
                }
                this._clipList = [];
            },
            /**
             * 设置动画延迟开始的时间
             * @param  {number} time 单位ms
             * @return {module:zrender/animation/Animation~Animator}
             */
            delay : function (time) {
                this._delay = time;
                return this;
            },
            /**
             * 添加动画结束的回调
             * @param  {Function} cb
             * @return {module:zrender/animation/Animation~Animator}
             */
            done : function(cb) {
                if (cb) {
                    this._doneList.push(cb);
                }
                return this;
            }
        };

        return Animation;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2FuaW1hdGlvbi9BbmltYXRpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDliqjnlLvkuLvnsbssIOiwg+W6puWSjOeuoeeQhuaJgOacieWKqOeUu+aOp+WItuWZqFxuICogXG4gKiBAbW9kdWxlIHpyZW5kZXIvYW5pbWF0aW9uL0FuaW1hdGlvblxuICogQGF1dGhvciBwaXNzYW5nKGh0dHBzOi8vZ2l0aHViLmNvbS9waXNzYW5nKVxuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24ocmVxdWlyZSkge1xuICAgICAgICBcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgICAgIHZhciBDbGlwID0gcmVxdWlyZSgnLi9DbGlwJyk7XG4gICAgICAgIHZhciBjb2xvciA9IHJlcXVpcmUoJy4uL3Rvb2wvY29sb3InKTtcbiAgICAgICAgdmFyIHV0aWwgPSByZXF1aXJlKCcuLi90b29sL3V0aWwnKTtcbiAgICAgICAgdmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi90b29sL2V2ZW50JykuRGlzcGF0Y2hlcjtcblxuICAgICAgICB2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBmdW5jdGlvbiAoZnVuYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuYywgMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICB2YXIgYXJyYXlTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGVkZWYge09iamVjdH0gSVpSZW5kZXJTdGFnZVxuICAgICAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSB1cGRhdGVcbiAgICAgICAgICovXG4gICAgICAgIFxuICAgICAgICAvKiogXG4gICAgICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9hbmltYXRpb24vQW5pbWF0aW9uXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLm9uZnJhbWVdXG4gICAgICAgICAqIEBwYXJhbSB7SVpSZW5kZXJTdGFnZX0gW29wdGlvbnMuc3RhZ2VdXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICAgICB2YXIgYW5pbWF0aW9uID0gbmV3IEFuaW1hdGlvbigpO1xuICAgICAgICAgKiAgICAgdmFyIG9iaiA9IHtcbiAgICAgICAgICogICAgICAgICB4OiAxMDAsXG4gICAgICAgICAqICAgICAgICAgeTogMTAwXG4gICAgICAgICAqICAgICB9O1xuICAgICAgICAgKiAgICAgYW5pbWF0aW9uLmFuaW1hdGUobm9kZS5wb3NpdGlvbilcbiAgICAgICAgICogICAgICAgICAud2hlbigxMDAwLCB7XG4gICAgICAgICAqICAgICAgICAgICAgIHg6IDUwMCxcbiAgICAgICAgICogICAgICAgICAgICAgeTogNTAwXG4gICAgICAgICAqICAgICAgICAgfSlcbiAgICAgICAgICogICAgICAgICAud2hlbigyMDAwLCB7XG4gICAgICAgICAqICAgICAgICAgICAgIHg6IDEwMCxcbiAgICAgICAgICogICAgICAgICAgICAgeTogMTAwXG4gICAgICAgICAqICAgICAgICAgfSlcbiAgICAgICAgICogICAgICAgICAuc3RhcnQoJ3NwbGluZScpO1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEFuaW1hdGlvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB0aGlzLnN0YWdlID0gb3B0aW9ucy5zdGFnZSB8fCB7fTtcblxuICAgICAgICAgICAgdGhpcy5vbmZyYW1lID0gb3B0aW9ucy5vbmZyYW1lIHx8IGZ1bmN0aW9uKCkge307XG5cbiAgICAgICAgICAgIC8vIHByaXZhdGUgcHJvcGVydGllc1xuICAgICAgICAgICAgdGhpcy5fY2xpcHMgPSBbXTtcblxuICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICB0aGlzLl90aW1lID0gMDtcblxuICAgICAgICAgICAgRGlzcGF0Y2hlci5jYWxsKHRoaXMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIEFuaW1hdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOa3u+WKoOWKqOeUu+eJh+autVxuICAgICAgICAgICAgICogQHBhcmFtIHttb2R1bGU6enJlbmRlci9hbmltYXRpb24vQ2xpcH0gY2xpcFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhZGQ6IGZ1bmN0aW9uKGNsaXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jbGlwcy5wdXNoKGNsaXApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yig6Zmk5Yqo55S754mH5q61XG4gICAgICAgICAgICAgKiBAcGFyYW0ge21vZHVsZTp6cmVuZGVyL2FuaW1hdGlvbi9DbGlwfSBjbGlwXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24oY2xpcCkge1xuICAgICAgICAgICAgICAgIHZhciBpZHggPSB1dGlsLmluZGV4T2YodGhpcy5fY2xpcHMsIGNsaXApO1xuICAgICAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbGlwcy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IHRpbWUgLSB0aGlzLl90aW1lO1xuICAgICAgICAgICAgICAgIHZhciBjbGlwcyA9IHRoaXMuX2NsaXBzO1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBjbGlwcy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWRFdmVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWRDbGlwcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsaXAgPSBjbGlwc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBjbGlwLnN0ZXAodGltZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRocm93IG91dCB0aGUgZXZlbnRzIG5lZWQgdG8gYmUgY2FsbGVkIGFmdGVyXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0YWdlLnVwZGF0ZSwgbGlrZSBkZXN0cm95XG4gICAgICAgICAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZEV2ZW50cy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRDbGlwcy5wdXNoKGNsaXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBmaW5pc2hlZCBjbGlwXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGlwc1tpXS5fbmVlZHNSZW1vdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaXBzW2ldID0gY2xpcHNbbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGlwcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGVuID0gZGVmZXJyZWRFdmVudHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRDbGlwc1tpXS5maXJlKGRlZmVycmVkRXZlbnRzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl90aW1lID0gdGltZTtcblxuICAgICAgICAgICAgICAgIHRoaXMub25mcmFtZShkZWx0YSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoKCdmcmFtZScsIGRlbHRhKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YWdlLnVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWdlLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOW8gOWni+i/kOihjOWKqOeUu1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gc3RlcCgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuX3J1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHN0ZXApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl91cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc3RlcCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlgZzmraLov5DooYzliqjnlLtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOa4hemZpOaJgOacieWKqOeUu+eJh+autVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjbGVhciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jbGlwcyA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5a+55LiA5Liq55uu5qCH5Yib5bu65LiA5LiqYW5pbWF0b3Llr7nosaHvvIzlj6/ku6XmjIflrprnm67moIfkuK3nmoTlsZ7mgKfkvb/nlKjliqjnlLtcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gdGFyZ2V0XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBwYXJhbSAge2Jvb2xlYW59IFtvcHRpb25zLmxvb3A9ZmFsc2VdIOaYr+WQpuW+queOr+aSreaUvuWKqOeUu1xuICAgICAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IFtvcHRpb25zLmdldHRlcj1udWxsXVxuICAgICAgICAgICAgICogICAgICAgICDlpoLmnpzmjIflrppnZXR0ZXLlh73mlbDvvIzkvJrpgJrov4dnZXR0ZXLlh73mlbDlj5blsZ7mgKflgLxcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbb3B0aW9ucy5zZXR0ZXI9bnVsbF1cbiAgICAgICAgICAgICAqICAgICAgICAg5aaC5p6c5oyH5a6ac2V0dGVy5Ye95pWw77yM5Lya6YCa6L+Hc2V0dGVy5Ye95pWw6K6+572u5bGe5oCn5YC8XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9hbmltYXRpb24vQW5pbWF0aW9ufkFuaW1hdG9yfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhbmltYXRlIDogZnVuY3Rpb24gKHRhcmdldCwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBBbmltYXRvcihcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvb3AsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZ2V0dGVyLCBcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zZXR0ZXJcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLmFuaW1hdGlvbiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBBbmltYXRpb25cbiAgICAgICAgfTtcblxuICAgICAgICB1dGlsLm1lcmdlKEFuaW1hdGlvbi5wcm90b3R5cGUsIERpc3BhdGNoZXIucHJvdG90eXBlLCB0cnVlKTtcblxuICAgICAgICBmdW5jdGlvbiBfZGVmYXVsdEdldHRlcih0YXJnZXQsIGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2RlZmF1bHRTZXR0ZXIodGFyZ2V0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2ludGVycG9sYXRlTnVtYmVyKHAwLCBwMSwgcGVyY2VudCkge1xuICAgICAgICAgICAgcmV0dXJuIChwMSAtIHAwKSAqIHBlcmNlbnQgKyBwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9pbnRlcnBvbGF0ZUFycmF5KHAwLCBwMSwgcGVyY2VudCwgb3V0LCBhcnJEaW0pIHtcbiAgICAgICAgICAgIHZhciBsZW4gPSBwMC5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoYXJyRGltID09IDEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtpXSA9IF9pbnRlcnBvbGF0ZU51bWJlcihwMFtpXSwgcDFbaV0sIHBlcmNlbnQpOyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVuMiA9IHAwWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGVuMjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRbaV1bal0gPSBfaW50ZXJwb2xhdGVOdW1iZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcDBbaV1bal0sIHAxW2ldW2pdLCBwZXJjZW50XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2lzQXJyYXlMaWtlKGRhdGEpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZW9mIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBkYXRhLmxlbmd0aCAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfY2F0bXVsbFJvbUludGVycG9sYXRlQXJyYXkoXG4gICAgICAgICAgICBwMCwgcDEsIHAyLCBwMywgdCwgdDIsIHQzLCBvdXQsIGFyckRpbVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHZhciBsZW4gPSBwMC5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoYXJyRGltID09IDEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtpXSA9IF9jYXRtdWxsUm9tSW50ZXJwb2xhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBwMFtpXSwgcDFbaV0sIHAyW2ldLCBwM1tpXSwgdCwgdDIsIHQzXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGxlbjIgPSBwMFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxlbjI7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0W2ldW2pdID0gX2NhdG11bGxSb21JbnRlcnBvbGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMFtpXVtqXSwgcDFbaV1bal0sIHAyW2ldW2pdLCBwM1tpXVtqXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LCB0MiwgdDNcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfY2F0bXVsbFJvbUludGVycG9sYXRlKHAwLCBwMSwgcDIsIHAzLCB0LCB0MiwgdDMpIHtcbiAgICAgICAgICAgIHZhciB2MCA9IChwMiAtIHAwKSAqIDAuNTtcbiAgICAgICAgICAgIHZhciB2MSA9IChwMyAtIHAxKSAqIDAuNTtcbiAgICAgICAgICAgIHJldHVybiAoMiAqIChwMSAtIHAyKSArIHYwICsgdjEpICogdDMgXG4gICAgICAgICAgICAgICAgICAgICsgKC0zICogKHAxIC0gcDIpIC0gMiAqIHYwIC0gdjEpICogdDJcbiAgICAgICAgICAgICAgICAgICAgKyB2MCAqIHQgKyBwMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9jbG9uZVZhbHVlKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoX2lzQXJyYXlMaWtlKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKF9pc0FycmF5TGlrZSh2YWx1ZVswXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucHVzaChhcnJheVNsaWNlLmNhbGwodmFsdWVbaV0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5U2xpY2UuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmdiYTJTdHJpbmcocmdiYSkge1xuICAgICAgICAgICAgcmdiYVswXSA9IE1hdGguZmxvb3IocmdiYVswXSk7XG4gICAgICAgICAgICByZ2JhWzFdID0gTWF0aC5mbG9vcihyZ2JhWzFdKTtcbiAgICAgICAgICAgIHJnYmFbMl0gPSBNYXRoLmZsb29yKHJnYmFbMl0pO1xuXG4gICAgICAgICAgICByZXR1cm4gJ3JnYmEoJyArIHJnYmEuam9pbignLCcpICsgJyknO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhbGlhcyBtb2R1bGU6enJlbmRlci9hbmltYXRpb24vQW5pbWF0aW9ufkFuaW1hdG9yXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbG9vcFxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBnZXR0ZXJcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gc2V0dGVyXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgQW5pbWF0b3IgPSBmdW5jdGlvbih0YXJnZXQsIGxvb3AsIGdldHRlciwgc2V0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLl90cmFja3MgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcblxuICAgICAgICAgICAgdGhpcy5fbG9vcCA9IGxvb3AgfHwgZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuX2dldHRlciA9IGdldHRlciB8fCBfZGVmYXVsdEdldHRlcjtcbiAgICAgICAgICAgIHRoaXMuX3NldHRlciA9IHNldHRlciB8fCBfZGVmYXVsdFNldHRlcjtcblxuICAgICAgICAgICAgdGhpcy5fY2xpcENvdW50ID0gMDtcblxuICAgICAgICAgICAgdGhpcy5fZGVsYXkgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLl9kb25lTGlzdCA9IFtdO1xuXG4gICAgICAgICAgICB0aGlzLl9vbmZyYW1lTGlzdCA9IFtdO1xuXG4gICAgICAgICAgICB0aGlzLl9jbGlwTGlzdCA9IFtdO1xuICAgICAgICB9O1xuXG4gICAgICAgIEFuaW1hdG9yLnByb3RvdHlwZSA9IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6+572u5Yqo55S75YWz6ZSu5binXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHRpbWUg5YWz6ZSu5bin5pe26Ze077yM5Y2V5L2N5pivbXNcbiAgICAgICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gcHJvcHMg5YWz6ZSu5bin55qE5bGe5oCn5YC877yMa2V5LXZhbHVl6KGo56S6XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9hbmltYXRpb24vQW5pbWF0aW9ufkFuaW1hdG9yfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB3aGVuIDogZnVuY3Rpb24odGltZSAvKiBtcyAqLywgcHJvcHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3RyYWNrc1twcm9wTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3RyYWNrc1twcm9wTmFtZV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRpbWUgaXMgMCBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICBUaGVuIHByb3BzIGlzIGdpdmVuIGluaXRpYWxpemUgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICBJbml0aWFsaXplIHZhbHVlIGZyb20gY3VycmVudCBwcm9wIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGltZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3RyYWNrc1twcm9wTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWUgOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA6IF9jbG9uZVZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0dGVyKHRoaXMuX3RhcmdldCwgcHJvcE5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl90cmFja3NbcHJvcE5hbWVdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZSA6IHBhcnNlSW50KHRpbWUsIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlIDogcHJvcHNbcHJvcE5hbWVdXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOa3u+WKoOWKqOeUu+avj+S4gOW4p+eahOWbnuiwg+WHveaVsFxuICAgICAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9hbmltYXRpb24vQW5pbWF0aW9ufkFuaW1hdG9yfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkdXJpbmc6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uZnJhbWVMaXN0LnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5byA5aeL5omn6KGM5Yqo55S7XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtzdHJpbmd8RnVuY3Rpb259IGVhc2luZyBcbiAgICAgICAgICAgICAqICAgICAgICAg5Yqo55S757yT5Yqo5Ye95pWw77yM6K+m6KeBe0BsaW5rIG1vZHVsZTp6cmVuZGVyL2FuaW1hdGlvbi9lYXNpbmd9XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHttb2R1bGU6enJlbmRlci9hbmltYXRpb24vQW5pbWF0aW9ufkFuaW1hdG9yfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdGFydDogZnVuY3Rpb24gKGVhc2luZykge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBzZXR0ZXIgPSB0aGlzLl9zZXR0ZXI7XG4gICAgICAgICAgICAgICAgdmFyIGdldHRlciA9IHRoaXMuX2dldHRlcjtcbiAgICAgICAgICAgICAgICB2YXIgdXNlU3BsaW5lID0gZWFzaW5nID09PSAnc3BsaW5lJztcblxuICAgICAgICAgICAgICAgIHZhciBvbmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fY2xpcENvdW50LS07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLl9jbGlwQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIGFsbCB0cmFja3NcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3RyYWNrcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gc2VsZi5fZG9uZUxpc3QubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2RvbmVMaXN0W2ldLmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIGNyZWF0ZVRyYWNrQ2xpcCA9IGZ1bmN0aW9uIChrZXlmcmFtZXMsIHByb3BOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmFja0xlbiA9IGtleWZyYW1lcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHJhY2tMZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBHdWVzcyBkYXRhIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0VmFsID0ga2V5ZnJhbWVzWzBdLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNWYWx1ZUFycmF5ID0gX2lzQXJyYXlMaWtlKGZpcnN0VmFsKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsdWVDb2xvciA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciB2ZXJ0aWNlcyBtb3JwaGluZ1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJyRGltID0gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsdWVBcnJheSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBfaXNBcnJheUxpa2UoZmlyc3RWYWxbMF0pXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICA/IDIgOiAxO1xuICAgICAgICAgICAgICAgICAgICAvLyBTb3J0IGtleWZyYW1lIGFzIGFzY2VuZGluZ1xuICAgICAgICAgICAgICAgICAgICBrZXlmcmFtZXMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS50aW1lIC0gYi50aW1lO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyYWNrTWF4VGltZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYWNrTGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFja01heFRpbWUgPSBrZXlmcmFtZXNbdHJhY2tMZW4gLSAxXS50aW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFBlcmNlbnRzIG9mIGVhY2gga2V5ZnJhbWVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtmUGVyY2VudHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWUgb2YgZWFjaCBrZXlmcmFtZVxuICAgICAgICAgICAgICAgICAgICB2YXIga2ZWYWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFja0xlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZlBlcmNlbnRzLnB1c2goa2V5ZnJhbWVzW2ldLnRpbWUgLyB0cmFja01heFRpbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lIHZhbHVlIGlzIGEgY29sb3Igd2hlbiBpdCBpcyBhIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0ga2V5ZnJhbWVzW2ldLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZih2YWx1ZSkgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNvbG9yLnRvQXJyYXkodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHsgICAgLy8gSW52YWxpZCBjb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVswXSA9IHZhbHVlWzFdID0gdmFsdWVbMl0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVszXSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsdWVDb2xvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBrZlZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIENhY2hlIHRoZSBrZXkgb2YgbGFzdCBmcmFtZSB0byBzcGVlZCB1cCB3aGVuIFxuICAgICAgICAgICAgICAgICAgICAvLyBhbmltYXRpb24gcGxheWJhY2sgaXMgc2VxdWVuY3lcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhY2hlS2V5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhY2hlUGVyY2VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGFydDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3O1xuICAgICAgICAgICAgICAgICAgICB2YXIgcDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcDM7XG5cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWx1ZUNvbG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmdiYSA9IFsgMCwgMCwgMCwgMCBdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uZnJhbWUgPSBmdW5jdGlvbiAodGFyZ2V0LCBwZXJjZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSByYW5nZSBrZXlmcmFtZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGtmMS0tLS0ta2YyLS0tLS0tLS0tY3VycmVudC0tLS0tLS0ta2YzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIGtmMiBhbmQga2YzIGFuZCBkbyBpbnRlcnBvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVyY2VudCA8IGNhY2hlUGVyY2VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IGZyb20gbmV4dCBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCA9IE1hdGgubWluKGNhY2hlS2V5ICsgMSwgdHJhY2tMZW4gLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSBzdGFydDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtmUGVyY2VudHNbaV0gPD0gcGVyY2VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IE1hdGgubWluKGksIHRyYWNrTGVuIC0gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSBjYWNoZUtleTsgaSA8IHRyYWNrTGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtmUGVyY2VudHNbaV0gPiBwZXJjZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gTWF0aC5taW4oaSAtIDEsIHRyYWNrTGVuIC0gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUtleSA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZVBlcmNlbnQgPSBwZXJjZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSAoa2ZQZXJjZW50c1tpICsgMV0gLSBrZlBlcmNlbnRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYW5nZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcgPSAocGVyY2VudCAtIGtmUGVyY2VudHNbaV0pIC8gcmFuZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXNlU3BsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcDEgPSBrZlZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMCA9IGtmVmFsdWVzW2kgPT09IDAgPyBpIDogaSAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAyID0ga2ZWYWx1ZXNbaSA+IHRyYWNrTGVuIC0gMiA/IHRyYWNrTGVuIC0gMSA6IGkgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMyA9IGtmVmFsdWVzW2kgPiB0cmFja0xlbiAtIDMgPyB0cmFja0xlbiAtIDEgOiBpICsgMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsdWVBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfY2F0bXVsbFJvbUludGVycG9sYXRlQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMCwgcDEsIHAyLCBwMywgdywgdyAqIHcsIHcgKiB3ICogdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldHRlcih0YXJnZXQsIHByb3BOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyckRpbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWx1ZUNvbG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IF9jYXRtdWxsUm9tSW50ZXJwb2xhdGVBcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMCwgcDEsIHAyLCBwMywgdywgdyAqIHcsIHcgKiB3ICogdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZ2JhLCAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByZ2JhMlN0cmluZyhyZ2JhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gX2NhdG11bGxSb21JbnRlcnBvbGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMCwgcDEsIHAyLCBwMywgdywgdyAqIHcsIHcgKiB3ICogd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0ZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsdWVBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfaW50ZXJwb2xhdGVBcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtmVmFsdWVzW2ldLCBrZlZhbHVlc1tpICsgMV0sIHcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXR0ZXIodGFyZ2V0LCBwcm9wTmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJEaW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsdWVDb2xvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2ludGVycG9sYXRlQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2ZWYWx1ZXNbaV0sIGtmVmFsdWVzW2kgKyAxXSwgdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZ2JhLCAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByZ2JhMlN0cmluZyhyZ2JhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gX2ludGVycG9sYXRlTnVtYmVyKGtmVmFsdWVzW2ldLCBrZlZhbHVlc1tpICsgMV0sIHcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZWxmLl9vbmZyYW1lTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX29uZnJhbWVMaXN0W2ldKHRhcmdldCwgcGVyY2VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsaXAgPSBuZXcgQ2xpcCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgOiBzZWxmLl90YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaWZlIDogdHJhY2tNYXhUaW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9vcCA6IHNlbGYuX2xvb3AsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxheSA6IHNlbGYuX2RlbGF5LFxuICAgICAgICAgICAgICAgICAgICAgICAgb25mcmFtZSA6IG9uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmRlc3Ryb3kgOiBvbmRlc3Ryb3lcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVhc2luZyAmJiBlYXNpbmcgIT09ICdzcGxpbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGlwLmVhc2luZyA9IGVhc2luZztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9jbGlwTGlzdC5wdXNoKGNsaXApO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9jbGlwQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hbmltYXRpb24uYWRkKGNsaXApO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiB0aGlzLl90cmFja3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlVHJhY2tDbGlwKHRoaXMuX3RyYWNrc1twcm9wTmFtZV0sIHByb3BOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlgZzmraLliqjnlLtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc3RvcCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fY2xpcExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsaXAgPSB0aGlzLl9jbGlwTGlzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbmltYXRpb24ucmVtb3ZlKGNsaXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9jbGlwTGlzdCA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6K6+572u5Yqo55S75bu26L+f5byA5aeL55qE5pe26Ze0XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IHRpbWUg5Y2V5L2NbXNcbiAgICAgICAgICAgICAqIEByZXR1cm4ge21vZHVsZTp6cmVuZGVyL2FuaW1hdGlvbi9BbmltYXRpb25+QW5pbWF0b3J9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRlbGF5IDogZnVuY3Rpb24gKHRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWxheSA9IHRpbWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmt7vliqDliqjnlLvnu5PmnZ/nmoTlm57osINcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYlxuICAgICAgICAgICAgICogQHJldHVybiB7bW9kdWxlOnpyZW5kZXIvYW5pbWF0aW9uL0FuaW1hdGlvbn5BbmltYXRvcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZG9uZSA6IGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvbmVMaXN0LnB1c2goY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gQW5pbWF0aW9uO1xuICAgIH1cbik7XG4iXSwiZmlsZSI6InBsdWdpbnMvenJlbmRlci0yLjEuMC9zcmMvYW5pbWF0aW9uL0FuaW1hdGlvbi5qcyJ9
