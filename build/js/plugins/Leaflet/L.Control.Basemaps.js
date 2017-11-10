(function (factory) {
    if(typeof define === 'function' && define.amd) {
        //AMD
        define(['leaflet'], factory);
    } else if(typeof module !== 'undefined') {
        // Node/CommonJS
        module.exports = factory(require('leaflet'));
    } else {
        // Browser globals
        if(typeof window.L === 'undefined')
            throw 'Leaflet must be loaded first';
        factory(window.L);
    }
})(function (L) {

    L.Control.Basemaps = L.Control.extend({
        _map: null,
        includes: L.Mixin.Events,
        options: {
            position: 'bottomright',
            tileX: 0,
            tileY: 0,
            tileZ: 0,
            layers: []  // list of basemap layer objects, first in list is default and added to map with this control
        },
        availableLayerGroup:[],
        currentLayerGroupIdx:0,
        onAdd: function (map) {
            this._map = map;
            var container = L.DomUtil.create('div', 'basemaps leaflet-control');
            var layerImgDom = L.DomUtil.create('img', 'animated rotateIn', container);
            var layerImgUrl = [];
            // disable events
            L.DomEvent.disableClickPropagation(container);
            if (!L.Browser.touch) {
                L.DomEvent.disableScrollPropagation(container);
            }
            this.options.tileLayers.forEach(function(group, groupIdx){
                var layers = [];
                //多个图层合并为layerGroup
                group.forEach(function(d, i){
                    layers.push(d);
                }, this);
                var layerGroup = L.layerGroup(layers);
                this.availableLayerGroup.push(layerGroup);

                //默认选中最末一个layerGroup做展示
                if (groupIdx == this.options.tileLayers.length -1) {
                    this._map.addLayer(layerGroup);
                    this.currentLayerGroupIdx = groupIdx;
                }
                var coords = {x: this.options.tileX, y: this.options.tileY};
                var url = L.Util.template(group[0]._url, L.extend({
                    s: group[0]._getSubdomain(coords),
                    x: coords.x,
                    y: group[0].options.tms ? group[0]._globalTileRange.max.y - coords.y : coords.y,
                    z: this.options.tileZ
                }, group[0].options));
                layerImgUrl.push(url);
            }, this);
            if(this.availableLayerGroup.length >= 2){
                layerImgDom.src = layerImgUrl[this.currentLayerGroupIdx];
                L.DomEvent.on(container, 'click', function(e) {
                    $(this).removeClass("rotateIn").addClass("rotateOut");
                    var self = this;
                    setTimeout(function(){
                        self._map.removeLayer(self.availableLayerGroup[self.currentLayerGroupIdx]);
                        self.currentLayerGroupIdx++;
                        if(self.currentLayerGroupIdx==layerImgUrl.length) self.currentLayerGroupIdx=0;
                        $(".basemaps img").remove();
                        $(".basemaps").append($("<img/>").attr("src",layerImgUrl[self.currentLayerGroupIdx]).addClass("animated rotateIn"))
                        self._map.addLayer(self.availableLayerGroup[self.currentLayerGroupIdx]);
                    },200);
                }, this);
            } else {
                L.DomUtil.remove(layerImgDom);
            }

            this._container = container;
            return this._container;
        }
    });

    L.control.basemaps = function (options) {
        return new L.Control.Basemaps(options);
    };

    return L.Control.Basemaps;
});










