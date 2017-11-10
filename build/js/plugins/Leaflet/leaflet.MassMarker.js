'use strict';
(function (factory, window) {
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }
    if (typeof window !== 'undefined' && window.L) {
        factory(window.L);
    }
}(function (L) {

    L.MassMarkers = L.Layer.extend({
        options: {
            opacity: 0.8,
            zIndex: 111,
            cursor: 'pointer',
            style: []
        },

        initialize: function (data, options) {
            L.setOptions(this, options);

            this._markers = [];
            this.onMap = false;
        },

        onAdd: function(map) {
            var pane = map.getPane(this.options.pane);
            this._container = L.DomUtil.create('canvas', 'leaflet-zoom-animated');

            pane.appendChild(this._container);
            debugger

            // Calculate initial position of container with `L.Map.latLngToLayerPoint()`, `getPixelOrigin()` and/or `getPixelBounds()`
            //var point = map.latLngToLayerPoint();
            //var point = map.getPixelOrigin();
            var point = map.getPixelBounds();

            L.DomUtil.setPosition(this._container, point);

            // Add and position children elements if needed

            map.on('zoomend viewreset', this._update, this);
        },

        onRemove: function(map) {
            L.DomUtil.remove(this._container);
            map.off('zoomend viewreset', this._update, this);
        },

        _update: function() {
            // Recalculate position of container

            L.DomUtil.setPosition(this._container, point);

            // Add/remove/reposition children elements if needed
        }
    });

    L.massMarkers = function (markers, options) {
        var layer = new L.MassMarkers(null, options), i;
        for (i in markers) {
            layer._markers[i] = markers[i];
        }
        return layer;
    };
}, window));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5NYXNzTWFya2VyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbiAoZmFjdG9yeSwgd2luZG93KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoWydsZWFmbGV0J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsZWFmbGV0JykpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LkwpIHtcbiAgICAgICAgZmFjdG9yeSh3aW5kb3cuTCk7XG4gICAgfVxufShmdW5jdGlvbiAoTCkge1xuXG4gICAgTC5NYXNzTWFya2VycyA9IEwuTGF5ZXIuZXh0ZW5kKHtcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC44LFxuICAgICAgICAgICAgekluZGV4OiAxMTEsXG4gICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgIHN0eWxlOiBbXVxuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHRoaXMuX21hcmtlcnMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMub25NYXAgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICB2YXIgcGFuZSA9IG1hcC5nZXRQYW5lKHRoaXMub3B0aW9ucy5wYW5lKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2NhbnZhcycsICdsZWFmbGV0LXpvb20tYW5pbWF0ZWQnKTtcblxuICAgICAgICAgICAgcGFuZS5hcHBlbmRDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgICAgICAgICAgZGVidWdnZXJcblxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGluaXRpYWwgcG9zaXRpb24gb2YgY29udGFpbmVyIHdpdGggYEwuTWFwLmxhdExuZ1RvTGF5ZXJQb2ludCgpYCwgYGdldFBpeGVsT3JpZ2luKClgIGFuZC9vciBgZ2V0UGl4ZWxCb3VuZHMoKWBcbiAgICAgICAgICAgIC8vdmFyIHBvaW50ID0gbWFwLmxhdExuZ1RvTGF5ZXJQb2ludCgpO1xuICAgICAgICAgICAgLy92YXIgcG9pbnQgPSBtYXAuZ2V0UGl4ZWxPcmlnaW4oKTtcbiAgICAgICAgICAgIHZhciBwb2ludCA9IG1hcC5nZXRQaXhlbEJvdW5kcygpO1xuXG4gICAgICAgICAgICBMLkRvbVV0aWwuc2V0UG9zaXRpb24odGhpcy5fY29udGFpbmVyLCBwb2ludCk7XG5cbiAgICAgICAgICAgIC8vIEFkZCBhbmQgcG9zaXRpb24gY2hpbGRyZW4gZWxlbWVudHMgaWYgbmVlZGVkXG5cbiAgICAgICAgICAgIG1hcC5vbignem9vbWVuZCB2aWV3cmVzZXQnLCB0aGlzLl91cGRhdGUsIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uUmVtb3ZlOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5yZW1vdmUodGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgICAgIG1hcC5vZmYoJ3pvb21lbmQgdmlld3Jlc2V0JywgdGhpcy5fdXBkYXRlLCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFJlY2FsY3VsYXRlIHBvc2l0aW9uIG9mIGNvbnRhaW5lclxuXG4gICAgICAgICAgICBMLkRvbVV0aWwuc2V0UG9zaXRpb24odGhpcy5fY29udGFpbmVyLCBwb2ludCk7XG5cbiAgICAgICAgICAgIC8vIEFkZC9yZW1vdmUvcmVwb3NpdGlvbiBjaGlsZHJlbiBlbGVtZW50cyBpZiBuZWVkZWRcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgTC5tYXNzTWFya2VycyA9IGZ1bmN0aW9uIChtYXJrZXJzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBsYXllciA9IG5ldyBMLk1hc3NNYXJrZXJzKG51bGwsIG9wdGlvbnMpLCBpO1xuICAgICAgICBmb3IgKGkgaW4gbWFya2Vycykge1xuICAgICAgICAgICAgbGF5ZXIuX21hcmtlcnNbaV0gPSBtYXJrZXJzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsYXllcjtcbiAgICB9O1xufSwgd2luZG93KSk7XG4iXSwiZmlsZSI6InBsdWdpbnMvTGVhZmxldC9sZWFmbGV0Lk1hc3NNYXJrZXIuanMifQ==
