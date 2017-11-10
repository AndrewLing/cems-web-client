(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['leaflet'], factory);
    } else if (typeof modules === 'object' && module.exports) {
        // define a Common JS module that relies on 'leaflet'
        module.exports = factory(require('leaflet'));
    } else {
        // Assume Leaflet is loaded into global object L already
        factory(L);
    }
}(this, function (L) {
    'use strict';
    var previousMethods = {
        getCenter: L.Map.prototype.getCenter,
        setView: L.Map.prototype.setView,
        setZoomAround: L.Map.prototype.setZoomAround,
        getBoundsZoom: L.Map.prototype.getBoundsZoom,
        PopupAdjustPan: L.Popup.prototype._adjustPan,
        RendererUpdate: L.Renderer.prototype._update
    };
    L.Map.include({
        getBounds: function() {
            if (this._viewport) {
                return this.getViewportLatLngBounds()
            } else {
                var bounds = this.getPixelBounds(),
                    sw = this.unproject(bounds.getBottomLeft()),
                    ne = this.unproject(bounds.getTopRight());

                return new L.LatLngBounds(sw, ne);
            }
        },

        getViewport: function() {
            return this._viewport;
        },

        getViewportBounds: function() {
            var vp = this._viewport,
                topleft = L.point(vp.offsetLeft, vp.offsetTop),
                vpsize = L.point(vp.clientWidth, vp.clientHeight);

            if (vpsize.x === 0 || vpsize.y === 0) {
                //Our own viewport has no good size - so we fallback to the container size:
                vp = this.getContainer();
                if(vp){
                    topleft = L.point(0, 0);
                    vpsize = L.point(vp.clientWidth, vp.clientHeight);
                }

            }
            return L.bounds(topleft, topleft.add(vpsize));
        },

        getViewportLatLngBounds: function() {
            var bounds = this.getViewportBounds();
            return L.latLngBounds(this.containerPointToLatLng(bounds.min), this.containerPointToLatLng(bounds.max));
        },

        getOffset: function() {
            var mCenter = this.getSize().divideBy(2),
                vCenter = this.getViewportBounds().getCenter();

            return mCenter.subtract(vCenter);
        },

        getCenter: function (withoutViewport) {
            var center = previousMethods.getCenter.call(this);

            if (this.getViewport() && !withoutViewport) {
                var zoom = this.getZoom(),
                    point = this.project(center, zoom);
                point = point.subtract(this.getOffset());

                center = this.unproject(point, zoom);
            }

            return center;
        },

        setView: function (center, zoom, options) {
            center = L.latLng(center);
            zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);

            if (this.getViewport()) {
                var point = this.project(center, this._limitZoom(zoom));
                point = point.add(this.getOffset());
                center = this.unproject(point, this._limitZoom(zoom));
            }

            return previousMethods.setView.call(this, center, zoom, options);
        },

        setZoomAround: function (latlng, zoom, options) {
            var vp = this.getViewport();

            if (vp) {
                var scale = this.getZoomScale(zoom),
                    viewHalf = this.getViewportBounds().getCenter(),
                    containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),

                    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
                    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

                return this.setView(newCenter, zoom, {zoom: options});
            } else {
                return previousMethods.setZoomAround.call(this, latlng, zoom, options);
            }
        },

        getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
            bounds = L.latLngBounds(bounds);
            padding = L.point(padding || [0, 0]);

            var zoom = this.getZoom() || 0,
                min = this.getMinZoom(),
                max = this.getMaxZoom(),
                nw = bounds.getNorthWest(),
                se = bounds.getSouthEast(),
                vp = this.getViewport(),
                size = (vp ? L.point(vp.clientWidth, vp.clientHeight) : this.getSize()).subtract(padding),
                boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)),
                snap = L.Browser.any3d ? this.options.zoomSnap : 1;

            var scale = Math.min(size.x / boundsSize.x, size.y / boundsSize.y);

            zoom = this.getScaleZoom(scale, zoom);

            if (snap) {
                zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level
                zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
            }

            return Math.max(min, Math.min(max, zoom));
        }
    });

    L.Map.include({
        setActiveArea: function (css) {
            if( !this._viewport ){
                //Make viewport if not already made
                var container = this.getContainer();
                this._viewport = L.DomUtil.create('div', '');
                container.insertBefore(this._viewport, container.firstChild);
            }

            if (typeof css === 'string') {
                this._viewport.className = css;
            } else {
                L.extend(this._viewport.style, css);
            }
            return this;
        }
    });

    L.Renderer.include({
        _onZoom: function () {
            this._updateTransform(this._map.getCenter(true), this._map.getZoom());
        },

        _update: function () {
            previousMethods.RendererUpdate.call(this);
            this._center = this._map.getCenter(true);
        }
    });

    L.GridLayer.include({
        _updateLevels: function () {

            var zoom = this._tileZoom,
                maxZoom = this.options.maxZoom;

            if (zoom === undefined) { return undefined; }

            for (var z in this._levels) {
                if (this._levels[z].el.children.length || z === zoom) {
                    this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
                } else {
                    L.DomUtil.remove(this._levels[z].el);
                    this._removeTilesAtZoom(z);
                    delete this._levels[z];
                }
            }

            var level = this._levels[zoom],
                map = this._map;

            if (!level) {
                level = this._levels[zoom] = {};

                level.el = L.DomUtil.create('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
                level.el.style.zIndex = maxZoom;

                level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
                level.zoom = zoom;

                this._setZoomTransform(level, map.getCenter(true), map.getZoom());

                // force the browser to consider the newly added element for transition
                L.Util.falseFn(level.el.offsetWidth);
            }

            this._level = level;

            return level;
        },

        _resetView: function (e) {
            var animating = e && (e.pinch || e.flyTo);
            this._setView(this._map.getCenter(true), this._map.getZoom(), animating, animating);
        },

        _update: function (center) {
            var map = this._map;
            if (!map) { return; }
            var zoom = map.getZoom();

            if (center === undefined) { center = map.getCenter(this); }
            if (this._tileZoom === undefined) { return; }    // if out of minzoom/maxzoom

            var pixelBounds = this._getTiledPixelBounds(center),
                tileRange = this._pxBoundsToTileRange(pixelBounds),
                tileCenter = tileRange.getCenter(),
                queue = [];

            for (var key in this._tiles) {
                this._tiles[key].current = false;
            }

            // _update just loads more tiles. If the tile zoom level differs too much
            // from the map's, let _setView reset levels and prune old tiles.
            if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

            // create a queue of coordinates to load tiles from
            for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
                for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
                    var coords = new L.Point(i, j);
                    coords.z = this._tileZoom;

                    if (!this._isValidTile(coords)) { continue; }

                    var tile = this._tiles[this._tileCoordsToKey(coords)];
                    if (tile) {
                        tile.current = true;
                    } else {
                        queue.push(coords);
                    }
                }
            }

            // sort tile queue to load tiles in order of their distance to center
            queue.sort(function (a, b) {
                return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
            });

            if (queue.length !== 0) {
                // if its the first batch of tiles to load
                if (!this._loading) {
                    this._loading = true;
                    // @event loading: Event
                    // Fired when the grid layer starts loading tiles
                    this.fire('loading');
                }

                // create DOM fragment to append tiles in one batch
                var fragment = document.createDocumentFragment();

                for (i = 0; i < queue.length; i++) {
                    this._addTile(queue[i], fragment);
                }

                this._level.el.appendChild(fragment);
            }
        }
    });

    L.Popup.include({

        _adjustPan: function () {
            if (!this._map._viewport) {
                var _this = this;
                setTimeout(function () {
                    try {
                        previousMethods.PopupAdjustPan.call(_this);
                    } catch (e) {}
                }, 250);
            } else {
                if (!this.options.autoPan || (this._map._panAnim && this._map._panAnim._inProgress)) { return; }

                var map = this._map,
                    vp = map._viewport,
                    containerHeight = this._container.offsetHeight,
                    containerWidth = this._containerWidth,
                    vpTopleft = L.point(vp.offsetLeft, vp.offsetTop),

                    layerPos = new L.Point(
                        this._containerLeft - vpTopleft.x,
                        - containerHeight - this._containerBottom - vpTopleft.y);

                if (this._zoomAnimated) {
                    layerPos._add(L.DomUtil.getPosition(this._container));
                }

                var containerPos = map.layerPointToContainerPoint(layerPos),
                    padding = L.point(this.options.autoPanPadding),
                    paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
                    paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
                    size = L.point(vp.clientWidth, vp.clientHeight),
                    dx = 0,
                    dy = 0;

                if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
                    dx = containerPos.x + containerWidth - size.x + paddingBR.x;
                }
                if (containerPos.x - dx - paddingTL.x < 0) { // left
                    dx = containerPos.x - paddingTL.x;
                }
                if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
                    dy = containerPos.y + containerHeight - size.y + paddingBR.y;
                }
                if (containerPos.y - dy - paddingTL.y < 0) { // top
                    dy = containerPos.y - paddingTL.y;
                }

                // @namespace Map
                // @section Popup events
                // @event autopanstart
                // Fired when the map starts autopanning when opening a popup.
                if (dx || dy) {
                    setTimeout(function () {
                        //map.stop();
                        map
                            .fire('autopanstart')
                            .panBy([dx, dy]);
                    }, 250);
                }
            }
        }
    });

    return L;
}));
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5hY3RpdmVhcmVhLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoWydsZWFmbGV0J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZXMgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIC8vIGRlZmluZSBhIENvbW1vbiBKUyBtb2R1bGUgdGhhdCByZWxpZXMgb24gJ2xlYWZsZXQnXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsZWFmbGV0JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEFzc3VtZSBMZWFmbGV0IGlzIGxvYWRlZCBpbnRvIGdsb2JhbCBvYmplY3QgTCBhbHJlYWR5XG4gICAgICAgIGZhY3RvcnkoTCk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoTCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgcHJldmlvdXNNZXRob2RzID0ge1xuICAgICAgICBnZXRDZW50ZXI6IEwuTWFwLnByb3RvdHlwZS5nZXRDZW50ZXIsXG4gICAgICAgIHNldFZpZXc6IEwuTWFwLnByb3RvdHlwZS5zZXRWaWV3LFxuICAgICAgICBzZXRab29tQXJvdW5kOiBMLk1hcC5wcm90b3R5cGUuc2V0Wm9vbUFyb3VuZCxcbiAgICAgICAgZ2V0Qm91bmRzWm9vbTogTC5NYXAucHJvdG90eXBlLmdldEJvdW5kc1pvb20sXG4gICAgICAgIFBvcHVwQWRqdXN0UGFuOiBMLlBvcHVwLnByb3RvdHlwZS5fYWRqdXN0UGFuLFxuICAgICAgICBSZW5kZXJlclVwZGF0ZTogTC5SZW5kZXJlci5wcm90b3R5cGUuX3VwZGF0ZVxuICAgIH07XG4gICAgTC5NYXAuaW5jbHVkZSh7XG4gICAgICAgIGdldEJvdW5kczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdmlld3BvcnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRWaWV3cG9ydExhdExuZ0JvdW5kcygpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBib3VuZHMgPSB0aGlzLmdldFBpeGVsQm91bmRzKCksXG4gICAgICAgICAgICAgICAgICAgIHN3ID0gdGhpcy51bnByb2plY3QoYm91bmRzLmdldEJvdHRvbUxlZnQoKSksXG4gICAgICAgICAgICAgICAgICAgIG5lID0gdGhpcy51bnByb2plY3QoYm91bmRzLmdldFRvcFJpZ2h0KCkpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBMLkxhdExuZ0JvdW5kcyhzdywgbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGdldFZpZXdwb3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92aWV3cG9ydDtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRWaWV3cG9ydEJvdW5kczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdnAgPSB0aGlzLl92aWV3cG9ydCxcbiAgICAgICAgICAgICAgICB0b3BsZWZ0ID0gTC5wb2ludCh2cC5vZmZzZXRMZWZ0LCB2cC5vZmZzZXRUb3ApLFxuICAgICAgICAgICAgICAgIHZwc2l6ZSA9IEwucG9pbnQodnAuY2xpZW50V2lkdGgsIHZwLmNsaWVudEhlaWdodCk7XG5cbiAgICAgICAgICAgIGlmICh2cHNpemUueCA9PT0gMCB8fCB2cHNpemUueSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vT3VyIG93biB2aWV3cG9ydCBoYXMgbm8gZ29vZCBzaXplIC0gc28gd2UgZmFsbGJhY2sgdG8gdGhlIGNvbnRhaW5lciBzaXplOlxuICAgICAgICAgICAgICAgIHZwID0gdGhpcy5nZXRDb250YWluZXIoKTtcbiAgICAgICAgICAgICAgICBpZih2cCl7XG4gICAgICAgICAgICAgICAgICAgIHRvcGxlZnQgPSBMLnBvaW50KDAsIDApO1xuICAgICAgICAgICAgICAgICAgICB2cHNpemUgPSBMLnBvaW50KHZwLmNsaWVudFdpZHRoLCB2cC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEwuYm91bmRzKHRvcGxlZnQsIHRvcGxlZnQuYWRkKHZwc2l6ZSkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFZpZXdwb3J0TGF0TG5nQm91bmRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBib3VuZHMgPSB0aGlzLmdldFZpZXdwb3J0Qm91bmRzKCk7XG4gICAgICAgICAgICByZXR1cm4gTC5sYXRMbmdCb3VuZHModGhpcy5jb250YWluZXJQb2ludFRvTGF0TG5nKGJvdW5kcy5taW4pLCB0aGlzLmNvbnRhaW5lclBvaW50VG9MYXRMbmcoYm91bmRzLm1heCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldE9mZnNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbUNlbnRlciA9IHRoaXMuZ2V0U2l6ZSgpLmRpdmlkZUJ5KDIpLFxuICAgICAgICAgICAgICAgIHZDZW50ZXIgPSB0aGlzLmdldFZpZXdwb3J0Qm91bmRzKCkuZ2V0Q2VudGVyKCk7XG5cbiAgICAgICAgICAgIHJldHVybiBtQ2VudGVyLnN1YnRyYWN0KHZDZW50ZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldENlbnRlcjogZnVuY3Rpb24gKHdpdGhvdXRWaWV3cG9ydCkge1xuICAgICAgICAgICAgdmFyIGNlbnRlciA9IHByZXZpb3VzTWV0aG9kcy5nZXRDZW50ZXIuY2FsbCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Vmlld3BvcnQoKSAmJiAhd2l0aG91dFZpZXdwb3J0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHpvb20gPSB0aGlzLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSB0aGlzLnByb2plY3QoY2VudGVyLCB6b29tKTtcbiAgICAgICAgICAgICAgICBwb2ludCA9IHBvaW50LnN1YnRyYWN0KHRoaXMuZ2V0T2Zmc2V0KCkpO1xuXG4gICAgICAgICAgICAgICAgY2VudGVyID0gdGhpcy51bnByb2plY3QocG9pbnQsIHpvb20pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2VudGVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldFZpZXc6IGZ1bmN0aW9uIChjZW50ZXIsIHpvb20sIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGNlbnRlciA9IEwubGF0TG5nKGNlbnRlcik7XG4gICAgICAgICAgICB6b29tID0gem9vbSA9PT0gdW5kZWZpbmVkID8gdGhpcy5fem9vbSA6IHRoaXMuX2xpbWl0Wm9vbSh6b29tKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Vmlld3BvcnQoKSkge1xuICAgICAgICAgICAgICAgIHZhciBwb2ludCA9IHRoaXMucHJvamVjdChjZW50ZXIsIHRoaXMuX2xpbWl0Wm9vbSh6b29tKSk7XG4gICAgICAgICAgICAgICAgcG9pbnQgPSBwb2ludC5hZGQodGhpcy5nZXRPZmZzZXQoKSk7XG4gICAgICAgICAgICAgICAgY2VudGVyID0gdGhpcy51bnByb2plY3QocG9pbnQsIHRoaXMuX2xpbWl0Wm9vbSh6b29tKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91c01ldGhvZHMuc2V0Vmlldy5jYWxsKHRoaXMsIGNlbnRlciwgem9vbSwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0Wm9vbUFyb3VuZDogZnVuY3Rpb24gKGxhdGxuZywgem9vbSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHZwID0gdGhpcy5nZXRWaWV3cG9ydCgpO1xuXG4gICAgICAgICAgICBpZiAodnApIHtcbiAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFpvb21TY2FsZSh6b29tKSxcbiAgICAgICAgICAgICAgICAgICAgdmlld0hhbGYgPSB0aGlzLmdldFZpZXdwb3J0Qm91bmRzKCkuZ2V0Q2VudGVyKCksXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lclBvaW50ID0gbGF0bG5nIGluc3RhbmNlb2YgTC5Qb2ludCA/IGxhdGxuZyA6IHRoaXMubGF0TG5nVG9Db250YWluZXJQb2ludChsYXRsbmcpLFxuXG4gICAgICAgICAgICAgICAgICAgIGNlbnRlck9mZnNldCA9IGNvbnRhaW5lclBvaW50LnN1YnRyYWN0KHZpZXdIYWxmKS5tdWx0aXBseUJ5KDEgLSAxIC8gc2NhbGUpLFxuICAgICAgICAgICAgICAgICAgICBuZXdDZW50ZXIgPSB0aGlzLmNvbnRhaW5lclBvaW50VG9MYXRMbmcodmlld0hhbGYuYWRkKGNlbnRlck9mZnNldCkpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0VmlldyhuZXdDZW50ZXIsIHpvb20sIHt6b29tOiBvcHRpb25zfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91c01ldGhvZHMuc2V0Wm9vbUFyb3VuZC5jYWxsKHRoaXMsIGxhdGxuZywgem9vbSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Qm91bmRzWm9vbTogZnVuY3Rpb24gKGJvdW5kcywgaW5zaWRlLCBwYWRkaW5nKSB7IC8vIChMYXRMbmdCb3VuZHNbLCBCb29sZWFuLCBQb2ludF0pIC0+IE51bWJlclxuICAgICAgICAgICAgYm91bmRzID0gTC5sYXRMbmdCb3VuZHMoYm91bmRzKTtcbiAgICAgICAgICAgIHBhZGRpbmcgPSBMLnBvaW50KHBhZGRpbmcgfHwgWzAsIDBdKTtcblxuICAgICAgICAgICAgdmFyIHpvb20gPSB0aGlzLmdldFpvb20oKSB8fCAwLFxuICAgICAgICAgICAgICAgIG1pbiA9IHRoaXMuZ2V0TWluWm9vbSgpLFxuICAgICAgICAgICAgICAgIG1heCA9IHRoaXMuZ2V0TWF4Wm9vbSgpLFxuICAgICAgICAgICAgICAgIG53ID0gYm91bmRzLmdldE5vcnRoV2VzdCgpLFxuICAgICAgICAgICAgICAgIHNlID0gYm91bmRzLmdldFNvdXRoRWFzdCgpLFxuICAgICAgICAgICAgICAgIHZwID0gdGhpcy5nZXRWaWV3cG9ydCgpLFxuICAgICAgICAgICAgICAgIHNpemUgPSAodnAgPyBMLnBvaW50KHZwLmNsaWVudFdpZHRoLCB2cC5jbGllbnRIZWlnaHQpIDogdGhpcy5nZXRTaXplKCkpLnN1YnRyYWN0KHBhZGRpbmcpLFxuICAgICAgICAgICAgICAgIGJvdW5kc1NpemUgPSB0aGlzLnByb2plY3Qoc2UsIHpvb20pLnN1YnRyYWN0KHRoaXMucHJvamVjdChudywgem9vbSkpLFxuICAgICAgICAgICAgICAgIHNuYXAgPSBMLkJyb3dzZXIuYW55M2QgPyB0aGlzLm9wdGlvbnMuem9vbVNuYXAgOiAxO1xuXG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbihzaXplLnggLyBib3VuZHNTaXplLngsIHNpemUueSAvIGJvdW5kc1NpemUueSk7XG5cbiAgICAgICAgICAgIHpvb20gPSB0aGlzLmdldFNjYWxlWm9vbShzY2FsZSwgem9vbSk7XG5cbiAgICAgICAgICAgIGlmIChzbmFwKSB7XG4gICAgICAgICAgICAgICAgem9vbSA9IE1hdGgucm91bmQoem9vbSAvIChzbmFwIC8gMTAwKSkgKiAoc25hcCAvIDEwMCk7IC8vIGRvbid0IGp1bXAgaWYgd2l0aGluIDElIG9mIGEgc25hcCBsZXZlbFxuICAgICAgICAgICAgICAgIHpvb20gPSBpbnNpZGUgPyBNYXRoLmNlaWwoem9vbSAvIHNuYXApICogc25hcCA6IE1hdGguZmxvb3Ioem9vbSAvIHNuYXApICogc25hcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB6b29tKSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIEwuTWFwLmluY2x1ZGUoe1xuICAgICAgICBzZXRBY3RpdmVBcmVhOiBmdW5jdGlvbiAoY3NzKSB7XG4gICAgICAgICAgICBpZiggIXRoaXMuX3ZpZXdwb3J0ICl7XG4gICAgICAgICAgICAgICAgLy9NYWtlIHZpZXdwb3J0IGlmIG5vdCBhbHJlYWR5IG1hZGVcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5nZXRDb250YWluZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl92aWV3cG9ydCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICcnKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMuX3ZpZXdwb3J0LCBjb250YWluZXIuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgY3NzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZpZXdwb3J0LmNsYXNzTmFtZSA9IGNzcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgTC5leHRlbmQodGhpcy5fdmlld3BvcnQuc3R5bGUsIGNzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgTC5SZW5kZXJlci5pbmNsdWRlKHtcbiAgICAgICAgX29uWm9vbTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVHJhbnNmb3JtKHRoaXMuX21hcC5nZXRDZW50ZXIodHJ1ZSksIHRoaXMuX21hcC5nZXRab29tKCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF91cGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByZXZpb3VzTWV0aG9kcy5SZW5kZXJlclVwZGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fY2VudGVyID0gdGhpcy5fbWFwLmdldENlbnRlcih0cnVlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgTC5HcmlkTGF5ZXIuaW5jbHVkZSh7XG4gICAgICAgIF91cGRhdGVMZXZlbHM6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgdmFyIHpvb20gPSB0aGlzLl90aWxlWm9vbSxcbiAgICAgICAgICAgICAgICBtYXhab29tID0gdGhpcy5vcHRpb25zLm1heFpvb207XG5cbiAgICAgICAgICAgIGlmICh6b29tID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciB6IGluIHRoaXMuX2xldmVscykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9sZXZlbHNbel0uZWwuY2hpbGRyZW4ubGVuZ3RoIHx8IHogPT09IHpvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGV2ZWxzW3pdLmVsLnN0eWxlLnpJbmRleCA9IG1heFpvb20gLSBNYXRoLmFicyh6b29tIC0geik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZSh0aGlzLl9sZXZlbHNbel0uZWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVUaWxlc0F0Wm9vbSh6KTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2xldmVsc1t6XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBsZXZlbCA9IHRoaXMuX2xldmVsc1t6b29tXSxcbiAgICAgICAgICAgICAgICBtYXAgPSB0aGlzLl9tYXA7XG5cbiAgICAgICAgICAgIGlmICghbGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBsZXZlbCA9IHRoaXMuX2xldmVsc1t6b29tXSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgbGV2ZWwuZWwgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC10aWxlLWNvbnRhaW5lciBsZWFmbGV0LXpvb20tYW5pbWF0ZWQnLCB0aGlzLl9jb250YWluZXIpO1xuICAgICAgICAgICAgICAgIGxldmVsLmVsLnN0eWxlLnpJbmRleCA9IG1heFpvb207XG5cbiAgICAgICAgICAgICAgICBsZXZlbC5vcmlnaW4gPSBtYXAucHJvamVjdChtYXAudW5wcm9qZWN0KG1hcC5nZXRQaXhlbE9yaWdpbigpKSwgem9vbSkucm91bmQoKTtcbiAgICAgICAgICAgICAgICBsZXZlbC56b29tID0gem9vbTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFpvb21UcmFuc2Zvcm0obGV2ZWwsIG1hcC5nZXRDZW50ZXIodHJ1ZSksIG1hcC5nZXRab29tKCkpO1xuXG4gICAgICAgICAgICAgICAgLy8gZm9yY2UgdGhlIGJyb3dzZXIgdG8gY29uc2lkZXIgdGhlIG5ld2x5IGFkZGVkIGVsZW1lbnQgZm9yIHRyYW5zaXRpb25cbiAgICAgICAgICAgICAgICBMLlV0aWwuZmFsc2VGbihsZXZlbC5lbC5vZmZzZXRXaWR0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2xldmVsID0gbGV2ZWw7XG5cbiAgICAgICAgICAgIHJldHVybiBsZXZlbDtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVzZXRWaWV3OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIGFuaW1hdGluZyA9IGUgJiYgKGUucGluY2ggfHwgZS5mbHlUbyk7XG4gICAgICAgICAgICB0aGlzLl9zZXRWaWV3KHRoaXMuX21hcC5nZXRDZW50ZXIodHJ1ZSksIHRoaXMuX21hcC5nZXRab29tKCksIGFuaW1hdGluZywgYW5pbWF0aW5nKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfdXBkYXRlOiBmdW5jdGlvbiAoY2VudGVyKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5fbWFwO1xuICAgICAgICAgICAgaWYgKCFtYXApIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICB2YXIgem9vbSA9IG1hcC5nZXRab29tKCk7XG5cbiAgICAgICAgICAgIGlmIChjZW50ZXIgPT09IHVuZGVmaW5lZCkgeyBjZW50ZXIgPSBtYXAuZ2V0Q2VudGVyKHRoaXMpOyB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGlsZVpvb20gPT09IHVuZGVmaW5lZCkgeyByZXR1cm47IH0gICAgLy8gaWYgb3V0IG9mIG1pbnpvb20vbWF4em9vbVxuXG4gICAgICAgICAgICB2YXIgcGl4ZWxCb3VuZHMgPSB0aGlzLl9nZXRUaWxlZFBpeGVsQm91bmRzKGNlbnRlciksXG4gICAgICAgICAgICAgICAgdGlsZVJhbmdlID0gdGhpcy5fcHhCb3VuZHNUb1RpbGVSYW5nZShwaXhlbEJvdW5kcyksXG4gICAgICAgICAgICAgICAgdGlsZUNlbnRlciA9IHRpbGVSYW5nZS5nZXRDZW50ZXIoKSxcbiAgICAgICAgICAgICAgICBxdWV1ZSA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fdGlsZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90aWxlc1trZXldLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gX3VwZGF0ZSBqdXN0IGxvYWRzIG1vcmUgdGlsZXMuIElmIHRoZSB0aWxlIHpvb20gbGV2ZWwgZGlmZmVycyB0b28gbXVjaFxuICAgICAgICAgICAgLy8gZnJvbSB0aGUgbWFwJ3MsIGxldCBfc2V0VmlldyByZXNldCBsZXZlbHMgYW5kIHBydW5lIG9sZCB0aWxlcy5cbiAgICAgICAgICAgIGlmIChNYXRoLmFicyh6b29tIC0gdGhpcy5fdGlsZVpvb20pID4gMSkgeyB0aGlzLl9zZXRWaWV3KGNlbnRlciwgem9vbSk7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAvLyBjcmVhdGUgYSBxdWV1ZSBvZiBjb29yZGluYXRlcyB0byBsb2FkIHRpbGVzIGZyb21cbiAgICAgICAgICAgIGZvciAodmFyIGogPSB0aWxlUmFuZ2UubWluLnk7IGogPD0gdGlsZVJhbmdlLm1heC55OyBqKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdGlsZVJhbmdlLm1pbi54OyBpIDw9IHRpbGVSYW5nZS5tYXgueDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb29yZHMgPSBuZXcgTC5Qb2ludChpLCBqKTtcbiAgICAgICAgICAgICAgICAgICAgY29vcmRzLnogPSB0aGlzLl90aWxlWm9vbTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWRUaWxlKGNvb3JkcykpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdGlsZSA9IHRoaXMuX3RpbGVzW3RoaXMuX3RpbGVDb29yZHNUb0tleShjb29yZHMpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbGUuY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKGNvb3Jkcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNvcnQgdGlsZSBxdWV1ZSB0byBsb2FkIHRpbGVzIGluIG9yZGVyIG9mIHRoZWlyIGRpc3RhbmNlIHRvIGNlbnRlclxuICAgICAgICAgICAgcXVldWUuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmRpc3RhbmNlVG8odGlsZUNlbnRlcikgLSBiLmRpc3RhbmNlVG8odGlsZUNlbnRlcik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIGl0cyB0aGUgZmlyc3QgYmF0Y2ggb2YgdGlsZXMgdG8gbG9hZFxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGV2ZW50IGxvYWRpbmc6IEV2ZW50XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gdGhlIGdyaWQgbGF5ZXIgc3RhcnRzIGxvYWRpbmcgdGlsZXNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIERPTSBmcmFnbWVudCB0byBhcHBlbmQgdGlsZXMgaW4gb25lIGJhdGNoXG4gICAgICAgICAgICAgICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FkZFRpbGUocXVldWVbaV0sIGZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9sZXZlbC5lbC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIEwuUG9wdXAuaW5jbHVkZSh7XG5cbiAgICAgICAgX2FkanVzdFBhbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9tYXAuX3ZpZXdwb3J0KSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzTWV0aG9kcy5Qb3B1cEFkanVzdFBhbi5jYWxsKF90aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgICAgICB9LCAyNTApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdXRvUGFuIHx8ICh0aGlzLl9tYXAuX3BhbkFuaW0gJiYgdGhpcy5fbWFwLl9wYW5BbmltLl9pblByb2dyZXNzKSkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLl9tYXAsXG4gICAgICAgICAgICAgICAgICAgIHZwID0gbWFwLl92aWV3cG9ydCxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVySGVpZ2h0ID0gdGhpcy5fY29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyV2lkdGggPSB0aGlzLl9jb250YWluZXJXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgdnBUb3BsZWZ0ID0gTC5wb2ludCh2cC5vZmZzZXRMZWZ0LCB2cC5vZmZzZXRUb3ApLFxuXG4gICAgICAgICAgICAgICAgICAgIGxheWVyUG9zID0gbmV3IEwuUG9pbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250YWluZXJMZWZ0IC0gdnBUb3BsZWZ0LngsXG4gICAgICAgICAgICAgICAgICAgICAgICAtIGNvbnRhaW5lckhlaWdodCAtIHRoaXMuX2NvbnRhaW5lckJvdHRvbSAtIHZwVG9wbGVmdC55KTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl96b29tQW5pbWF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXJQb3MuX2FkZChMLkRvbVV0aWwuZ2V0UG9zaXRpb24odGhpcy5fY29udGFpbmVyKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclBvcyA9IG1hcC5sYXllclBvaW50VG9Db250YWluZXJQb2ludChsYXllclBvcyksXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmcgPSBMLnBvaW50KHRoaXMub3B0aW9ucy5hdXRvUGFuUGFkZGluZyksXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmdUTCA9IEwucG9pbnQodGhpcy5vcHRpb25zLmF1dG9QYW5QYWRkaW5nVG9wTGVmdCB8fCBwYWRkaW5nKSxcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0JSID0gTC5wb2ludCh0aGlzLm9wdGlvbnMuYXV0b1BhblBhZGRpbmdCb3R0b21SaWdodCB8fCBwYWRkaW5nKSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IEwucG9pbnQodnAuY2xpZW50V2lkdGgsIHZwLmNsaWVudEhlaWdodCksXG4gICAgICAgICAgICAgICAgICAgIGR4ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgZHkgPSAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lclBvcy54ICsgY29udGFpbmVyV2lkdGggKyBwYWRkaW5nQlIueCA+IHNpemUueCkgeyAvLyByaWdodFxuICAgICAgICAgICAgICAgICAgICBkeCA9IGNvbnRhaW5lclBvcy54ICsgY29udGFpbmVyV2lkdGggLSBzaXplLnggKyBwYWRkaW5nQlIueDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lclBvcy54IC0gZHggLSBwYWRkaW5nVEwueCA8IDApIHsgLy8gbGVmdFxuICAgICAgICAgICAgICAgICAgICBkeCA9IGNvbnRhaW5lclBvcy54IC0gcGFkZGluZ1RMLng7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJQb3MueSArIGNvbnRhaW5lckhlaWdodCArIHBhZGRpbmdCUi55ID4gc2l6ZS55KSB7IC8vIGJvdHRvbVxuICAgICAgICAgICAgICAgICAgICBkeSA9IGNvbnRhaW5lclBvcy55ICsgY29udGFpbmVySGVpZ2h0IC0gc2l6ZS55ICsgcGFkZGluZ0JSLnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJQb3MueSAtIGR5IC0gcGFkZGluZ1RMLnkgPCAwKSB7IC8vIHRvcFxuICAgICAgICAgICAgICAgICAgICBkeSA9IGNvbnRhaW5lclBvcy55IC0gcGFkZGluZ1RMLnk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQG5hbWVzcGFjZSBNYXBcbiAgICAgICAgICAgICAgICAvLyBAc2VjdGlvbiBQb3B1cCBldmVudHNcbiAgICAgICAgICAgICAgICAvLyBAZXZlbnQgYXV0b3BhbnN0YXJ0XG4gICAgICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiB0aGUgbWFwIHN0YXJ0cyBhdXRvcGFubmluZyB3aGVuIG9wZW5pbmcgYSBwb3B1cC5cbiAgICAgICAgICAgICAgICBpZiAoZHggfHwgZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL21hcC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlyZSgnYXV0b3BhbnN0YXJ0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucGFuQnkoW2R4LCBkeV0pO1xuICAgICAgICAgICAgICAgICAgICB9LCAyNTApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIEw7XG59KSk7Il0sImZpbGUiOiJwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5hY3RpdmVhcmVhLmpzIn0=