//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvTC5Db250cm9sLkJhc2VtYXBzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvL0FNRFxuICAgICAgICBkZWZpbmUoWydsZWFmbGV0J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBOb2RlL0NvbW1vbkpTXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsZWFmbGV0JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFsc1xuICAgICAgICBpZih0eXBlb2Ygd2luZG93LkwgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgdGhyb3cgJ0xlYWZsZXQgbXVzdCBiZSBsb2FkZWQgZmlyc3QnO1xuICAgICAgICBmYWN0b3J5KHdpbmRvdy5MKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTCkge1xuXG4gICAgTC5Db250cm9sLkJhc2VtYXBzID0gTC5Db250cm9sLmV4dGVuZCh7XG4gICAgICAgIF9tYXA6IG51bGwsXG4gICAgICAgIGluY2x1ZGVzOiBMLk1peGluLkV2ZW50cyxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcG9zaXRpb246ICdib3R0b21yaWdodCcsXG4gICAgICAgICAgICB0aWxlWDogMCxcbiAgICAgICAgICAgIHRpbGVZOiAwLFxuICAgICAgICAgICAgdGlsZVo6IDAsXG4gICAgICAgICAgICBsYXllcnM6IFtdICAvLyBsaXN0IG9mIGJhc2VtYXAgbGF5ZXIgb2JqZWN0cywgZmlyc3QgaW4gbGlzdCBpcyBkZWZhdWx0IGFuZCBhZGRlZCB0byBtYXAgd2l0aCB0aGlzIGNvbnRyb2xcbiAgICAgICAgfSxcbiAgICAgICAgYXZhaWxhYmxlTGF5ZXJHcm91cDpbXSxcbiAgICAgICAgY3VycmVudExheWVyR3JvdXBJZHg6MCxcbiAgICAgICAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgICAgIHRoaXMuX21hcCA9IG1hcDtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnYmFzZW1hcHMgbGVhZmxldC1jb250cm9sJyk7XG4gICAgICAgICAgICB2YXIgbGF5ZXJJbWdEb20gPSBMLkRvbVV0aWwuY3JlYXRlKCdpbWcnLCAnYW5pbWF0ZWQgcm90YXRlSW4nLCBjb250YWluZXIpO1xuICAgICAgICAgICAgdmFyIGxheWVySW1nVXJsID0gW107XG4gICAgICAgICAgICAvLyBkaXNhYmxlIGV2ZW50c1xuICAgICAgICAgICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbihjb250YWluZXIpO1xuICAgICAgICAgICAgaWYgKCFMLkJyb3dzZXIudG91Y2gpIHtcbiAgICAgICAgICAgICAgICBMLkRvbUV2ZW50LmRpc2FibGVTY3JvbGxQcm9wYWdhdGlvbihjb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRpbGVMYXllcnMuZm9yRWFjaChmdW5jdGlvbihncm91cCwgZ3JvdXBJZHgpe1xuICAgICAgICAgICAgICAgIHZhciBsYXllcnMgPSBbXTtcbiAgICAgICAgICAgICAgICAvL+WkmuS4quWbvuWxguWQiOW5tuS4umxheWVyR3JvdXBcbiAgICAgICAgICAgICAgICBncm91cC5mb3JFYWNoKGZ1bmN0aW9uKGQsIGkpe1xuICAgICAgICAgICAgICAgICAgICBsYXllcnMucHVzaChkKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgICAgICB2YXIgbGF5ZXJHcm91cCA9IEwubGF5ZXJHcm91cChsYXllcnMpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlTGF5ZXJHcm91cC5wdXNoKGxheWVyR3JvdXApO1xuXG4gICAgICAgICAgICAgICAgLy/pu5jorqTpgInkuK3mnIDmnKvkuIDkuKpsYXllckdyb3Vw5YGa5bGV56S6XG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwSWR4ID09IHRoaXMub3B0aW9ucy50aWxlTGF5ZXJzLmxlbmd0aCAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXAuYWRkTGF5ZXIobGF5ZXJHcm91cCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudExheWVyR3JvdXBJZHggPSBncm91cElkeDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkcyA9IHt4OiB0aGlzLm9wdGlvbnMudGlsZVgsIHk6IHRoaXMub3B0aW9ucy50aWxlWX07XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IEwuVXRpbC50ZW1wbGF0ZShncm91cFswXS5fdXJsLCBMLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIHM6IGdyb3VwWzBdLl9nZXRTdWJkb21haW4oY29vcmRzKSxcbiAgICAgICAgICAgICAgICAgICAgeDogY29vcmRzLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGdyb3VwWzBdLm9wdGlvbnMudG1zID8gZ3JvdXBbMF0uX2dsb2JhbFRpbGVSYW5nZS5tYXgueSAtIGNvb3Jkcy55IDogY29vcmRzLnksXG4gICAgICAgICAgICAgICAgICAgIHo6IHRoaXMub3B0aW9ucy50aWxlWlxuICAgICAgICAgICAgICAgIH0sIGdyb3VwWzBdLm9wdGlvbnMpKTtcbiAgICAgICAgICAgICAgICBsYXllckltZ1VybC5wdXNoKHVybCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIGlmKHRoaXMuYXZhaWxhYmxlTGF5ZXJHcm91cC5sZW5ndGggPj0gMil7XG4gICAgICAgICAgICAgICAgbGF5ZXJJbWdEb20uc3JjID0gbGF5ZXJJbWdVcmxbdGhpcy5jdXJyZW50TGF5ZXJHcm91cElkeF07XG4gICAgICAgICAgICAgICAgTC5Eb21FdmVudC5vbihjb250YWluZXIsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcInJvdGF0ZUluXCIpLmFkZENsYXNzKFwicm90YXRlT3V0XCIpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX21hcC5yZW1vdmVMYXllcihzZWxmLmF2YWlsYWJsZUxheWVyR3JvdXBbc2VsZi5jdXJyZW50TGF5ZXJHcm91cElkeF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50TGF5ZXJHcm91cElkeCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5jdXJyZW50TGF5ZXJHcm91cElkeD09bGF5ZXJJbWdVcmwubGVuZ3RoKSBzZWxmLmN1cnJlbnRMYXllckdyb3VwSWR4PTA7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiLmJhc2VtYXBzIGltZ1wiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIuYmFzZW1hcHNcIikuYXBwZW5kKCQoXCI8aW1nLz5cIikuYXR0cihcInNyY1wiLGxheWVySW1nVXJsW3NlbGYuY3VycmVudExheWVyR3JvdXBJZHhdKS5hZGRDbGFzcyhcImFuaW1hdGVkIHJvdGF0ZUluXCIpKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fbWFwLmFkZExheWVyKHNlbGYuYXZhaWxhYmxlTGF5ZXJHcm91cFtzZWxmLmN1cnJlbnRMYXllckdyb3VwSWR4XSk7XG4gICAgICAgICAgICAgICAgICAgIH0sMjAwKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZShsYXllckltZ0RvbSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIEwuY29udHJvbC5iYXNlbWFwcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgTC5Db250cm9sLkJhc2VtYXBzKG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gTC5Db250cm9sLkJhc2VtYXBzO1xufSk7XG5cblxuXG5cblxuXG5cblxuXG4iXSwiZmlsZSI6InBsdWdpbnMvTGVhZmxldC9MLkNvbnRyb2wuQmFzZW1hcHMuanMifQ==
