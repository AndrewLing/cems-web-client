'use strict';
(function (factory, window) {
  /*globals define, module, require*/

    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);


        // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if(typeof window !== 'undefined' && window.L){
        factory(window.L);
    }

}(function (L) {

    'use strict';

  /* A Draggable that does not update the element position
   and takes care of only bubbling to targetted path in Canvas mode. */
    L.PathDraggable = L.Draggable.extend({

        initialize: function (path) {
            this._path = path;
            this._canvas = (path._map.getRenderer(path) instanceof L.Canvas);
            var element = this._canvas ? this._path._map.getRenderer(this._path)._container : this._path._path;
            L.Draggable.prototype.initialize.call(this, element, element, true);
        },

        _updatePosition: function () {
            var e = {originalEvent: this._lastEvent};
            this.fire('drag', e);
        },

        _onDown: function (e) {
            var first = e.touches ? e.touches[0] : e;
            this._startPoint = new L.Point(first.clientX, first.clientY);
            if (this._canvas && !this._path._containsPoint(this._path._map.mouseEventToLayerPoint(first))) { return; }
            L.Draggable.prototype._onDown.call(this, e);
        }

    });


    L.Handler.PathDrag = L.Handler.extend({

        initialize: function (path) {
            this._path = path;
        },

        getEvents: function () {
            return {
                dragstart: this._onDragStart,
                drag: this._onDrag,
                dragend: this._onDragEnd
            };
        },

        addHooks: function () {
            if (!this._draggable) { this._draggable = new L.PathDraggable(this._path); }
            this._draggable.on(this.getEvents(), this).enable();
            L.DomUtil.addClass(this._draggable._element, 'leaflet-path-draggable');
        },

        removeHooks: function () {
            this._draggable.off(this.getEvents(), this).disable();
            L.DomUtil.removeClass(this._draggable._element, 'leaflet-path-draggable');
        },

        moved: function () {
            return this._draggable && this._draggable._moved;
        },

        _onDragStart: function () {
            this._startPoint = this._draggable._startPoint;
            this._path
                .closePopup()
                .fire('movestart')
                .fire('dragstart');
        },

        _onDrag: function (e) {
            var path = this._path,
                event = (e.originalEvent.touches && e.originalEvent.touches.length === 1 ? e.originalEvent.touches[0] : e.originalEvent),
                newPoint = L.point(event.clientX, event.clientY),
                latlng = path._map.layerPointToLatLng(newPoint);

            this._offset = newPoint.subtract(this._startPoint);
            this._startPoint = newPoint;

            this._path.eachLatLng(this.updateLatLng, this);
            path.redraw();

            e.latlng = latlng;
            e.offset = this._offset;
            path.fire('move', e)
                .fire('drag', e);
        },

        _onDragEnd: function (e) {
            if (this._path._bounds) this.resetBounds();
            this._path.fire('moveend')
                .fire('dragend', e);
        },

        latLngToLayerPoint: function (latlng) {
            // Same as map.latLngToLayerPoint, but without the round().
            var projectedPoint = this._path._map.project(L.latLng(latlng));
            return projectedPoint._subtract(this._path._map.getPixelOrigin());
        },

        updateLatLng: function (latlng) {
            var oldPoint = this.latLngToLayerPoint(latlng);
            oldPoint._add(this._offset);
            var newLatLng = this._path._map.layerPointToLatLng(oldPoint);
            latlng.lat = newLatLng.lat;
            latlng.lng = newLatLng.lng;
        },

        resetBounds: function () {
            this._path._bounds = new L.LatLngBounds();
            this._path.eachLatLng(function (latlng) {
                this._bounds.extend(latlng);
            });
        }

    });

    L.Path.include({

        eachLatLng: function (callback, context) {
            context = context || this;
            var loop = function (latlngs) {
                for (var i = 0; i < latlngs.length; i++) {
                    if (L.Util.isArray(latlngs[i])) loop(latlngs[i]);
                    else callback.call(context, latlngs[i]);
                }
            };
            loop(this.getLatLngs ? this.getLatLngs() : [this.getLatLng()]);
        }

    });

    L.Path.addInitHook(function () {

        this.dragging = new L.Handler.PathDrag(this);
        if (this.options.draggable) {
            this.once('add', function () {
                this.dragging.enable();
            });
        }

    });
}, window));





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvTGVhZmxldC5FZGl0YWJsZS5EcmFnLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbiAoZmFjdG9yeSwgd2luZG93KSB7XG4gIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSovXG5cbiAgICAvLyBkZWZpbmUgYW4gQU1EIG1vZHVsZSB0aGF0IHJlbGllcyBvbiAnbGVhZmxldCdcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbJ2xlYWZsZXQnXSwgZmFjdG9yeSk7XG5cblxuICAgICAgICAvLyBkZWZpbmUgYSBDb21tb24gSlMgbW9kdWxlIHRoYXQgcmVsaWVzIG9uICdsZWFmbGV0J1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsZWFmbGV0JykpO1xuICAgIH1cblxuICAgIC8vIGF0dGFjaCB5b3VyIHBsdWdpbiB0byB0aGUgZ2xvYmFsICdMJyB2YXJpYWJsZVxuICAgIGlmKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5MKXtcbiAgICAgICAgZmFjdG9yeSh3aW5kb3cuTCk7XG4gICAgfVxuXG59KGZ1bmN0aW9uIChMKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgLyogQSBEcmFnZ2FibGUgdGhhdCBkb2VzIG5vdCB1cGRhdGUgdGhlIGVsZW1lbnQgcG9zaXRpb25cbiAgIGFuZCB0YWtlcyBjYXJlIG9mIG9ubHkgYnViYmxpbmcgdG8gdGFyZ2V0dGVkIHBhdGggaW4gQ2FudmFzIG1vZGUuICovXG4gICAgTC5QYXRoRHJhZ2dhYmxlID0gTC5EcmFnZ2FibGUuZXh0ZW5kKHtcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICAgICAgdGhpcy5fcGF0aCA9IHBhdGg7XG4gICAgICAgICAgICB0aGlzLl9jYW52YXMgPSAocGF0aC5fbWFwLmdldFJlbmRlcmVyKHBhdGgpIGluc3RhbmNlb2YgTC5DYW52YXMpO1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLl9jYW52YXMgPyB0aGlzLl9wYXRoLl9tYXAuZ2V0UmVuZGVyZXIodGhpcy5fcGF0aCkuX2NvbnRhaW5lciA6IHRoaXMuX3BhdGguX3BhdGg7XG4gICAgICAgICAgICBMLkRyYWdnYWJsZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIGVsZW1lbnQsIGVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF91cGRhdGVQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGUgPSB7b3JpZ2luYWxFdmVudDogdGhpcy5fbGFzdEV2ZW50fTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZHJhZycsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9vbkRvd246IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgZmlyc3QgPSBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbMF0gOiBlO1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRQb2ludCA9IG5ldyBMLlBvaW50KGZpcnN0LmNsaWVudFgsIGZpcnN0LmNsaWVudFkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NhbnZhcyAmJiAhdGhpcy5fcGF0aC5fY29udGFpbnNQb2ludCh0aGlzLl9wYXRoLl9tYXAubW91c2VFdmVudFRvTGF5ZXJQb2ludChmaXJzdCkpKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgTC5EcmFnZ2FibGUucHJvdG90eXBlLl9vbkRvd24uY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cblxuICAgIEwuSGFuZGxlci5QYXRoRHJhZyA9IEwuSGFuZGxlci5leHRlbmQoe1xuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICB0aGlzLl9wYXRoID0gcGF0aDtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZHJhZ3N0YXJ0OiB0aGlzLl9vbkRyYWdTdGFydCxcbiAgICAgICAgICAgICAgICBkcmFnOiB0aGlzLl9vbkRyYWcsXG4gICAgICAgICAgICAgICAgZHJhZ2VuZDogdGhpcy5fb25EcmFnRW5kXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZEhvb2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2RyYWdnYWJsZSkgeyB0aGlzLl9kcmFnZ2FibGUgPSBuZXcgTC5QYXRoRHJhZ2dhYmxlKHRoaXMuX3BhdGgpOyB9XG4gICAgICAgICAgICB0aGlzLl9kcmFnZ2FibGUub24odGhpcy5nZXRFdmVudHMoKSwgdGhpcykuZW5hYmxlKCk7XG4gICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fZHJhZ2dhYmxlLl9lbGVtZW50LCAnbGVhZmxldC1wYXRoLWRyYWdnYWJsZScpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZUhvb2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9kcmFnZ2FibGUub2ZmKHRoaXMuZ2V0RXZlbnRzKCksIHRoaXMpLmRpc2FibGUoKTtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9kcmFnZ2FibGUuX2VsZW1lbnQsICdsZWFmbGV0LXBhdGgtZHJhZ2dhYmxlJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW92ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kcmFnZ2FibGUgJiYgdGhpcy5fZHJhZ2dhYmxlLl9tb3ZlZDtcbiAgICAgICAgfSxcblxuICAgICAgICBfb25EcmFnU3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0UG9pbnQgPSB0aGlzLl9kcmFnZ2FibGUuX3N0YXJ0UG9pbnQ7XG4gICAgICAgICAgICB0aGlzLl9wYXRoXG4gICAgICAgICAgICAgICAgLmNsb3NlUG9wdXAoKVxuICAgICAgICAgICAgICAgIC5maXJlKCdtb3Zlc3RhcnQnKVxuICAgICAgICAgICAgICAgIC5maXJlKCdkcmFnc3RhcnQnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfb25EcmFnOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSB0aGlzLl9wYXRoLFxuICAgICAgICAgICAgICAgIGV2ZW50ID0gKGUub3JpZ2luYWxFdmVudC50b3VjaGVzICYmIGUub3JpZ2luYWxFdmVudC50b3VjaGVzLmxlbmd0aCA9PT0gMSA/IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdIDogZS5vcmlnaW5hbEV2ZW50KSxcbiAgICAgICAgICAgICAgICBuZXdQb2ludCA9IEwucG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSksXG4gICAgICAgICAgICAgICAgbGF0bG5nID0gcGF0aC5fbWFwLmxheWVyUG9pbnRUb0xhdExuZyhuZXdQb2ludCk7XG5cbiAgICAgICAgICAgIHRoaXMuX29mZnNldCA9IG5ld1BvaW50LnN1YnRyYWN0KHRoaXMuX3N0YXJ0UG9pbnQpO1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRQb2ludCA9IG5ld1BvaW50O1xuXG4gICAgICAgICAgICB0aGlzLl9wYXRoLmVhY2hMYXRMbmcodGhpcy51cGRhdGVMYXRMbmcsIHRoaXMpO1xuICAgICAgICAgICAgcGF0aC5yZWRyYXcoKTtcblxuICAgICAgICAgICAgZS5sYXRsbmcgPSBsYXRsbmc7XG4gICAgICAgICAgICBlLm9mZnNldCA9IHRoaXMuX29mZnNldDtcbiAgICAgICAgICAgIHBhdGguZmlyZSgnbW92ZScsIGUpXG4gICAgICAgICAgICAgICAgLmZpcmUoJ2RyYWcnLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfb25EcmFnRW5kOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BhdGguX2JvdW5kcykgdGhpcy5yZXNldEJvdW5kcygpO1xuICAgICAgICAgICAgdGhpcy5fcGF0aC5maXJlKCdtb3ZlZW5kJylcbiAgICAgICAgICAgICAgICAuZmlyZSgnZHJhZ2VuZCcsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxhdExuZ1RvTGF5ZXJQb2ludDogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgLy8gU2FtZSBhcyBtYXAubGF0TG5nVG9MYXllclBvaW50LCBidXQgd2l0aG91dCB0aGUgcm91bmQoKS5cbiAgICAgICAgICAgIHZhciBwcm9qZWN0ZWRQb2ludCA9IHRoaXMuX3BhdGguX21hcC5wcm9qZWN0KEwubGF0TG5nKGxhdGxuZykpO1xuICAgICAgICAgICAgcmV0dXJuIHByb2plY3RlZFBvaW50Ll9zdWJ0cmFjdCh0aGlzLl9wYXRoLl9tYXAuZ2V0UGl4ZWxPcmlnaW4oKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlTGF0TG5nOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgICAgICB2YXIgb2xkUG9pbnQgPSB0aGlzLmxhdExuZ1RvTGF5ZXJQb2ludChsYXRsbmcpO1xuICAgICAgICAgICAgb2xkUG9pbnQuX2FkZCh0aGlzLl9vZmZzZXQpO1xuICAgICAgICAgICAgdmFyIG5ld0xhdExuZyA9IHRoaXMuX3BhdGguX21hcC5sYXllclBvaW50VG9MYXRMbmcob2xkUG9pbnQpO1xuICAgICAgICAgICAgbGF0bG5nLmxhdCA9IG5ld0xhdExuZy5sYXQ7XG4gICAgICAgICAgICBsYXRsbmcubG5nID0gbmV3TGF0TG5nLmxuZztcbiAgICAgICAgfSxcblxuICAgICAgICByZXNldEJvdW5kczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fcGF0aC5fYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKCk7XG4gICAgICAgICAgICB0aGlzLl9wYXRoLmVhY2hMYXRMbmcoZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JvdW5kcy5leHRlbmQobGF0bG5nKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIEwuUGF0aC5pbmNsdWRlKHtcblxuICAgICAgICBlYWNoTGF0TG5nOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XG4gICAgICAgICAgICB2YXIgbG9vcCA9IGZ1bmN0aW9uIChsYXRsbmdzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXRsbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChMLlV0aWwuaXNBcnJheShsYXRsbmdzW2ldKSkgbG9vcChsYXRsbmdzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGxhdGxuZ3NbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsb29wKHRoaXMuZ2V0TGF0TG5ncyA/IHRoaXMuZ2V0TGF0TG5ncygpIDogW3RoaXMuZ2V0TGF0TG5nKCldKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBMLlBhdGguYWRkSW5pdEhvb2soZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHRoaXMuZHJhZ2dpbmcgPSBuZXcgTC5IYW5kbGVyLlBhdGhEcmFnKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdnYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5vbmNlKCdhZGQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnZ2luZy5lbmFibGUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9KTtcbn0sIHdpbmRvdykpO1xuXG5cblxuXG4iXSwiZmlsZSI6InBsdWdpbnMvTGVhZmxldC9MZWFmbGV0LkVkaXRhYmxlLkRyYWcuanMifQ==
