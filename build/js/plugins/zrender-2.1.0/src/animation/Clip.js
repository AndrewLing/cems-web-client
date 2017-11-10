/**
 * 动画主控制器
 * @config target 动画对象，可以是数组，如果是数组的话会批量分发onframe等事件
 * @config life(1000) 动画时长
 * @config delay(0) 动画延迟时间
 * @config loop(true)
 * @config gap(0) 循环的间隔时间
 * @config onframe
 * @config easing(optional)
 * @config ondestroy(optional)
 * @config onrestart(optional)
 */
define(
    function(require) {

        var Easing = require('./easing');

        function Clip(options) {

            this._targetPool = options.target || {};
            if (!(this._targetPool instanceof Array)) {
                this._targetPool = [ this._targetPool ];
            }

            // 生命周期
            this._life = options.life || 1000;
            // 延时
            this._delay = options.delay || 0;
            // 开始时间
            this._startTime = new Date().getTime() + this._delay;// 单位毫秒

            // 结束时间
            this._endTime = this._startTime + this._life * 1000;

            // 是否循环
            this.loop = typeof options.loop == 'undefined'
                        ? false : options.loop;

            this.gap = options.gap || 0;

            this.easing = options.easing || 'Linear';

            this.onframe = options.onframe;
            this.ondestroy = options.ondestroy;
            this.onrestart = options.onrestart;
        }

        Clip.prototype = {
            step : function (time) {
                var percent = (time - this._startTime) / this._life;

                // 还没开始
                if (percent < 0) {
                    return;
                }

                percent = Math.min(percent, 1);

                var easingFunc = typeof this.easing == 'string'
                                 ? Easing[this.easing]
                                 : this.easing;
                var schedule = typeof easingFunc === 'function'
                    ? easingFunc(percent)
                    : percent;

                this.fire('frame', schedule);

                // 结束
                if (percent == 1) {
                    if (this.loop) {
                        this.restart();
                        // 重新开始周期
                        // 抛出而不是直接调用事件直到 stage.update 后再统一调用这些事件
                        return 'restart';
                    }
                    
                    // 动画完成将这个控制器标识为待删除
                    // 在Animation.update中进行批量删除
                    this._needsRemove = true;
                    return 'destroy';
                }
                
                return null;
            },
            restart : function() {
                var time = new Date().getTime();
                var remainder = (time - this._startTime) % this._life;
                this._startTime = new Date().getTime() - remainder + this.gap;

                this._needsRemove = false;
            },
            fire : function(eventType, arg) {
                for (var i = 0, len = this._targetPool.length; i < len; i++) {
                    if (this['on' + eventType]) {
                        this['on' + eventType](this._targetPool[i], arg);
                    }
                }
            },
            constructor: Clip
        };

        return Clip;
    }
);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2FuaW1hdGlvbi9DbGlwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5Yqo55S75Li75o6n5Yi25ZmoXG4gKiBAY29uZmlnIHRhcmdldCDliqjnlLvlr7nosaHvvIzlj6/ku6XmmK/mlbDnu4TvvIzlpoLmnpzmmK/mlbDnu4TnmoTor53kvJrmibnph4/liIblj5FvbmZyYW1l562J5LqL5Lu2XG4gKiBAY29uZmlnIGxpZmUoMTAwMCkg5Yqo55S75pe26ZW/XG4gKiBAY29uZmlnIGRlbGF5KDApIOWKqOeUu+W7tui/n+aXtumXtFxuICogQGNvbmZpZyBsb29wKHRydWUpXG4gKiBAY29uZmlnIGdhcCgwKSDlvqrnjq/nmoTpl7TpmpTml7bpl7RcbiAqIEBjb25maWcgb25mcmFtZVxuICogQGNvbmZpZyBlYXNpbmcob3B0aW9uYWwpXG4gKiBAY29uZmlnIG9uZGVzdHJveShvcHRpb25hbClcbiAqIEBjb25maWcgb25yZXN0YXJ0KG9wdGlvbmFsKVxuICovXG5kZWZpbmUoXG4gICAgZnVuY3Rpb24ocmVxdWlyZSkge1xuXG4gICAgICAgIHZhciBFYXNpbmcgPSByZXF1aXJlKCcuL2Vhc2luZycpO1xuXG4gICAgICAgIGZ1bmN0aW9uIENsaXAob3B0aW9ucykge1xuXG4gICAgICAgICAgICB0aGlzLl90YXJnZXRQb29sID0gb3B0aW9ucy50YXJnZXQgfHwge307XG4gICAgICAgICAgICBpZiAoISh0aGlzLl90YXJnZXRQb29sIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGFyZ2V0UG9vbCA9IFsgdGhpcy5fdGFyZ2V0UG9vbCBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnlJ/lkb3lkajmnJ9cbiAgICAgICAgICAgIHRoaXMuX2xpZmUgPSBvcHRpb25zLmxpZmUgfHwgMTAwMDtcbiAgICAgICAgICAgIC8vIOW7tuaXtlxuICAgICAgICAgICAgdGhpcy5fZGVsYXkgPSBvcHRpb25zLmRlbGF5IHx8IDA7XG4gICAgICAgICAgICAvLyDlvIDlp4vml7bpl7RcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgdGhpcy5fZGVsYXk7Ly8g5Y2V5L2N5q+r56eSXG5cbiAgICAgICAgICAgIC8vIOe7k+adn+aXtumXtFxuICAgICAgICAgICAgdGhpcy5fZW5kVGltZSA9IHRoaXMuX3N0YXJ0VGltZSArIHRoaXMuX2xpZmUgKiAxMDAwO1xuXG4gICAgICAgICAgICAvLyDmmK/lkKblvqrnjq9cbiAgICAgICAgICAgIHRoaXMubG9vcCA9IHR5cGVvZiBvcHRpb25zLmxvb3AgPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZmFsc2UgOiBvcHRpb25zLmxvb3A7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FwID0gb3B0aW9ucy5nYXAgfHwgMDtcblxuICAgICAgICAgICAgdGhpcy5lYXNpbmcgPSBvcHRpb25zLmVhc2luZyB8fCAnTGluZWFyJztcblxuICAgICAgICAgICAgdGhpcy5vbmZyYW1lID0gb3B0aW9ucy5vbmZyYW1lO1xuICAgICAgICAgICAgdGhpcy5vbmRlc3Ryb3kgPSBvcHRpb25zLm9uZGVzdHJveTtcbiAgICAgICAgICAgIHRoaXMub25yZXN0YXJ0ID0gb3B0aW9ucy5vbnJlc3RhcnQ7XG4gICAgICAgIH1cblxuICAgICAgICBDbGlwLnByb3RvdHlwZSA9IHtcbiAgICAgICAgICAgIHN0ZXAgOiBmdW5jdGlvbiAodGltZSkge1xuICAgICAgICAgICAgICAgIHZhciBwZXJjZW50ID0gKHRpbWUgLSB0aGlzLl9zdGFydFRpbWUpIC8gdGhpcy5fbGlmZTtcblxuICAgICAgICAgICAgICAgIC8vIOi/mOayoeW8gOWni1xuICAgICAgICAgICAgICAgIGlmIChwZXJjZW50IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcGVyY2VudCA9IE1hdGgubWluKHBlcmNlbnQsIDEpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVhc2luZ0Z1bmMgPSB0eXBlb2YgdGhpcy5lYXNpbmcgPT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gRWFzaW5nW3RoaXMuZWFzaW5nXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmVhc2luZztcbiAgICAgICAgICAgICAgICB2YXIgc2NoZWR1bGUgPSB0eXBlb2YgZWFzaW5nRnVuYyA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICA/IGVhc2luZ0Z1bmMocGVyY2VudClcbiAgICAgICAgICAgICAgICAgICAgOiBwZXJjZW50O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdmcmFtZScsIHNjaGVkdWxlKTtcblxuICAgICAgICAgICAgICAgIC8vIOe7k+adn1xuICAgICAgICAgICAgICAgIGlmIChwZXJjZW50ID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubG9vcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDph43mlrDlvIDlp4vlkajmnJ9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaKm+WHuuiAjOS4jeaYr+ebtOaOpeiwg+eUqOS6i+S7tuebtOWIsCBzdGFnZS51cGRhdGUg5ZCO5YaN57uf5LiA6LCD55So6L+Z5Lqb5LqL5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3Jlc3RhcnQnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDliqjnlLvlrozmiJDlsIbov5nkuKrmjqfliLblmajmoIfor4bkuLrlvoXliKDpmaRcbiAgICAgICAgICAgICAgICAgICAgLy8g5ZyoQW5pbWF0aW9uLnVwZGF0ZeS4rei/m+ihjOaJuemHj+WIoOmZpFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9uZWVkc1JlbW92ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnZGVzdHJveSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3RhcnQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIHZhciByZW1haW5kZXIgPSAodGltZSAtIHRoaXMuX3N0YXJ0VGltZSkgJSB0aGlzLl9saWZlO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gcmVtYWluZGVyICsgdGhpcy5nYXA7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9uZWVkc1JlbW92ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpcmUgOiBmdW5jdGlvbihldmVudFR5cGUsIGFyZykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl90YXJnZXRQb29sLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzWydvbicgKyBldmVudFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzWydvbicgKyBldmVudFR5cGVdKHRoaXMuX3RhcmdldFBvb2xbaV0sIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uc3RydWN0b3I6IENsaXBcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gQ2xpcDtcbiAgICB9XG4pO1xuIl0sImZpbGUiOiJwbHVnaW5zL3pyZW5kZXItMi4xLjAvc3JjL2FuaW1hdGlvbi9DbGlwLmpzIn0=
