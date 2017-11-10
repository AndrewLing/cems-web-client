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
    // 🍂miniclass CancelableEvent (Event objects)
    // 🍂method cancel()
    // Cancel any subsequent action.

    // 🍂miniclass VertexEvent (Event objects)
    // 🍂property vertex: VertexMarker
    // The vertex that fires the event.

    // 🍂miniclass ShapeEvent (Event objects)
    // 🍂property shape: Array
    // The shape (LatLngs array) subject of the action.

    // 🍂miniclass CancelableVertexEvent (Event objects)
    // 🍂inherits VertexEvent
    // 🍂inherits CancelableEvent

    // 🍂miniclass CancelableShapeEvent (Event objects)
    // 🍂inherits ShapeEvent
    // 🍂inherits CancelableEvent

    // 🍂miniclass LayerEvent (Event objects)
    // 🍂property layer: object
    // The Layer (Marker, Polyline…) subject of the action.

    // 🍂namespace Editable; 🍂class Editable; 🍂aka L.Editable
    // Main edition handler. By default, it is attached to the map
    // as `map.editTools` property.
    // Leaflet.Editable is made to be fully extendable. You have three ways to customize
    // the behaviour: using options, listening to events, or extending.
    L.Editable = L.Evented.extend({

        statics: {
            FORWARD: 1,
            BACKWARD: -1
        },

        options: {

            // You can pass them when creating a map using the `editOptions` key.
            // 🍂option zIndex: int = 1000
            // The default zIndex of the editing tools.
            zIndex: 1000,

            // 🍂option polygonClass: class = L.Polygon
            // Class to be used when creating a new Polygon.
            polygonClass: L.Polygon,

            // 🍂option polylineClass: class = L.Polyline
            // Class to be used when creating a new Polyline.
            polylineClass: L.Polyline,

            // 🍂option markerClass: class = L.Marker
            // Class to be used when creating a new Marker.
            markerClass: L.Marker,

            // 🍂option rectangleClass: class = L.Rectangle
            // Class to be used when creating a new Rectangle.
            rectangleClass: L.Rectangle,

            // 🍂option circleClass: class = L.Circle
            // Class to be used when creating a new Circle.
            circleClass: L.Circle,

            // 🍂option drawingCSSClass: string = 'leaflet-editable-drawing'
            // CSS class to be added to the map container while drawing.
            drawingCSSClass: 'leaflet-editable-drawing',

            // 🍂option drawingCursor: const = 'crosshair'
            // Cursor mode set to the map while drawing.
            drawingCursor: 'crosshair',

            // 🍂option editLayer: Layer = new L.LayerGroup()
            // Layer used to store edit tools (vertex, line guide…).
            editLayer: undefined,

            // 🍂option featuresLayer: Layer = new L.LayerGroup()
            // Default layer used to store drawn features (Marker, Polyline…).
            featuresLayer: undefined,

            // 🍂option polylineEditorClass: class = PolylineEditor
            // Class to be used as Polyline editor.
            polylineEditorClass: undefined,

            // 🍂option polygonEditorClass: class = PolygonEditor
            // Class to be used as Polygon editor.
            polygonEditorClass: undefined,

            // 🍂option markerEditorClass: class = MarkerEditor
            // Class to be used as Marker editor.
            markerEditorClass: undefined,

            // 🍂option rectangleEditorClass: class = RectangleEditor
            // Class to be used as Rectangle editor.
            rectangleEditorClass: undefined,

            // 🍂option circleEditorClass: class = CircleEditor
            // Class to be used as Circle editor.
            circleEditorClass: undefined,

            // 🍂option lineGuideOptions: hash = {}
            // Options to be passed to the line guides.
            lineGuideOptions: {},

            // 🍂option skipMiddleMarkers: boolean = false
            // Set this to true if you don't want middle markers.
            skipMiddleMarkers: false

        },

        initialize: function (map, options) {
            L.setOptions(this, options);
            this._lastZIndex = this.options.zIndex;
            this.map = map;
            this.editLayer = this.createEditLayer();
            this.featuresLayer = this.createFeaturesLayer();
            this.forwardLineGuide = this.createLineGuide();
            this.backwardLineGuide = this.createLineGuide();
        },

        fireAndForward: function (type, e) {
            e = e || {};
            e.editTools = this;
            this.fire(type, e);
            this.map.fire(type, e);
        },

        createLineGuide: function () {
            var options = L.extend({dashArray: '5,10', weight: 1, interactive: false}, this.options.lineGuideOptions);
            return L.polyline([], options);
        },

        createVertexIcon: function (options) {
            return L.Browser.touch ? new L.Editable.TouchVertexIcon(options) : new L.Editable.VertexIcon(options);
        },

        createEditLayer: function () {
            return this.options.editLayer || new L.LayerGroup().addTo(this.map);
        },

        createFeaturesLayer: function () {
            return this.options.featuresLayer || new L.LayerGroup().addTo(this.map);
        },

        moveForwardLineGuide: function (latlng) {
            if (this.forwardLineGuide._latlngs.length) {
                this.forwardLineGuide._latlngs[1] = latlng;
                this.forwardLineGuide._bounds.extend(latlng);
                this.forwardLineGuide.redraw();
            }
        },

        moveBackwardLineGuide: function (latlng) {
            if (this.backwardLineGuide._latlngs.length) {
                this.backwardLineGuide._latlngs[1] = latlng;
                this.backwardLineGuide._bounds.extend(latlng);
                this.backwardLineGuide.redraw();
            }
        },

        anchorForwardLineGuide: function (latlng) {
            this.forwardLineGuide._latlngs[0] = latlng;
            this.forwardLineGuide._bounds.extend(latlng);
            this.forwardLineGuide.redraw();
        },

        anchorBackwardLineGuide: function (latlng) {
            this.backwardLineGuide._latlngs[0] = latlng;
            this.backwardLineGuide._bounds.extend(latlng);
            this.backwardLineGuide.redraw();
        },

        attachForwardLineGuide: function () {
            this.editLayer.addLayer(this.forwardLineGuide);
        },

        attachBackwardLineGuide: function () {
            this.editLayer.addLayer(this.backwardLineGuide);
        },

        detachForwardLineGuide: function () {
            this.forwardLineGuide.setLatLngs([]);
            this.editLayer.removeLayer(this.forwardLineGuide);
        },

        detachBackwardLineGuide: function () {
            this.backwardLineGuide.setLatLngs([]);
            this.editLayer.removeLayer(this.backwardLineGuide);
        },

        blockEvents: function () {
            // Hack: force map not to listen to other layers events while drawing.
            if (!this._oldTargets) {
                this._oldTargets = this.map._targets;
                this.map._targets = {};
            }
        },

        unblockEvents: function () {
            if (this._oldTargets) {
                // Reset, but keep targets created while drawing.
                this.map._targets = L.extend(this.map._targets, this._oldTargets);
                delete this._oldTargets;
            }
        },

        registerForDrawing: function (editor) {
            if (this._drawingEditor) this.unregisterForDrawing(this._drawingEditor);
            this.blockEvents();
            editor.reset();  // Make sure editor tools still receive events.
            this._drawingEditor = editor;
            this.map.on('mousemove touchmove', editor.onDrawingMouseMove, editor);
            this.map.on('mousedown', this.onMousedown, this);
            this.map.on('mouseup', this.onMouseup, this);
            L.DomUtil.addClass(this.map._container, this.options.drawingCSSClass);
            this.defaultMapCursor = this.map._container.style.cursor;
            this.map._container.style.cursor = this.options.drawingCursor;
        },

        unregisterForDrawing: function (editor) {
            this.unblockEvents();
            L.DomUtil.removeClass(this.map._container, this.options.drawingCSSClass);
            this.map._container.style.cursor = this.defaultMapCursor;
            editor = editor || this._drawingEditor;
            if (!editor) return;
            this.map.off('mousemove touchmove', editor.onDrawingMouseMove, editor);
            this.map.off('mousedown', this.onMousedown, this);
            this.map.off('mouseup', this.onMouseup, this);
            if (editor !== this._drawingEditor) return;
            delete this._drawingEditor;
            if (editor._drawing) editor.cancelDrawing();
        },

        onMousedown: function (e) {
            this._mouseDown = e;
            this._drawingEditor.onDrawingMouseDown(e);
        },

        onMouseup: function (e) {
            if (this._mouseDown) {
                var editor = this._drawingEditor,
                    mouseDown = this._mouseDown;
                this._mouseDown = null;
                editor.onDrawingMouseUp(e);
                if (this._drawingEditor !== editor) return;  // onDrawingMouseUp may call unregisterFromDrawing.
                var origin = L.point(mouseDown.originalEvent.clientX, mouseDown.originalEvent.clientY);
                var distance = L.point(e.originalEvent.clientX, e.originalEvent.clientY).distanceTo(origin);
                if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) this._drawingEditor.onDrawingClick(e);
            }
        },

        // 🍂section Public methods
        // You will generally access them by the `map.editTools`
        // instance:
        //
        // `map.editTools.startPolyline();`

        // 🍂method drawing(): boolean
        // Return true if any drawing action is ongoing.
        drawing: function () {
            return this._drawingEditor && this._drawingEditor.drawing();
        },

        // 🍂method stopDrawing()
        // When you need to stop any ongoing drawing, without needing to know which editor is active.
        stopDrawing: function () {
            this.unregisterForDrawing();
        },

        // 🍂method commitDrawing()
        // When you need to commit any ongoing drawing, without needing to know which editor is active.
        commitDrawing: function (e) {
            if (!this._drawingEditor) return;
            this._drawingEditor.commitDrawing(e);
        },

        connectCreatedToMap: function (layer) {
            return this.featuresLayer.addLayer(layer);
        },

        // 🍂method startPolyline(latlng: L.LatLng, options: hash): L.Polyline
        // Start drawing a Polyline. If `latlng` is given, a first point will be added. In any case, continuing on user click.
        // If `options` is given, it will be passed to the Polyline class constructor.
        startPolyline: function (latlng, options) {
            var line = this.createPolyline([], options);
            line.enableEdit(this.map).newShape(latlng);
            return line;
        },

        // 🍂method startPolygon(latlng: L.LatLng, options: hash): L.Polygon
        // Start drawing a Polygon. If `latlng` is given, a first point will be added. In any case, continuing on user click.
        // If `options` is given, it will be passed to the Polygon class constructor.
        startPolygon: function (latlng, options) {
            var polygon = this.createPolygon([], options);
            polygon.enableEdit(this.map).newShape(latlng);
            return polygon;
        },

        // 🍂method startMarker(latlng: L.LatLng, options: hash): L.Marker
        // Start adding a Marker. If `latlng` is given, the Marker will be shown first at this point.
        // In any case, it will follow the user mouse, and will have a final `latlng` on next click (or touch).
        // If `options` is given, it will be passed to the Marker class constructor.
        startMarker: function (latlng, options) {
            latlng = latlng || this.map.getCenter().clone();
            var marker = this.createMarker(latlng, options);
            marker.enableEdit(this.map).startDrawing();
            return marker;
        },

        // 🍂method startRectangle(latlng: L.LatLng, options: hash): L.Rectangle
        // Start drawing a Rectangle. If `latlng` is given, the Rectangle anchor will be added. In any case, continuing on user drag.
        // If `options` is given, it will be passed to the Rectangle class constructor.
        startRectangle: function(latlng, options) {
            var corner = latlng || L.latLng([0, 0]);
            var bounds = new L.LatLngBounds(corner, corner);
            var rectangle = this.createRectangle(bounds, options);
            rectangle.enableEdit(this.map).startDrawing();
            return rectangle;
        },

        // 🍂method startCircle(latlng: L.LatLng, options: hash): L.Circle
        // Start drawing a Circle. If `latlng` is given, the Circle anchor will be added. In any case, continuing on user drag.
        // If `options` is given, it will be passed to the Circle class constructor.
        startCircle: function (latlng, options) {
            latlng = latlng || this.map.getCenter().clone();
            var circle = this.createCircle(latlng, options);
            circle.enableEdit(this.map).startDrawing();
            return circle;
        },

        startHole: function (editor, latlng) {
            editor.newHole(latlng);
        },

        createLayer: function (klass, latlngs, options) {
            options = L.Util.extend({editOptions: {editTools: this}}, options);
            var layer = new klass(latlngs, options);
            // 🍂namespace Editable
            // 🍂event editable:created: LayerEvent
            // Fired when a new feature (Marker, Polyline…) is created.
            this.fireAndForward('editable:created', {layer: layer});
            return layer;
        },

        createPolyline: function (latlngs, options) {
            return this.createLayer(options && options.polylineClass || this.options.polylineClass, latlngs, options);
        },

        createPolygon: function (latlngs, options) {
            return this.createLayer(options && options.polygonClass || this.options.polygonClass, latlngs, options);
        },

        createMarker: function (latlng, options) {
            return this.createLayer(options && options.markerClass || this.options.markerClass, latlng, options);
        },

        createRectangle: function (bounds, options) {
            return this.createLayer(options && options.rectangleClass || this.options.rectangleClass, bounds, options);
        },

        createCircle: function (latlng, options) {
            return this.createLayer(options && options.circleClass || this.options.circleClass, latlng, options);
        }

    });

    L.extend(L.Editable, {

        makeCancellable: function (e) {
            e.cancel = function () {
                e._cancelled = true;
            };
        }

    });

    // 🍂namespace Map; 🍂class Map
    // Leaflet.Editable add options and events to the `L.Map` object.
    // See `Editable` events for the list of events fired on the Map.
    // 🍂example
    //
    // ```js
    // var map = L.map('map', {
    //  editable: true,
    //  editOptions: {
    //    …
    // }
    // });
    // ```
    // 🍂section Editable Map Options
    L.Map.mergeOptions({

        // 🍂namespace Map
        // 🍂section Map Options
        // 🍂option editToolsClass: class = L.Editable
        // Class to be used as vertex, for path editing.
        editToolsClass: L.Editable,

        // 🍂option editable: boolean = false
        // Whether to create a L.Editable instance at map init.
        editable: false,

        // 🍂option editOptions: hash = {}
        // Options to pass to L.Editable when instanciating.
        editOptions: {}

    });

    L.Map.addInitHook(function () {

        this.whenReady(function () {
            if (this.options.editable) {
                this.editTools = new this.options.editToolsClass(this, this.options.editOptions);
            }
        });

    });

    L.Editable.VertexIcon = L.DivIcon.extend({

        options: {
            iconSize: new L.Point(8, 8)
        }

    });

    L.Editable.TouchVertexIcon = L.Editable.VertexIcon.extend({

        options: {
            iconSize: new L.Point(8, 8)
        }

    });


    // 🍂namespace Editable; 🍂class VertexMarker; Handler for dragging path vertices.
    L.Editable.VertexMarker = L.Marker.extend({

        options: {
            draggable: true,
            className: 'leaflet-div-icon leaflet-vertex-icon'
        },


        // 🍂section Public methods
        // The marker used to handle path vertex. You will usually interact with a `VertexMarker`
        // instance when listening for events like `editable:vertex:ctrlclick`.

        initialize: function (latlng, latlngs, editor, options) {
            // We don't use this._latlng, because on drag Leaflet replace it while
            // we want to keep reference.
            this.latlng = latlng;
            this.latlngs = latlngs;
            this.editor = editor;
            L.Marker.prototype.initialize.call(this, latlng, options);
            this.options.icon = this.editor.tools.createVertexIcon({className: this.options.className});
            this.latlng.__vertex = this;
            this.editor.editLayer.addLayer(this);
            this.setZIndexOffset(editor.tools._lastZIndex + 1);
        },

        onAdd: function (map) {
            L.Marker.prototype.onAdd.call(this, map);
            this.on('drag', this.onDrag);
            this.on('dragstart', this.onDragStart);
            this.on('dragend', this.onDragEnd);
            this.on('mouseup', this.onMouseup);
            this.on('click', this.onClick);
            this.on('contextmenu', this.onContextMenu);
            this.on('mousedown touchstart', this.onMouseDown);
            this.addMiddleMarkers();
        },

        onRemove: function (map) {
            if (this.middleMarker) this.middleMarker.delete();
            delete this.latlng.__vertex;
            this.off('drag', this.onDrag);
            this.off('dragstart', this.onDragStart);
            this.off('dragend', this.onDragEnd);
            this.off('mouseup', this.onMouseup);
            this.off('click', this.onClick);
            this.off('contextmenu', this.onContextMenu);
            this.off('mousedown touchstart', this.onMouseDown);
            L.Marker.prototype.onRemove.call(this, map);
        },

        onDrag: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerDrag(e);
            var iconPos = L.DomUtil.getPosition(this._icon),
                latlng = this._map.layerPointToLatLng(iconPos);
            this.latlng.update(latlng);
            this._latlng = this.latlng;  // Push back to Leaflet our reference.
            this.editor.refresh();
            if (this.middleMarker) this.middleMarker.updateLatLng();
            var next = this.getNext();
            if (next && next.middleMarker) next.middleMarker.updateLatLng();
        },

        onDragStart: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerDragStart(e);
        },

        onDragEnd: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerDragEnd(e);
        },

        onClick: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerClick(e);
        },

        onMouseup: function (e) {
            L.DomEvent.stop(e);
            e.vertex = this;
            this.editor.map.fire('mouseup', e);
        },

        onContextMenu: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerContextMenu(e);
        },

        onMouseDown: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerMouseDown(e);
        },

        // 🍂method delete()
        // Delete a vertex and the related LatLng.
        delete: function () {
            var next = this.getNext();  // Compute before changing latlng
            this.latlngs.splice(this.getIndex(), 1);
            this.editor.editLayer.removeLayer(this);
            this.editor.onVertexDeleted({latlng: this.latlng, vertex: this});
            if (!this.latlngs.length) this.editor.deleteShape(this.latlngs);
            if (next) next.resetMiddleMarker();
            this.editor.refresh();
        },

        // 🍂method getIndex(): int
        // Get the index of the current vertex among others of the same LatLngs group.
        getIndex: function () {
            return this.latlngs.indexOf(this.latlng);
        },

        // 🍂method getLastIndex(): int
        // Get last vertex index of the LatLngs group of the current vertex.
        getLastIndex: function () {
            return this.latlngs.length - 1;
        },

        // 🍂method getPrevious(): VertexMarker
        // Get the previous VertexMarker in the same LatLngs group.
        getPrevious: function () {
            if (this.latlngs.length < 2) return;
            var index = this.getIndex(),
                previousIndex = index - 1;
            if (index === 0 && this.editor.CLOSED) previousIndex = this.getLastIndex();
            var previous = this.latlngs[previousIndex];
            if (previous) return previous.__vertex;
        },

        // 🍂method getNext(): VertexMarker
        // Get the next VertexMarker in the same LatLngs group.
        getNext: function () {
            if (this.latlngs.length < 2) return;
            var index = this.getIndex(),
                nextIndex = index + 1;
            if (index === this.getLastIndex() && this.editor.CLOSED) nextIndex = 0;
            var next = this.latlngs[nextIndex];
            if (next) return next.__vertex;
        },

        addMiddleMarker: function (previous) {
            if (!this.editor.hasMiddleMarkers()) return;
            previous = previous || this.getPrevious();
            if (previous && !this.middleMarker) this.middleMarker = this.editor.addMiddleMarker(previous, this, this.latlngs, this.editor);
        },

        addMiddleMarkers: function () {
            if (!this.editor.hasMiddleMarkers()) return;
            var previous = this.getPrevious();
            if (previous) this.addMiddleMarker(previous);
            var next = this.getNext();
            if (next) next.resetMiddleMarker();
        },

        resetMiddleMarker: function () {
            if (this.middleMarker) this.middleMarker.delete();
            this.addMiddleMarker();
        },

        // 🍂method split()
        // Split the vertex LatLngs group at its index, if possible.
        split: function () {
            if (!this.editor.splitShape) return;  // Only for PolylineEditor
            this.editor.splitShape(this.latlngs, this.getIndex());
        },

        // 🍂method continue()
        // Continue the vertex LatLngs from this vertex. Only active for first and last vertices of a Polyline.
        continue: function () {
            if (!this.editor.continueBackward) return;  // Only for PolylineEditor
            var index = this.getIndex();
            if (index === 0) this.editor.continueBackward(this.latlngs);
            else if (index === this.getLastIndex()) this.editor.continueForward(this.latlngs);
        }

    });

    L.Editable.mergeOptions({

        // 🍂namespace Editable
        // 🍂option vertexMarkerClass: class = VertexMarker
        // Class to be used as vertex, for path editing.
        vertexMarkerClass: L.Editable.VertexMarker

    });

    L.Editable.MiddleMarker = L.Marker.extend({

        options: {
            opacity: 0.5,
            className: 'leaflet-div-icon leaflet-middle-icon',
            draggable: true
        },

        initialize: function (left, right, latlngs, editor, options) {
            this.left = left;
            this.right = right;
            this.editor = editor;
            this.latlngs = latlngs;
            L.Marker.prototype.initialize.call(this, this.computeLatLng(), options);
            this._opacity = this.options.opacity;
            this.options.icon = this.editor.tools.createVertexIcon({className: this.options.className});
            this.editor.editLayer.addLayer(this);
            this.setVisibility();
        },

        setVisibility: function () {
            var leftPoint = this._map.latLngToContainerPoint(this.left.latlng),
                rightPoint = this._map.latLngToContainerPoint(this.right.latlng),
                size = L.point(this.options.icon.options.iconSize);
            if (leftPoint.distanceTo(rightPoint) < size.x * 3) this.hide();
            else this.show();
        },

        show: function () {
            this.setOpacity(this._opacity);
        },

        hide: function () {
            this.setOpacity(0);
        },

        updateLatLng: function () {
            this.setLatLng(this.computeLatLng());
            this.setVisibility();
        },

        computeLatLng: function () {
            var leftPoint = this.editor.map.latLngToContainerPoint(this.left.latlng),
                rightPoint = this.editor.map.latLngToContainerPoint(this.right.latlng),
                y = (leftPoint.y + rightPoint.y) / 2,
                x = (leftPoint.x + rightPoint.x) / 2;
            return this.editor.map.containerPointToLatLng([x, y]);
        },

        onAdd: function (map) {
            L.Marker.prototype.onAdd.call(this, map);
            L.DomEvent.on(this._icon, 'mousedown touchstart', this.onMouseDown, this);
            map.on('zoomend', this.setVisibility, this);
        },

        onRemove: function (map) {
            delete this.right.middleMarker;
            L.DomEvent.off(this._icon, 'mousedown touchstart', this.onMouseDown, this);
            map.off('zoomend', this.setVisibility, this);
            L.Marker.prototype.onRemove.call(this, map);
        },

        onMouseDown: function (e) {
            var iconPos = L.DomUtil.getPosition(this._icon),
                latlng = this.editor.map.layerPointToLatLng(iconPos);
            e = {
                originalEvent: e,
                latlng: latlng
            };
            if (this.options.opacity === 0) return;
            L.Editable.makeCancellable(e);
            this.editor.onMiddleMarkerMouseDown(e);
            if (e._cancelled) return;
            this.latlngs.splice(this.index(), 0, e.latlng);
            this.editor.refresh();
            var icon = this._icon;
            var marker = this.editor.addVertexMarker(e.latlng, this.latlngs);
            /* Hack to workaround browser not firing touchend when element is no more on DOM */
            var parent = marker._icon.parentNode;
            parent.removeChild(marker._icon);
            marker._icon = icon;
            parent.appendChild(marker._icon);
            marker._initIcon();
            marker._initInteraction();
            marker.setOpacity(1);
            /* End hack */
            // Transfer ongoing dragging to real marker
            L.Draggable._dragging = false;
            marker.dragging._draggable._onDown(e.originalEvent);
            this.delete();
        },

        delete: function () {
            this.editor.editLayer.removeLayer(this);
        },

        index: function () {
            return this.latlngs.indexOf(this.right.latlng);
        }

    });

    L.Editable.mergeOptions({

        // 🍂namespace Editable
        // 🍂option middleMarkerClass: class = VertexMarker
        // Class to be used as middle vertex, pulled by the user to create a new point in the middle of a path.
        middleMarkerClass: L.Editable.MiddleMarker

    });

    // 🍂namespace Editable; 🍂class BaseEditor; 🍂aka L.Editable.BaseEditor
    // When editing a feature (Marker, Polyline…), an editor is attached to it. This
    // editor basically knows how to handle the edition.
    L.Editable.BaseEditor = L.Handler.extend({

        initialize: function (map, feature, options) {
            L.setOptions(this, options);
            this.map = map;
            this.feature = feature;
            this.feature.editor = this;
            this.editLayer = new L.LayerGroup();
            this.tools = this.options.editTools || map.editTools;
        },

        // 🍂method enable(): this
        // Set up the drawing tools for the feature to be editable.
        addHooks: function () {
            if (this.isConnected()) this.onFeatureAdd();
            else this.feature.once('add', this.onFeatureAdd, this);
            this.onEnable();
            this.feature.on(this._getEvents(), this);
            return;
        },

        // 🍂method disable(): this
        // Remove the drawing tools for the feature.
        removeHooks: function () {
            this.feature.off(this._getEvents(), this);
            if (this.feature.dragging) this.feature.dragging.disable();
            this.editLayer.clearLayers();
            this.tools.editLayer.removeLayer(this.editLayer);
            this.onDisable();
            if (this._drawing) this.cancelDrawing();
            return;
        },

        // 🍂method drawing(): boolean
        // Return true if any drawing action is ongoing with this editor.
        drawing: function () {
            return !!this._drawing;
        },

        reset: function () {},

        onFeatureAdd: function () {
            this.tools.editLayer.addLayer(this.editLayer);
            if (this.feature.dragging) this.feature.dragging.enable();
        },

        hasMiddleMarkers: function () {
            return !this.options.skipMiddleMarkers && !this.tools.options.skipMiddleMarkers;
        },

        fireAndForward: function (type, e) {
            e = e || {};
            e.layer = this.feature;
            this.feature.fire(type, e);
            this.tools.fireAndForward(type, e);
        },

        onEnable: function () {
            // 🍂namespace Editable
            // 🍂event editable:enable: Event
            // Fired when an existing feature is ready to be edited.
            this.fireAndForward('editable:enable');
        },

        onDisable: function () {
            // 🍂namespace Editable
            // 🍂event editable:disable: Event
            // Fired when an existing feature is not ready anymore to be edited.
            this.fireAndForward('editable:disable');
        },

        onEditing: function () {
            // 🍂namespace Editable
            // 🍂event editable:editing: Event
            // Fired as soon as any change is made to the feature geometry.
            this.fireAndForward('editable:editing');
        },

        onStartDrawing: function () {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:start: Event
            // Fired when a feature is to be drawn.
            this.fireAndForward('editable:drawing:start');
        },

        onEndDrawing: function () {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:end: Event
            // Fired when a feature is not drawn anymore.
            this.fireAndForward('editable:drawing:end');
        },

        onCancelDrawing: function () {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:cancel: Event
            // Fired when user cancel drawing while a feature is being drawn.
            this.fireAndForward('editable:drawing:cancel');
        },

        onCommitDrawing: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:commit: Event
            // Fired when user finish drawing a feature.
            this.fireAndForward('editable:drawing:commit', e);
        },

        onDrawingMouseDown: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:mousedown: Event
            // Fired when user `mousedown` while drawing.
            this.fireAndForward('editable:drawing:mousedown', e);
        },

        onDrawingMouseUp: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:mouseup: Event
            // Fired when user `mouseup` while drawing.
            this.fireAndForward('editable:drawing:mouseup', e);
        },

        startDrawing: function () {
            if (!this._drawing) this._drawing = L.Editable.FORWARD;
            this.tools.registerForDrawing(this);
            this.onStartDrawing();
        },

        commitDrawing: function (e) {
            this.onCommitDrawing(e);
            this.endDrawing();
        },

        cancelDrawing: function () {
            // If called during a vertex drag, the vertex will be removed before
            // the mouseup fires on it. This is a workaround. Maybe better fix is
            // To have L.Draggable reset it's status on disable (Leaflet side).
            L.Draggable._dragging = false;
            this.onCancelDrawing();
            this.endDrawing();
        },

        endDrawing: function () {
            this._drawing = false;
            this.tools.unregisterForDrawing(this);
            this.onEndDrawing();
        },

        onDrawingClick: function (e) {
            if (!this.drawing()) return;
            L.Editable.makeCancellable(e);
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:click: CancelableEvent
            // Fired when user `click` while drawing, before any internal action is being processed.
            this.fireAndForward('editable:drawing:click', e);
            if (e._cancelled) return;
            if (!this.isConnected()) this.connect(e);
            this.processDrawingClick(e);
        },

        isConnected: function () {
            return this.map.hasLayer(this.feature);
        },

        connect: function (e) {
            this.tools.connectCreatedToMap(this.feature);
            this.tools.editLayer.addLayer(this.editLayer);
        },

        onMove: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:move: Event
            // Fired when `move` mouse while drawing, while dragging a marker, and while dragging a vertex.
            this.fireAndForward('editable:drawing:move', e);
        },

        onDrawingMouseMove: function (e) {
            this.onMove(e);
        },

        _getEvents: function () {
            return {
                dragstart: this.onDragStart,
                drag: this.onDrag,
                dragend: this.onDragEnd,
                remove: this.disable
            };
        },

        onDragStart: function (e) {
            this.onEditing();
            // 🍂namespace Editable
            // 🍂event editable:dragstart: Event
            // Fired before a path feature is dragged.
            this.fireAndForward('editable:dragstart', e);
        },

        onDrag: function (e) {
            this.onMove(e);
            // 🍂namespace Editable
            // 🍂event editable:drag: Event
            // Fired when a path feature is being dragged.
            this.fireAndForward('editable:drag', e);
        },

        onDragEnd: function (e) {
            // 🍂namespace Editable
            // 🍂event editable:dragend: Event
            // Fired after a path feature has been dragged.
            this.fireAndForward('editable:dragend', e);
        }

    });

    // 🍂namespace Editable; 🍂class MarkerEditor; 🍂aka L.Editable.MarkerEditor
    // 🍂inherits BaseEditor
    // Editor for Marker.
    L.Editable.MarkerEditor = L.Editable.BaseEditor.extend({

        onDrawingMouseMove: function (e) {
            L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this, e);
            if (this._drawing) this.feature.setLatLng(e.latlng);
        },

        processDrawingClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:clicked: Event
            // Fired when user `click` while drawing, after all internal actions.
            this.fireAndForward('editable:drawing:clicked', e);
            this.commitDrawing(e);
        },

        connect: function (e) {
            // On touch, the latlng has not been updated because there is
            // no mousemove.
            if (e) this.feature._latlng = e.latlng;
            L.Editable.BaseEditor.prototype.connect.call(this, e);
        }

    });

    // 🍂namespace Editable; 🍂class PathEditor; 🍂aka L.Editable.PathEditor
    // 🍂inherits BaseEditor
    // Base class for all path editors.
    L.Editable.PathEditor = L.Editable.BaseEditor.extend({

        CLOSED: false,
        MIN_VERTEX: 2,

        addHooks: function () {
            L.Editable.BaseEditor.prototype.addHooks.call(this);
            if (this.feature) this.initVertexMarkers();
            return this;
        },

        initVertexMarkers: function (latlngs) {
            if (!this.enabled()) return;
            latlngs = latlngs || this.getLatLngs();
            if (L.Polyline._flat(latlngs)) this.addVertexMarkers(latlngs);
            else for (var i = 0; i < latlngs.length; i++) this.initVertexMarkers(latlngs[i]);
        },

        getLatLngs: function () {
            return this.feature.getLatLngs();
        },

        // 🍂method reset()
        // Rebuild edit elements (Vertex, MiddleMarker, etc.).
        reset: function () {
            this.editLayer.clearLayers();
            this.initVertexMarkers();
        },

        addVertexMarker: function (latlng, latlngs) {
            return new this.tools.options.vertexMarkerClass(latlng, latlngs, this);
        },

        addVertexMarkers: function (latlngs) {
            for (var i = 0; i < latlngs.length; i++) {
                this.addVertexMarker(latlngs[i], latlngs);
            }
        },

        refreshVertexMarkers: function (latlngs) {
            latlngs = latlngs || this.getDefaultLatLngs();
            for (var i = 0; i < latlngs.length; i++) {
                latlngs[i].__vertex.update();
            }
        },

        addMiddleMarker: function (left, right, latlngs) {
            return new this.tools.options.middleMarkerClass(left, right, latlngs, this);
        },

        onVertexMarkerClick: function (e) {
            L.Editable.makeCancellable(e);
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:click: CancelableVertexEvent
            // Fired when a `click` is issued on a vertex, before any internal action is being processed.
            this.fireAndForward('editable:vertex:click', e);
            if (e._cancelled) return;
            if (this.tools.drawing() && this.tools._drawingEditor !== this) return;
            var index = e.vertex.getIndex(), commit;
            if (e.originalEvent.ctrlKey) {
                this.onVertexMarkerCtrlClick(e);
            } else if (e.originalEvent.altKey) {
                this.onVertexMarkerAltClick(e);
            } else if (e.originalEvent.shiftKey) {
                this.onVertexMarkerShiftClick(e);
            } else if (e.originalEvent.metaKey) {
                this.onVertexMarkerMetaKeyClick(e);
            } else if (index === e.vertex.getLastIndex() && this._drawing === L.Editable.FORWARD) {
                if (index >= this.MIN_VERTEX - 1) commit = true;
            } else if (index === 0 && this._drawing === L.Editable.BACKWARD && this._drawnLatLngs.length >= this.MIN_VERTEX) {
                commit = true;
            } else if (index === 0 && this._drawing === L.Editable.FORWARD && this._drawnLatLngs.length >= this.MIN_VERTEX && this.CLOSED) {
                commit = true;  // Allow to close on first point also for polygons
            } else {
                this.onVertexRawMarkerClick(e);
            }
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:clicked: VertexEvent
            // Fired when a `click` is issued on a vertex, after all internal actions.
            this.fireAndForward('editable:vertex:clicked', e);
            if (commit) this.commitDrawing(e);
        },

        onVertexRawMarkerClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:rawclick: CancelableVertexEvent
            // Fired when a `click` is issued on a vertex without any special key and without being in drawing mode.
            this.fireAndForward('editable:vertex:rawclick', e);
            if (e._cancelled) return;
            if (!this.vertexCanBeDeleted(e.vertex)) return;
            e.vertex.delete();
        },

        vertexCanBeDeleted: function (vertex) {
            return vertex.latlngs.length > this.MIN_VERTEX;
        },

        onVertexDeleted: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:deleted: VertexEvent
            // Fired after a vertex has been deleted by user.
            this.fireAndForward('editable:vertex:deleted', e);
        },

        onVertexMarkerCtrlClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:ctrlclick: VertexEvent
            // Fired when a `click` with `ctrlKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:ctrlclick', e);
        },

        onVertexMarkerShiftClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:shiftclick: VertexEvent
            // Fired when a `click` with `shiftKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:shiftclick', e);
        },

        onVertexMarkerMetaKeyClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:metakeyclick: VertexEvent
            // Fired when a `click` with `metaKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:metakeyclick', e);
        },

        onVertexMarkerAltClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:altclick: VertexEvent
            // Fired when a `click` with `altKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:altclick', e);
        },

        onVertexMarkerContextMenu: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:contextmenu: VertexEvent
            // Fired when a `contextmenu` is issued on a vertex.
            this.fireAndForward('editable:vertex:contextmenu', e);
        },

        onVertexMarkerMouseDown: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:mousedown: VertexEvent
            // Fired when user `mousedown` a vertex.
            this.fireAndForward('editable:vertex:mousedown', e);
        },

        onMiddleMarkerMouseDown: function (e) {
            // 🍂namespace Editable
            // 🍂section MiddleMarker events
            // 🍂event editable:middlemarker:mousedown: VertexEvent
            // Fired when user `mousedown` a middle marker.
            this.fireAndForward('editable:middlemarker:mousedown', e);
        },

        onVertexMarkerDrag: function (e) {
            this.onMove(e);
            if (this.feature._bounds) this.extendBounds(e);
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:drag: VertexEvent
            // Fired when a vertex is dragged by user.
            this.fireAndForward('editable:vertex:drag', e);
        },

        onVertexMarkerDragStart: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:dragstart: VertexEvent
            // Fired before a vertex is dragged by user.
            this.fireAndForward('editable:vertex:dragstart', e);
        },

        onVertexMarkerDragEnd: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:dragend: VertexEvent
            // Fired after a vertex is dragged by user.
            this.fireAndForward('editable:vertex:dragend', e);
        },

        setDrawnLatLngs: function (latlngs) {
            this._drawnLatLngs = latlngs || this.getDefaultLatLngs();
        },

        startDrawing: function () {
            if (!this._drawnLatLngs) this.setDrawnLatLngs();
            L.Editable.BaseEditor.prototype.startDrawing.call(this);
        },

        startDrawingForward: function () {
            this.startDrawing();
        },

        endDrawing: function () {
            this.tools.detachForwardLineGuide();
            this.tools.detachBackwardLineGuide();
            if (this._drawnLatLngs && this._drawnLatLngs.length < this.MIN_VERTEX) this.deleteShape(this._drawnLatLngs);
            L.Editable.BaseEditor.prototype.endDrawing.call(this);
            delete this._drawnLatLngs;
        },

        addLatLng: function (latlng) {
            if (this._drawing === L.Editable.FORWARD) this._drawnLatLngs.push(latlng);
            else this._drawnLatLngs.unshift(latlng);
            this.feature._bounds.extend(latlng);
            this.addVertexMarker(latlng, this._drawnLatLngs);
            this.refresh();
        },

        newPointForward: function (latlng) {
            this.addLatLng(latlng);
            this.tools.attachForwardLineGuide();
            this.tools.anchorForwardLineGuide(latlng);
        },

        newPointBackward: function (latlng) {
            this.addLatLng(latlng);
            this.tools.anchorBackwardLineGuide(latlng);
        },

        // 🍂namespace PathEditor
        // 🍂method push()
        // Programmatically add a point while drawing.
        push: function (latlng) {
            if (!latlng) return console.error('L.Editable.PathEditor.push expect a vaild latlng as parameter');
            if (this._drawing === L.Editable.FORWARD) this.newPointForward(latlng);
            else this.newPointBackward(latlng);
        },

        removeLatLng: function (latlng) {
            latlng.__vertex.delete();
            this.refresh();
        },

        // 🍂method pop(): L.LatLng or null
        // Programmatically remove last point (if any) while drawing.
        pop: function () {
            if (this._drawnLatLngs.length <= 1) return;
            var latlng;
            if (this._drawing === L.Editable.FORWARD) latlng = this._drawnLatLngs[this._drawnLatLngs.length - 1];
            else latlng = this._drawnLatLngs[0];
            this.removeLatLng(latlng);
            if (this._drawing === L.Editable.FORWARD) this.tools.anchorForwardLineGuide(this._drawnLatLngs[this._drawnLatLngs.length - 1]);
            else this.tools.anchorForwardLineGuide(this._drawnLatLngs[0]);
            return latlng;
        },

        processDrawingClick: function (e) {
            if (e.vertex && e.vertex.editor === this) return;
            if (this._drawing === L.Editable.FORWARD) this.newPointForward(e.latlng);
            else this.newPointBackward(e.latlng);
            this.fireAndForward('editable:drawing:clicked', e);
        },

        onDrawingMouseMove: function (e) {
            L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this, e);
            if (this._drawing) {
                this.tools.moveForwardLineGuide(e.latlng);
                this.tools.moveBackwardLineGuide(e.latlng);
            }
        },

        refresh: function () {
            this.feature.redraw();
            this.onEditing();
        },

        // 🍂namespace PathEditor
        // 🍂method newShape(latlng?: L.LatLng)
        // Add a new shape (Polyline, Polygon) in a multi, and setup up drawing tools to draw it;
        // if optional `latlng` is given, start a path at this point.
        newShape: function (latlng) {
            var shape = this.addNewEmptyShape();
            if (!shape) return;
            this.setDrawnLatLngs(shape[0] || shape);  // Polygon or polyline
            this.startDrawingForward();
            // 🍂namespace Editable
            // 🍂section Shape events
            // 🍂event editable:shape:new: ShapeEvent
            // Fired when a new shape is created in a multi (Polygon or Polyline).
            this.fireAndForward('editable:shape:new', {shape: shape});
            if (latlng) this.newPointForward(latlng);
        },

        deleteShape: function (shape, latlngs) {
            var e = {shape: shape};
            L.Editable.makeCancellable(e);
            // 🍂namespace Editable
            // 🍂section Shape events
            // 🍂event editable:shape:delete: CancelableShapeEvent
            // Fired before a new shape is deleted in a multi (Polygon or Polyline).
            this.fireAndForward('editable:shape:delete', e);
            if (e._cancelled) return;
            shape = this._deleteShape(shape, latlngs);
            if (this.ensureNotFlat) this.ensureNotFlat();  // Polygon.
            this.feature.setLatLngs(this.getLatLngs());  // Force bounds reset.
            this.refresh();
            this.reset();
            // 🍂namespace Editable
            // 🍂section Shape events
            // 🍂event editable:shape:deleted: ShapeEvent
            // Fired after a new shape is deleted in a multi (Polygon or Polyline).
            this.fireAndForward('editable:shape:deleted', {shape: shape});
            return shape;
        },

        _deleteShape: function (shape, latlngs) {
            latlngs = latlngs || this.getLatLngs();
            if (!latlngs.length) return;
            var self = this,
                inplaceDelete = function (latlngs, shape) {
                    // Called when deleting a flat latlngs
                    shape = latlngs.splice(0, Number.MAX_VALUE);
                    return shape;
                },
                spliceDelete = function (latlngs, shape) {
                    // Called when removing a latlngs inside an array
                    latlngs.splice(latlngs.indexOf(shape), 1);
                    if (!latlngs.length) self._deleteShape(latlngs);
                    return shape;
                };
            if (latlngs === shape) return inplaceDelete(latlngs, shape);
            for (var i = 0; i < latlngs.length; i++) {
                if (latlngs[i] === shape) return spliceDelete(latlngs, shape);
                else if (latlngs[i].indexOf(shape) !== -1) return spliceDelete(latlngs[i], shape);
            }
        },

        // 🍂namespace PathEditor
        // 🍂method deleteShapeAt(latlng: L.LatLng): Array
        // Remove a path shape at the given `latlng`.
        deleteShapeAt: function (latlng) {
            var shape = this.feature.shapeAt(latlng);
            if (shape) return this.deleteShape(shape);
        },

        // 🍂method appendShape(shape: Array)
        // Append a new shape to the Polygon or Polyline.
        appendShape: function (shape) {
            this.insertShape(shape);
        },

        // 🍂method prependShape(shape: Array)
        // Prepend a new shape to the Polygon or Polyline.
        prependShape: function (shape) {
            this.insertShape(shape, 0);
        },

        // 🍂method insertShape(shape: Array, index: int)
        // Insert a new shape to the Polygon or Polyline at given index (default is to append).
        insertShape: function (shape, index) {
            this.ensureMulti();
            shape = this.formatShape(shape);
            if (typeof index === 'undefined') index = this.feature._latlngs.length;
            this.feature._latlngs.splice(index, 0, shape);
            this.feature.redraw();
            if (this._enabled) this.reset();
        },

        extendBounds: function (e) {
            this.feature._bounds.extend(e.vertex.latlng);
        },

        onDragStart: function (e) {
            this.editLayer.clearLayers();
            L.Editable.BaseEditor.prototype.onDragStart.call(this, e);
        },

        onDragEnd: function (e) {
            this.initVertexMarkers();
            L.Editable.BaseEditor.prototype.onDragEnd.call(this, e);
        }

    });

    // 🍂namespace Editable; 🍂class PolylineEditor; 🍂aka L.Editable.PolylineEditor
    // 🍂inherits PathEditor
    L.Editable.PolylineEditor = L.Editable.PathEditor.extend({

        startDrawingBackward: function () {
            this._drawing = L.Editable.BACKWARD;
            this.startDrawing();
        },

        // 🍂method continueBackward(latlngs?: Array)
        // Set up drawing tools to continue the line backward.
        continueBackward: function (latlngs) {
            if (this.drawing()) return;
            latlngs = latlngs || this.getDefaultLatLngs();
            this.setDrawnLatLngs(latlngs);
            if (latlngs.length > 0) {
                this.tools.attachBackwardLineGuide();
                this.tools.anchorBackwardLineGuide(latlngs[0]);
            }
            this.startDrawingBackward();
        },

        // 🍂method continueForward(latlngs?: Array)
        // Set up drawing tools to continue the line forward.
        continueForward: function (latlngs) {
            if (this.drawing()) return;
            latlngs = latlngs || this.getDefaultLatLngs();
            this.setDrawnLatLngs(latlngs);
            if (latlngs.length > 0) {
                this.tools.attachForwardLineGuide();
                this.tools.anchorForwardLineGuide(latlngs[latlngs.length - 1]);
            }
            this.startDrawingForward();
        },

        getDefaultLatLngs: function (latlngs) {
            latlngs = latlngs || this.feature._latlngs;
            if (!latlngs.length || latlngs[0] instanceof L.LatLng) return latlngs;
            else return this.getDefaultLatLngs(latlngs[0]);
        },

        ensureMulti: function () {
            if (this.feature._latlngs.length && L.Polyline._flat(this.feature._latlngs)) {
                this.feature._latlngs = [this.feature._latlngs];
            }
        },

        addNewEmptyShape: function () {
            if (this.feature._latlngs.length) {
                var shape = [];
                this.appendShape(shape);
                return shape;
            } else {
                return this.feature._latlngs;
            }
        },

        formatShape: function (shape) {
            if (L.Polyline._flat(shape)) return shape;
            else if (shape[0]) return this.formatShape(shape[0]);
        },

        // 🍂method splitShape(latlngs?: Array, index: int)
        // Split the given `latlngs` shape at index `index` and integrate new shape in instance `latlngs`.
        splitShape: function (shape, index) {
            if (!index || index >= shape.length - 1) return;
            this.ensureMulti();
            var shapeIndex = this.feature._latlngs.indexOf(shape);
            if (shapeIndex === -1) return;
            var first = shape.slice(0, index + 1),
                second = shape.slice(index);
            // We deal with reference, we don't want twice the same latlng around.
            second[0] = L.latLng(second[0].lat, second[0].lng, second[0].alt);
            this.feature._latlngs.splice(shapeIndex, 1, first, second);
            this.refresh();
            this.reset();
        }

    });

    // 🍂namespace Editable; 🍂class PolygonEditor; 🍂aka L.Editable.PolygonEditor
    // 🍂inherits PathEditor
    L.Editable.PolygonEditor = L.Editable.PathEditor.extend({

        CLOSED: true,
        MIN_VERTEX: 3,

        newPointForward: function (latlng) {
            L.Editable.PathEditor.prototype.newPointForward.call(this, latlng);
            if (!this.tools.backwardLineGuide._latlngs.length) this.tools.anchorBackwardLineGuide(latlng);
            if (this._drawnLatLngs.length === 2) this.tools.attachBackwardLineGuide();
        },

        addNewEmptyHole: function (latlng) {
            this.ensureNotFlat();
            var latlngs = this.feature.shapeAt(latlng);
            if (!latlngs) return;
            var holes = [];
            latlngs.push(holes);
            return holes;
        },

        // 🍂method newHole(latlng?: L.LatLng, index: int)
        // Set up drawing tools for creating a new hole on the Polygon. If the `latlng` param is given, a first point is created.
        newHole: function (latlng) {
            var holes = this.addNewEmptyHole(latlng);
            if (!holes) return;
            this.setDrawnLatLngs(holes);
            this.startDrawingForward();
            if (latlng) this.newPointForward(latlng);
        },

        addNewEmptyShape: function () {
            if (this.feature._latlngs.length && this.feature._latlngs[0].length) {
                var shape = [];
                this.appendShape(shape);
                return shape;
            } else {
                return this.feature._latlngs;
            }
        },

        ensureMulti: function () {
            if (this.feature._latlngs.length && L.Polyline._flat(this.feature._latlngs[0])) {
                this.feature._latlngs = [this.feature._latlngs];
            }
        },

        ensureNotFlat: function () {
            if (!this.feature._latlngs.length || L.Polyline._flat(this.feature._latlngs)) this.feature._latlngs = [this.feature._latlngs];
        },

        vertexCanBeDeleted: function (vertex) {
            var parent = this.feature.parentShape(vertex.latlngs),
                idx = L.Util.indexOf(parent, vertex.latlngs);
            if (idx > 0) return true;  // Holes can be totally deleted without removing the layer itself.
            return L.Editable.PathEditor.prototype.vertexCanBeDeleted.call(this, vertex);
        },

        getDefaultLatLngs: function () {
            if (!this.feature._latlngs.length) this.feature._latlngs.push([]);
            return this.feature._latlngs[0];
        },

        formatShape: function (shape) {
            // [[1, 2], [3, 4]] => must be nested
            // [] => must be nested
            // [[]] => is already nested
            if (L.Polyline._flat(shape) && (!shape[0] || shape[0].length !== 0)) return [shape];
            else return shape;
        }

    });

    // 🍂namespace Editable; 🍂class RectangleEditor; 🍂aka L.Editable.RectangleEditor
    // 🍂inherits PathEditor
    L.Editable.RectangleEditor = L.Editable.PathEditor.extend({

        CLOSED: true,
        MIN_VERTEX: 4,

        options: {
            skipMiddleMarkers: true
        },

        extendBounds: function (e) {
            var index = e.vertex.getIndex(),
                next = e.vertex.getNext(),
                previous = e.vertex.getPrevious(),
                oppositeIndex = (index + 2) % 4,
                opposite = e.vertex.latlngs[oppositeIndex],
                bounds = new L.LatLngBounds(e.latlng, opposite);
            // Update latlngs by hand to preserve order.
            previous.latlng.update([e.latlng.lat, opposite.lng]);
            next.latlng.update([opposite.lat, e.latlng.lng]);
            this.updateBounds(bounds);
            this.refreshVertexMarkers();
        },

        onDrawingMouseDown: function (e) {
            L.Editable.PathEditor.prototype.onDrawingMouseDown.call(this, e);
            this.connect();
            var latlngs = this.getDefaultLatLngs();
            // L.Polygon._convertLatLngs removes last latlng if it equals first point,
            // which is the case here as all latlngs are [0, 0]
            if (latlngs.length === 3) latlngs.push(e.latlng);
            var bounds = new L.LatLngBounds(e.latlng, e.latlng);
            this.updateBounds(bounds);
            this.updateLatLngs(bounds);
            this.refresh();
            this.reset();
            // Stop dragging map.
            // L.Draggable has two workflows:
            // - mousedown => mousemove => mouseup
            // - touchstart => touchmove => touchend
            // Problem: L.Map.Tap does not allow us to listen to touchstart, so we only
            // can deal with mousedown, but then when in a touch device, we are dealing with
            // simulated events (actually simulated by L.Map.Tap), which are no more taken
            // into account by L.Draggable.
            // Ref.: https://github.com/Leaflet/Leaflet.Editable/issues/103
            e.originalEvent._simulated = false;
            this.map.dragging._draggable._onUp(e.originalEvent);
            // Now transfer ongoing drag action to the bottom right corner.
            // Should we refine which corne will handle the drag according to
            // drag direction?
            latlngs[3].__vertex.dragging._draggable._onDown(e.originalEvent);
        },

        onDrawingMouseUp: function (e) {
            this.commitDrawing(e);
            e.originalEvent._simulated = false;
            L.Editable.PathEditor.prototype.onDrawingMouseUp.call(this, e);
        },

        onDrawingMouseMove: function (e) {
            e.originalEvent._simulated = false;
            L.Editable.PathEditor.prototype.onDrawingMouseMove.call(this, e);
        },


        getDefaultLatLngs: function (latlngs) {
            return latlngs || this.feature._latlngs[0];
        },

        updateBounds: function (bounds) {
            this.feature._bounds = bounds;
        },

        updateLatLngs: function (bounds) {
            var latlngs = this.getDefaultLatLngs(),
                newLatlngs = this.feature._boundsToLatLngs(bounds);
            // Keep references.
            for (var i = 0; i < latlngs.length; i++) {
                latlngs[i].update(newLatlngs[i]);
            }
        }

    });

    // 🍂namespace Editable; 🍂class CircleEditor; 🍂aka L.Editable.CircleEditor
    // 🍂inherits PathEditor
    L.Editable.CircleEditor = L.Editable.PathEditor.extend({

        MIN_VERTEX: 2,

        options: {
            skipMiddleMarkers: true
        },

        initialize: function (map, feature, options) {
            L.Editable.PathEditor.prototype.initialize.call(this, map, feature, options);
            this._resizeLatLng = this.computeResizeLatLng();
        },

        computeResizeLatLng: function () {
            // While circle is not added to the map, _radius is not set.
            var delta = (this.feature._radius || this.feature._mRadius) * Math.cos(Math.PI / 4),
                point = this.map.project(this.feature._latlng);
            return this.map.unproject([point.x + delta, point.y - delta]);
        },

        updateResizeLatLng: function () {
            this._resizeLatLng.update(this.computeResizeLatLng());
            this._resizeLatLng.__vertex.update();
        },

        getLatLngs: function () {
            return [this.feature._latlng, this._resizeLatLng];
        },

        getDefaultLatLngs: function () {
            return this.getLatLngs();
        },

        onVertexMarkerDrag: function (e) {
            if (e.vertex.getIndex() === 1) this.resize(e);
            else this.updateResizeLatLng(e);
            L.Editable.PathEditor.prototype.onVertexMarkerDrag.call(this, e);
        },

        resize: function (e) {
            var radius = this.feature._latlng.distanceTo(e.latlng)
            this.feature.setRadius(radius);
        },

        onDrawingMouseDown: function (e) {
            L.Editable.PathEditor.prototype.onDrawingMouseDown.call(this, e);
            this._resizeLatLng.update(e.latlng);
            this.feature._latlng.update(e.latlng);
            this.connect();
            // Stop dragging map.
            e.originalEvent._simulated = false;
            this.map.dragging._draggable._onUp(e.originalEvent);
            // Now transfer ongoing drag action to the radius handler.
            this._resizeLatLng.__vertex.dragging._draggable._onDown(e.originalEvent);
        },

        onDrawingMouseUp: function (e) {
            this.commitDrawing(e);
            e.originalEvent._simulated = false;
            L.Editable.PathEditor.prototype.onDrawingMouseUp.call(this, e);
        },

        onDrawingMouseMove: function (e) {
            e.originalEvent._simulated = false;
            L.Editable.PathEditor.prototype.onDrawingMouseMove.call(this, e);
        },

        onDrag: function (e) {
            L.Editable.PathEditor.prototype.onDrag.call(this, e);
            this.feature.dragging.updateLatLng(this._resizeLatLng);
        }

    });

    // 🍂namespace Editable; 🍂class EditableMixin
    // `EditableMixin` is included to `L.Polyline`, `L.Polygon`, `L.Rectangle`, `L.Circle`
    // and `L.Marker`. It adds some methods to them.
    // *When editing is enabled, the editor is accessible on the instance with the
    // `editor` property.*
    var EditableMixin = {

        createEditor: function (map) {
            map = map || this._map;
            var tools = (this.options.editOptions || {}).editTools || map.editTools;
            if (!tools) throw Error('Unable to detect Editable instance.')
            var Klass = this.options.editorClass || this.getEditorClass(tools);
            return new Klass(map, this, this.options.editOptions);
        },

        // 🍂method enableEdit(map?: L.Map): this.editor
        // Enable editing, by creating an editor if not existing, and then calling `enable` on it.
        enableEdit: function (map) {
            if (!this.editor) this.createEditor(map);
            this.editor.enable();
            return this.editor;
        },

        // 🍂method editEnabled(): boolean
        // Return true if current instance has an editor attached, and this editor is enabled.
        editEnabled: function () {
            return this.editor && this.editor.enabled();
        },

        // 🍂method disableEdit()
        // Disable editing, also remove the editor property reference.
        disableEdit: function () {
            if (this.editor) {
                this.editor.disable();
                delete this.editor;
            }
        },

        // 🍂method toggleEdit()
        // Enable or disable editing, according to current status.
        toggleEdit: function () {
            if (this.editEnabled()) this.disableEdit();
            else this.enableEdit();
        },

        _onEditableAdd: function () {
            if (this.editor) this.enableEdit();
        }

    };

    var PolylineMixin = {

        getEditorClass: function (tools) {
            return (tools && tools.options.polylineEditorClass) ? tools.options.polylineEditorClass : L.Editable.PolylineEditor;
        },

        shapeAt: function (latlng, latlngs) {
            // We can have those cases:
            // - latlngs are just a flat array of latlngs, use this
            // - latlngs is an array of arrays of latlngs, loop over
            var shape = null;
            latlngs = latlngs || this._latlngs;
            if (!latlngs.length) return shape;
            else if (L.Polyline._flat(latlngs) && this.isInLatLngs(latlng, latlngs)) shape = latlngs;
            else for (var i = 0; i < latlngs.length; i++) if (this.isInLatLngs(latlng, latlngs[i])) return latlngs[i];
            return shape;
        },

        isInLatLngs: function (l, latlngs) {
            if (!latlngs) return false;
            var i, k, len, part = [], p,
                w = this._clickTolerance();
            this._projectLatlngs(latlngs, part, this._pxBounds);
            part = part[0];
            p = this._map.latLngToLayerPoint(l);

            if (!this._pxBounds.contains(p)) { return false; }
            for (i = 1, len = part.length, k = 0; i < len; k = i++) {

                if (L.LineUtil.pointToSegmentDistance(p, part[k], part[i]) <= w) {
                    return true;
                }
            }
            return false;
        }

    };

    var PolygonMixin = {

        getEditorClass: function (tools) {
            return (tools && tools.options.polygonEditorClass) ? tools.options.polygonEditorClass : L.Editable.PolygonEditor;
        },

        shapeAt: function (latlng, latlngs) {
            // We can have those cases:
            // - latlngs are just a flat array of latlngs, use this
            // - latlngs is an array of arrays of latlngs, this is a simple polygon (maybe with holes), use the first
            // - latlngs is an array of arrays of arrays, this is a multi, loop over
            var shape = null;
            latlngs = latlngs || this._latlngs;
            if (!latlngs.length) return shape;
            else if (L.Polyline._flat(latlngs) && this.isInLatLngs(latlng, latlngs)) shape = latlngs;
            else if (L.Polyline._flat(latlngs[0]) && this.isInLatLngs(latlng, latlngs[0])) shape = latlngs;
            else for (var i = 0; i < latlngs.length; i++) if (this.isInLatLngs(latlng, latlngs[i][0])) return latlngs[i];
            return shape;
        },

        isInLatLngs: function (l, latlngs) {
            var inside = false, l1, l2, j, k, len2;

            for (j = 0, len2 = latlngs.length, k = len2 - 1; j < len2; k = j++) {
                l1 = latlngs[j];
                l2 = latlngs[k];

                if (((l1.lat > l.lat) !== (l2.lat > l.lat)) &&
                        (l.lng < (l2.lng - l1.lng) * (l.lat - l1.lat) / (l2.lat - l1.lat) + l1.lng)) {
                    inside = !inside;
                }
            }

            return inside;
        },

        parentShape: function (shape, latlngs) {
            latlngs = latlngs || this._latlngs;
            if (!latlngs) return;
            var idx = L.Util.indexOf(latlngs, shape);
            if (idx !== -1) return latlngs;
            for (var i = 0; i < latlngs.length; i++) {
                idx = L.Util.indexOf(latlngs[i], shape);
                if (idx !== -1) return latlngs[i];
            }
        }

    };


    var MarkerMixin = {

        getEditorClass: function (tools) {
            return (tools && tools.options.markerEditorClass) ? tools.options.markerEditorClass : L.Editable.MarkerEditor;
        }

    };

    var RectangleMixin = {

        getEditorClass: function (tools) {
            return (tools && tools.options.rectangleEditorClass) ? tools.options.rectangleEditorClass : L.Editable.RectangleEditor;
        }

    };

    var CircleMixin = {

        getEditorClass: function (tools) {
            return (tools && tools.options.circleEditorClass) ? tools.options.circleEditorClass : L.Editable.CircleEditor;
        }

    };

    var keepEditable = function () {
        // Make sure you can remove/readd an editable layer.
        this.on('add', this._onEditableAdd);
    };



    if (L.Polyline) {
        L.Polyline.include(EditableMixin);
        L.Polyline.include(PolylineMixin);
        L.Polyline.addInitHook(keepEditable);
    }
    if (L.Polygon) {
        L.Polygon.include(EditableMixin);
        L.Polygon.include(PolygonMixin);
    }
    if (L.Marker) {
        L.Marker.include(EditableMixin);
        L.Marker.include(MarkerMixin);
        L.Marker.addInitHook(keepEditable);
    }
    if (L.Rectangle) {
        L.Rectangle.include(EditableMixin);
        L.Rectangle.include(RectangleMixin);
    }
    if (L.Circle) {
        L.Circle.include(EditableMixin);
        L.Circle.include(CircleMixin);
    }

    L.LatLng.prototype.update = function (latlng) {
        latlng = L.latLng(latlng);
        this.lat = latlng.lat;
        this.lng = latlng.lng;
    }

}, window));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvTGVhZmxldC5FZGl0YWJsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24gKGZhY3RvcnksIHdpbmRvdykge1xuICAgIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSovXG5cbiAgICAvLyBkZWZpbmUgYW4gQU1EIG1vZHVsZSB0aGF0IHJlbGllcyBvbiAnbGVhZmxldCdcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbJ2xlYWZsZXQnXSwgZmFjdG9yeSk7XG5cblxuICAgIC8vIGRlZmluZSBhIENvbW1vbiBKUyBtb2R1bGUgdGhhdCByZWxpZXMgb24gJ2xlYWZsZXQnXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xlYWZsZXQnKSk7XG4gICAgfVxuXG4gICAgLy8gYXR0YWNoIHlvdXIgcGx1Z2luIHRvIHRoZSBnbG9iYWwgJ0wnIHZhcmlhYmxlXG4gICAgaWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lkwpe1xuICAgICAgICBmYWN0b3J5KHdpbmRvdy5MKTtcbiAgICB9XG5cbn0oZnVuY3Rpb24gKEwpIHtcbiAgICAvLyDwn42CbWluaWNsYXNzIENhbmNlbGFibGVFdmVudCAoRXZlbnQgb2JqZWN0cylcbiAgICAvLyDwn42CbWV0aG9kIGNhbmNlbCgpXG4gICAgLy8gQ2FuY2VsIGFueSBzdWJzZXF1ZW50IGFjdGlvbi5cblxuICAgIC8vIPCfjYJtaW5pY2xhc3MgVmVydGV4RXZlbnQgKEV2ZW50IG9iamVjdHMpXG4gICAgLy8g8J+NgnByb3BlcnR5IHZlcnRleDogVmVydGV4TWFya2VyXG4gICAgLy8gVGhlIHZlcnRleCB0aGF0IGZpcmVzIHRoZSBldmVudC5cblxuICAgIC8vIPCfjYJtaW5pY2xhc3MgU2hhcGVFdmVudCAoRXZlbnQgb2JqZWN0cylcbiAgICAvLyDwn42CcHJvcGVydHkgc2hhcGU6IEFycmF5XG4gICAgLy8gVGhlIHNoYXBlIChMYXRMbmdzIGFycmF5KSBzdWJqZWN0IG9mIHRoZSBhY3Rpb24uXG5cbiAgICAvLyDwn42CbWluaWNsYXNzIENhbmNlbGFibGVWZXJ0ZXhFdmVudCAoRXZlbnQgb2JqZWN0cylcbiAgICAvLyDwn42CaW5oZXJpdHMgVmVydGV4RXZlbnRcbiAgICAvLyDwn42CaW5oZXJpdHMgQ2FuY2VsYWJsZUV2ZW50XG5cbiAgICAvLyDwn42CbWluaWNsYXNzIENhbmNlbGFibGVTaGFwZUV2ZW50IChFdmVudCBvYmplY3RzKVxuICAgIC8vIPCfjYJpbmhlcml0cyBTaGFwZUV2ZW50XG4gICAgLy8g8J+NgmluaGVyaXRzIENhbmNlbGFibGVFdmVudFxuXG4gICAgLy8g8J+Ngm1pbmljbGFzcyBMYXllckV2ZW50IChFdmVudCBvYmplY3RzKVxuICAgIC8vIPCfjYJwcm9wZXJ0eSBsYXllcjogb2JqZWN0XG4gICAgLy8gVGhlIExheWVyIChNYXJrZXIsIFBvbHlsaW5l4oCmKSBzdWJqZWN0IG9mIHRoZSBhY3Rpb24uXG5cbiAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlOyDwn42CY2xhc3MgRWRpdGFibGU7IPCfjYJha2EgTC5FZGl0YWJsZVxuICAgIC8vIE1haW4gZWRpdGlvbiBoYW5kbGVyLiBCeSBkZWZhdWx0LCBpdCBpcyBhdHRhY2hlZCB0byB0aGUgbWFwXG4gICAgLy8gYXMgYG1hcC5lZGl0VG9vbHNgIHByb3BlcnR5LlxuICAgIC8vIExlYWZsZXQuRWRpdGFibGUgaXMgbWFkZSB0byBiZSBmdWxseSBleHRlbmRhYmxlLiBZb3UgaGF2ZSB0aHJlZSB3YXlzIHRvIGN1c3RvbWl6ZVxuICAgIC8vIHRoZSBiZWhhdmlvdXI6IHVzaW5nIG9wdGlvbnMsIGxpc3RlbmluZyB0byBldmVudHMsIG9yIGV4dGVuZGluZy5cbiAgICBMLkVkaXRhYmxlID0gTC5FdmVudGVkLmV4dGVuZCh7XG5cbiAgICAgICAgc3RhdGljczoge1xuICAgICAgICAgICAgRk9SV0FSRDogMSxcbiAgICAgICAgICAgIEJBQ0tXQVJEOiAtMVxuICAgICAgICB9LFxuXG4gICAgICAgIG9wdGlvbnM6IHtcblxuICAgICAgICAgICAgLy8gWW91IGNhbiBwYXNzIHRoZW0gd2hlbiBjcmVhdGluZyBhIG1hcCB1c2luZyB0aGUgYGVkaXRPcHRpb25zYCBrZXkuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIHpJbmRleDogaW50ID0gMTAwMFxuICAgICAgICAgICAgLy8gVGhlIGRlZmF1bHQgekluZGV4IG9mIHRoZSBlZGl0aW5nIHRvb2xzLlxuICAgICAgICAgICAgekluZGV4OiAxMDAwLFxuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIHBvbHlnb25DbGFzczogY2xhc3MgPSBMLlBvbHlnb25cbiAgICAgICAgICAgIC8vIENsYXNzIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhIG5ldyBQb2x5Z29uLlxuICAgICAgICAgICAgcG9seWdvbkNsYXNzOiBMLlBvbHlnb24sXG5cbiAgICAgICAgICAgIC8vIPCfjYJvcHRpb24gcG9seWxpbmVDbGFzczogY2xhc3MgPSBMLlBvbHlsaW5lXG4gICAgICAgICAgICAvLyBDbGFzcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBuZXcgUG9seWxpbmUuXG4gICAgICAgICAgICBwb2x5bGluZUNsYXNzOiBMLlBvbHlsaW5lLFxuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIG1hcmtlckNsYXNzOiBjbGFzcyA9IEwuTWFya2VyXG4gICAgICAgICAgICAvLyBDbGFzcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBuZXcgTWFya2VyLlxuICAgICAgICAgICAgbWFya2VyQ2xhc3M6IEwuTWFya2VyLFxuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIHJlY3RhbmdsZUNsYXNzOiBjbGFzcyA9IEwuUmVjdGFuZ2xlXG4gICAgICAgICAgICAvLyBDbGFzcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBuZXcgUmVjdGFuZ2xlLlxuICAgICAgICAgICAgcmVjdGFuZ2xlQ2xhc3M6IEwuUmVjdGFuZ2xlLFxuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIGNpcmNsZUNsYXNzOiBjbGFzcyA9IEwuQ2lyY2xlXG4gICAgICAgICAgICAvLyBDbGFzcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBuZXcgQ2lyY2xlLlxuICAgICAgICAgICAgY2lyY2xlQ2xhc3M6IEwuQ2lyY2xlLFxuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIGRyYXdpbmdDU1NDbGFzczogc3RyaW5nID0gJ2xlYWZsZXQtZWRpdGFibGUtZHJhd2luZydcbiAgICAgICAgICAgIC8vIENTUyBjbGFzcyB0byBiZSBhZGRlZCB0byB0aGUgbWFwIGNvbnRhaW5lciB3aGlsZSBkcmF3aW5nLlxuICAgICAgICAgICAgZHJhd2luZ0NTU0NsYXNzOiAnbGVhZmxldC1lZGl0YWJsZS1kcmF3aW5nJyxcblxuICAgICAgICAgICAgLy8g8J+Ngm9wdGlvbiBkcmF3aW5nQ3Vyc29yOiBjb25zdCA9ICdjcm9zc2hhaXInXG4gICAgICAgICAgICAvLyBDdXJzb3IgbW9kZSBzZXQgdG8gdGhlIG1hcCB3aGlsZSBkcmF3aW5nLlxuICAgICAgICAgICAgZHJhd2luZ0N1cnNvcjogJ2Nyb3NzaGFpcicsXG5cbiAgICAgICAgICAgIC8vIPCfjYJvcHRpb24gZWRpdExheWVyOiBMYXllciA9IG5ldyBMLkxheWVyR3JvdXAoKVxuICAgICAgICAgICAgLy8gTGF5ZXIgdXNlZCB0byBzdG9yZSBlZGl0IHRvb2xzICh2ZXJ0ZXgsIGxpbmUgZ3VpZGXigKYpLlxuICAgICAgICAgICAgZWRpdExheWVyOiB1bmRlZmluZWQsXG5cbiAgICAgICAgICAgIC8vIPCfjYJvcHRpb24gZmVhdHVyZXNMYXllcjogTGF5ZXIgPSBuZXcgTC5MYXllckdyb3VwKClcbiAgICAgICAgICAgIC8vIERlZmF1bHQgbGF5ZXIgdXNlZCB0byBzdG9yZSBkcmF3biBmZWF0dXJlcyAoTWFya2VyLCBQb2x5bGluZeKApikuXG4gICAgICAgICAgICBmZWF0dXJlc0xheWVyOiB1bmRlZmluZWQsXG5cbiAgICAgICAgICAgIC8vIPCfjYJvcHRpb24gcG9seWxpbmVFZGl0b3JDbGFzczogY2xhc3MgPSBQb2x5bGluZUVkaXRvclxuICAgICAgICAgICAgLy8gQ2xhc3MgdG8gYmUgdXNlZCBhcyBQb2x5bGluZSBlZGl0b3IuXG4gICAgICAgICAgICBwb2x5bGluZUVkaXRvckNsYXNzOiB1bmRlZmluZWQsXG5cbiAgICAgICAgICAgIC8vIPCfjYJvcHRpb24gcG9seWdvbkVkaXRvckNsYXNzOiBjbGFzcyA9IFBvbHlnb25FZGl0b3JcbiAgICAgICAgICAgIC8vIENsYXNzIHRvIGJlIHVzZWQgYXMgUG9seWdvbiBlZGl0b3IuXG4gICAgICAgICAgICBwb2x5Z29uRWRpdG9yQ2xhc3M6IHVuZGVmaW5lZCxcblxuICAgICAgICAgICAgLy8g8J+Ngm9wdGlvbiBtYXJrZXJFZGl0b3JDbGFzczogY2xhc3MgPSBNYXJrZXJFZGl0b3JcbiAgICAgICAgICAgIC8vIENsYXNzIHRvIGJlIHVzZWQgYXMgTWFya2VyIGVkaXRvci5cbiAgICAgICAgICAgIG1hcmtlckVkaXRvckNsYXNzOiB1bmRlZmluZWQsXG5cbiAgICAgICAgICAgIC8vIPCfjYJvcHRpb24gcmVjdGFuZ2xlRWRpdG9yQ2xhc3M6IGNsYXNzID0gUmVjdGFuZ2xlRWRpdG9yXG4gICAgICAgICAgICAvLyBDbGFzcyB0byBiZSB1c2VkIGFzIFJlY3RhbmdsZSBlZGl0b3IuXG4gICAgICAgICAgICByZWN0YW5nbGVFZGl0b3JDbGFzczogdW5kZWZpbmVkLFxuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIGNpcmNsZUVkaXRvckNsYXNzOiBjbGFzcyA9IENpcmNsZUVkaXRvclxuICAgICAgICAgICAgLy8gQ2xhc3MgdG8gYmUgdXNlZCBhcyBDaXJjbGUgZWRpdG9yLlxuICAgICAgICAgICAgY2lyY2xlRWRpdG9yQ2xhc3M6IHVuZGVmaW5lZCxcblxuICAgICAgICAgICAgLy8g8J+Ngm9wdGlvbiBsaW5lR3VpZGVPcHRpb25zOiBoYXNoID0ge31cbiAgICAgICAgICAgIC8vIE9wdGlvbnMgdG8gYmUgcGFzc2VkIHRvIHRoZSBsaW5lIGd1aWRlcy5cbiAgICAgICAgICAgIGxpbmVHdWlkZU9wdGlvbnM6IHt9LFxuXG4gICAgICAgICAgICAvLyDwn42Cb3B0aW9uIHNraXBNaWRkbGVNYXJrZXJzOiBib29sZWFuID0gZmFsc2VcbiAgICAgICAgICAgIC8vIFNldCB0aGlzIHRvIHRydWUgaWYgeW91IGRvbid0IHdhbnQgbWlkZGxlIG1hcmtlcnMuXG4gICAgICAgICAgICBza2lwTWlkZGxlTWFya2VyczogZmFsc2VcblxuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChtYXAsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RaSW5kZXggPSB0aGlzLm9wdGlvbnMuekluZGV4O1xuICAgICAgICAgICAgdGhpcy5tYXAgPSBtYXA7XG4gICAgICAgICAgICB0aGlzLmVkaXRMYXllciA9IHRoaXMuY3JlYXRlRWRpdExheWVyKCk7XG4gICAgICAgICAgICB0aGlzLmZlYXR1cmVzTGF5ZXIgPSB0aGlzLmNyZWF0ZUZlYXR1cmVzTGF5ZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZSA9IHRoaXMuY3JlYXRlTGluZUd1aWRlKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlID0gdGhpcy5jcmVhdGVMaW5lR3VpZGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaXJlQW5kRm9yd2FyZDogZnVuY3Rpb24gKHR5cGUsIGUpIHtcbiAgICAgICAgICAgIGUgPSBlIHx8IHt9O1xuICAgICAgICAgICAgZS5lZGl0VG9vbHMgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5maXJlKHR5cGUsIGUpO1xuICAgICAgICAgICAgdGhpcy5tYXAuZmlyZSh0eXBlLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVMaW5lR3VpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gTC5leHRlbmQoe2Rhc2hBcnJheTogJzUsMTAnLCB3ZWlnaHQ6IDEsIGludGVyYWN0aXZlOiBmYWxzZX0sIHRoaXMub3B0aW9ucy5saW5lR3VpZGVPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBMLnBvbHlsaW5lKFtdLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVWZXJ0ZXhJY29uOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIEwuQnJvd3Nlci50b3VjaCA/IG5ldyBMLkVkaXRhYmxlLlRvdWNoVmVydGV4SWNvbihvcHRpb25zKSA6IG5ldyBMLkVkaXRhYmxlLlZlcnRleEljb24ob3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlRWRpdExheWVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmVkaXRMYXllciB8fCBuZXcgTC5MYXllckdyb3VwKCkuYWRkVG8odGhpcy5tYXApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUZlYXR1cmVzTGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZmVhdHVyZXNMYXllciB8fCBuZXcgTC5MYXllckdyb3VwKCkuYWRkVG8odGhpcy5tYXApO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1vdmVGb3J3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5mb3J3YXJkTGluZUd1aWRlLl9sYXRsbmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZS5fbGF0bG5nc1sxXSA9IGxhdGxuZztcbiAgICAgICAgICAgICAgICB0aGlzLmZvcndhcmRMaW5lR3VpZGUuX2JvdW5kcy5leHRlbmQobGF0bG5nKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcndhcmRMaW5lR3VpZGUucmVkcmF3KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW92ZUJhY2t3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5iYWNrd2FyZExpbmVHdWlkZS5fbGF0bG5ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLl9sYXRsbmdzWzFdID0gbGF0bG5nO1xuICAgICAgICAgICAgICAgIHRoaXMuYmFja3dhcmRMaW5lR3VpZGUuX2JvdW5kcy5leHRlbmQobGF0bG5nKTtcbiAgICAgICAgICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLnJlZHJhdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFuY2hvckZvcndhcmRMaW5lR3VpZGU6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZS5fbGF0bG5nc1swXSA9IGxhdGxuZztcbiAgICAgICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZS5fYm91bmRzLmV4dGVuZChsYXRsbmcpO1xuICAgICAgICAgICAgdGhpcy5mb3J3YXJkTGluZUd1aWRlLnJlZHJhdygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFuY2hvckJhY2t3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLl9sYXRsbmdzWzBdID0gbGF0bG5nO1xuICAgICAgICAgICAgdGhpcy5iYWNrd2FyZExpbmVHdWlkZS5fYm91bmRzLmV4dGVuZChsYXRsbmcpO1xuICAgICAgICAgICAgdGhpcy5iYWNrd2FyZExpbmVHdWlkZS5yZWRyYXcoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhdHRhY2hGb3J3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRMYXllci5hZGRMYXllcih0aGlzLmZvcndhcmRMaW5lR3VpZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGF0dGFjaEJhY2t3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRMYXllci5hZGRMYXllcih0aGlzLmJhY2t3YXJkTGluZUd1aWRlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRhY2hGb3J3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmZvcndhcmRMaW5lR3VpZGUuc2V0TGF0TG5ncyhbXSk7XG4gICAgICAgICAgICB0aGlzLmVkaXRMYXllci5yZW1vdmVMYXllcih0aGlzLmZvcndhcmRMaW5lR3VpZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRldGFjaEJhY2t3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLnNldExhdExuZ3MoW10pO1xuICAgICAgICAgICAgdGhpcy5lZGl0TGF5ZXIucmVtb3ZlTGF5ZXIodGhpcy5iYWNrd2FyZExpbmVHdWlkZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYmxvY2tFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIEhhY2s6IGZvcmNlIG1hcCBub3QgdG8gbGlzdGVuIHRvIG90aGVyIGxheWVycyBldmVudHMgd2hpbGUgZHJhd2luZy5cbiAgICAgICAgICAgIGlmICghdGhpcy5fb2xkVGFyZ2V0cykge1xuICAgICAgICAgICAgICAgIHRoaXMuX29sZFRhcmdldHMgPSB0aGlzLm1hcC5fdGFyZ2V0cztcbiAgICAgICAgICAgICAgICB0aGlzLm1hcC5fdGFyZ2V0cyA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHVuYmxvY2tFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9vbGRUYXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVzZXQsIGJ1dCBrZWVwIHRhcmdldHMgY3JlYXRlZCB3aGlsZSBkcmF3aW5nLlxuICAgICAgICAgICAgICAgIHRoaXMubWFwLl90YXJnZXRzID0gTC5leHRlbmQodGhpcy5tYXAuX3RhcmdldHMsIHRoaXMuX29sZFRhcmdldHMpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9vbGRUYXJnZXRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlZ2lzdGVyRm9yRHJhd2luZzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RyYXdpbmdFZGl0b3IpIHRoaXMudW5yZWdpc3RlckZvckRyYXdpbmcodGhpcy5fZHJhd2luZ0VkaXRvcik7XG4gICAgICAgICAgICB0aGlzLmJsb2NrRXZlbnRzKCk7XG4gICAgICAgICAgICBlZGl0b3IucmVzZXQoKTsgIC8vIE1ha2Ugc3VyZSBlZGl0b3IgdG9vbHMgc3RpbGwgcmVjZWl2ZSBldmVudHMuXG4gICAgICAgICAgICB0aGlzLl9kcmF3aW5nRWRpdG9yID0gZWRpdG9yO1xuICAgICAgICAgICAgdGhpcy5tYXAub24oJ21vdXNlbW92ZSB0b3VjaG1vdmUnLCBlZGl0b3Iub25EcmF3aW5nTW91c2VNb3ZlLCBlZGl0b3IpO1xuICAgICAgICAgICAgdGhpcy5tYXAub24oJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZWRvd24sIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5tYXAub24oJ21vdXNldXAnLCB0aGlzLm9uTW91c2V1cCwgdGhpcyk7XG4gICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5tYXAuX2NvbnRhaW5lciwgdGhpcy5vcHRpb25zLmRyYXdpbmdDU1NDbGFzcyk7XG4gICAgICAgICAgICB0aGlzLmRlZmF1bHRNYXBDdXJzb3IgPSB0aGlzLm1hcC5fY29udGFpbmVyLnN0eWxlLmN1cnNvcjtcbiAgICAgICAgICAgIHRoaXMubWFwLl9jb250YWluZXIuc3R5bGUuY3Vyc29yID0gdGhpcy5vcHRpb25zLmRyYXdpbmdDdXJzb3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5yZWdpc3RlckZvckRyYXdpbmc6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgIHRoaXMudW5ibG9ja0V2ZW50cygpO1xuICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMubWFwLl9jb250YWluZXIsIHRoaXMub3B0aW9ucy5kcmF3aW5nQ1NTQ2xhc3MpO1xuICAgICAgICAgICAgdGhpcy5tYXAuX2NvbnRhaW5lci5zdHlsZS5jdXJzb3IgPSB0aGlzLmRlZmF1bHRNYXBDdXJzb3I7XG4gICAgICAgICAgICBlZGl0b3IgPSBlZGl0b3IgfHwgdGhpcy5fZHJhd2luZ0VkaXRvcjtcbiAgICAgICAgICAgIGlmICghZWRpdG9yKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLm1hcC5vZmYoJ21vdXNlbW92ZSB0b3VjaG1vdmUnLCBlZGl0b3Iub25EcmF3aW5nTW91c2VNb3ZlLCBlZGl0b3IpO1xuICAgICAgICAgICAgdGhpcy5tYXAub2ZmKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2Vkb3duLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMubWFwLm9mZignbW91c2V1cCcsIHRoaXMub25Nb3VzZXVwLCB0aGlzKTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IgIT09IHRoaXMuX2RyYXdpbmdFZGl0b3IpIHJldHVybjtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kcmF3aW5nRWRpdG9yO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5fZHJhd2luZykgZWRpdG9yLmNhbmNlbERyYXdpbmcoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlZG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHRoaXMuX21vdXNlRG93biA9IGU7XG4gICAgICAgICAgICB0aGlzLl9kcmF3aW5nRWRpdG9yLm9uRHJhd2luZ01vdXNlRG93bihlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNldXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbW91c2VEb3duKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVkaXRvciA9IHRoaXMuX2RyYXdpbmdFZGl0b3IsXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlRG93biA9IHRoaXMuX21vdXNlRG93bjtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3VzZURvd24gPSBudWxsO1xuICAgICAgICAgICAgICAgIGVkaXRvci5vbkRyYXdpbmdNb3VzZVVwKGUpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9kcmF3aW5nRWRpdG9yICE9PSBlZGl0b3IpIHJldHVybjsgIC8vIG9uRHJhd2luZ01vdXNlVXAgbWF5IGNhbGwgdW5yZWdpc3RlckZyb21EcmF3aW5nLlxuICAgICAgICAgICAgICAgIHZhciBvcmlnaW4gPSBMLnBvaW50KG1vdXNlRG93bi5vcmlnaW5hbEV2ZW50LmNsaWVudFgsIG1vdXNlRG93bi5vcmlnaW5hbEV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IEwucG9pbnQoZS5vcmlnaW5hbEV2ZW50LmNsaWVudFgsIGUub3JpZ2luYWxFdmVudC5jbGllbnRZKS5kaXN0YW5jZVRvKG9yaWdpbik7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGRpc3RhbmNlKSA8IDkgKiAod2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSkpIHRoaXMuX2RyYXdpbmdFZGl0b3Iub25EcmF3aW5nQ2xpY2soZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+NgnNlY3Rpb24gUHVibGljIG1ldGhvZHNcbiAgICAgICAgLy8gWW91IHdpbGwgZ2VuZXJhbGx5IGFjY2VzcyB0aGVtIGJ5IHRoZSBgbWFwLmVkaXRUb29sc2BcbiAgICAgICAgLy8gaW5zdGFuY2U6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGBtYXAuZWRpdFRvb2xzLnN0YXJ0UG9seWxpbmUoKTtgXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBkcmF3aW5nKCk6IGJvb2xlYW5cbiAgICAgICAgLy8gUmV0dXJuIHRydWUgaWYgYW55IGRyYXdpbmcgYWN0aW9uIGlzIG9uZ29pbmcuXG4gICAgICAgIGRyYXdpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kcmF3aW5nRWRpdG9yICYmIHRoaXMuX2RyYXdpbmdFZGl0b3IuZHJhd2luZygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2Qgc3RvcERyYXdpbmcoKVxuICAgICAgICAvLyBXaGVuIHlvdSBuZWVkIHRvIHN0b3AgYW55IG9uZ29pbmcgZHJhd2luZywgd2l0aG91dCBuZWVkaW5nIHRvIGtub3cgd2hpY2ggZWRpdG9yIGlzIGFjdGl2ZS5cbiAgICAgICAgc3RvcERyYXdpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudW5yZWdpc3RlckZvckRyYXdpbmcoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIGNvbW1pdERyYXdpbmcoKVxuICAgICAgICAvLyBXaGVuIHlvdSBuZWVkIHRvIGNvbW1pdCBhbnkgb25nb2luZyBkcmF3aW5nLCB3aXRob3V0IG5lZWRpbmcgdG8ga25vdyB3aGljaCBlZGl0b3IgaXMgYWN0aXZlLlxuICAgICAgICBjb21taXREcmF3aW5nOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9kcmF3aW5nRWRpdG9yKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLl9kcmF3aW5nRWRpdG9yLmNvbW1pdERyYXdpbmcoZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29ubmVjdENyZWF0ZWRUb01hcDogZnVuY3Rpb24gKGxheWVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mZWF0dXJlc0xheWVyLmFkZExheWVyKGxheWVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIHN0YXJ0UG9seWxpbmUobGF0bG5nOiBMLkxhdExuZywgb3B0aW9uczogaGFzaCk6IEwuUG9seWxpbmVcbiAgICAgICAgLy8gU3RhcnQgZHJhd2luZyBhIFBvbHlsaW5lLiBJZiBgbGF0bG5nYCBpcyBnaXZlbiwgYSBmaXJzdCBwb2ludCB3aWxsIGJlIGFkZGVkLiBJbiBhbnkgY2FzZSwgY29udGludWluZyBvbiB1c2VyIGNsaWNrLlxuICAgICAgICAvLyBJZiBgb3B0aW9uc2AgaXMgZ2l2ZW4sIGl0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBQb2x5bGluZSBjbGFzcyBjb25zdHJ1Y3Rvci5cbiAgICAgICAgc3RhcnRQb2x5bGluZTogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGxpbmUgPSB0aGlzLmNyZWF0ZVBvbHlsaW5lKFtdLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGxpbmUuZW5hYmxlRWRpdCh0aGlzLm1hcCkubmV3U2hhcGUobGF0bG5nKTtcbiAgICAgICAgICAgIHJldHVybiBsaW5lO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2Qgc3RhcnRQb2x5Z29uKGxhdGxuZzogTC5MYXRMbmcsIG9wdGlvbnM6IGhhc2gpOiBMLlBvbHlnb25cbiAgICAgICAgLy8gU3RhcnQgZHJhd2luZyBhIFBvbHlnb24uIElmIGBsYXRsbmdgIGlzIGdpdmVuLCBhIGZpcnN0IHBvaW50IHdpbGwgYmUgYWRkZWQuIEluIGFueSBjYXNlLCBjb250aW51aW5nIG9uIHVzZXIgY2xpY2suXG4gICAgICAgIC8vIElmIGBvcHRpb25zYCBpcyBnaXZlbiwgaXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIFBvbHlnb24gY2xhc3MgY29uc3RydWN0b3IuXG4gICAgICAgIHN0YXJ0UG9seWdvbjogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBvbHlnb24gPSB0aGlzLmNyZWF0ZVBvbHlnb24oW10sIG9wdGlvbnMpO1xuICAgICAgICAgICAgcG9seWdvbi5lbmFibGVFZGl0KHRoaXMubWFwKS5uZXdTaGFwZShsYXRsbmcpO1xuICAgICAgICAgICAgcmV0dXJuIHBvbHlnb247XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBzdGFydE1hcmtlcihsYXRsbmc6IEwuTGF0TG5nLCBvcHRpb25zOiBoYXNoKTogTC5NYXJrZXJcbiAgICAgICAgLy8gU3RhcnQgYWRkaW5nIGEgTWFya2VyLiBJZiBgbGF0bG5nYCBpcyBnaXZlbiwgdGhlIE1hcmtlciB3aWxsIGJlIHNob3duIGZpcnN0IGF0IHRoaXMgcG9pbnQuXG4gICAgICAgIC8vIEluIGFueSBjYXNlLCBpdCB3aWxsIGZvbGxvdyB0aGUgdXNlciBtb3VzZSwgYW5kIHdpbGwgaGF2ZSBhIGZpbmFsIGBsYXRsbmdgIG9uIG5leHQgY2xpY2sgKG9yIHRvdWNoKS5cbiAgICAgICAgLy8gSWYgYG9wdGlvbnNgIGlzIGdpdmVuLCBpdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgTWFya2VyIGNsYXNzIGNvbnN0cnVjdG9yLlxuICAgICAgICBzdGFydE1hcmtlcjogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xuICAgICAgICAgICAgbGF0bG5nID0gbGF0bG5nIHx8IHRoaXMubWFwLmdldENlbnRlcigpLmNsb25lKCk7XG4gICAgICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5jcmVhdGVNYXJrZXIobGF0bG5nLCBvcHRpb25zKTtcbiAgICAgICAgICAgIG1hcmtlci5lbmFibGVFZGl0KHRoaXMubWFwKS5zdGFydERyYXdpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBzdGFydFJlY3RhbmdsZShsYXRsbmc6IEwuTGF0TG5nLCBvcHRpb25zOiBoYXNoKTogTC5SZWN0YW5nbGVcbiAgICAgICAgLy8gU3RhcnQgZHJhd2luZyBhIFJlY3RhbmdsZS4gSWYgYGxhdGxuZ2AgaXMgZ2l2ZW4sIHRoZSBSZWN0YW5nbGUgYW5jaG9yIHdpbGwgYmUgYWRkZWQuIEluIGFueSBjYXNlLCBjb250aW51aW5nIG9uIHVzZXIgZHJhZy5cbiAgICAgICAgLy8gSWYgYG9wdGlvbnNgIGlzIGdpdmVuLCBpdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgUmVjdGFuZ2xlIGNsYXNzIGNvbnN0cnVjdG9yLlxuICAgICAgICBzdGFydFJlY3RhbmdsZTogZnVuY3Rpb24obGF0bG5nLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY29ybmVyID0gbGF0bG5nIHx8IEwubGF0TG5nKFswLCAwXSk7XG4gICAgICAgICAgICB2YXIgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKGNvcm5lciwgY29ybmVyKTtcbiAgICAgICAgICAgIHZhciByZWN0YW5nbGUgPSB0aGlzLmNyZWF0ZVJlY3RhbmdsZShib3VuZHMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmVjdGFuZ2xlLmVuYWJsZUVkaXQodGhpcy5tYXApLnN0YXJ0RHJhd2luZygpO1xuICAgICAgICAgICAgcmV0dXJuIHJlY3RhbmdsZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIHN0YXJ0Q2lyY2xlKGxhdGxuZzogTC5MYXRMbmcsIG9wdGlvbnM6IGhhc2gpOiBMLkNpcmNsZVxuICAgICAgICAvLyBTdGFydCBkcmF3aW5nIGEgQ2lyY2xlLiBJZiBgbGF0bG5nYCBpcyBnaXZlbiwgdGhlIENpcmNsZSBhbmNob3Igd2lsbCBiZSBhZGRlZC4gSW4gYW55IGNhc2UsIGNvbnRpbnVpbmcgb24gdXNlciBkcmFnLlxuICAgICAgICAvLyBJZiBgb3B0aW9uc2AgaXMgZ2l2ZW4sIGl0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBDaXJjbGUgY2xhc3MgY29uc3RydWN0b3IuXG4gICAgICAgIHN0YXJ0Q2lyY2xlOiBmdW5jdGlvbiAobGF0bG5nLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBsYXRsbmcgPSBsYXRsbmcgfHwgdGhpcy5tYXAuZ2V0Q2VudGVyKCkuY2xvbmUoKTtcbiAgICAgICAgICAgIHZhciBjaXJjbGUgPSB0aGlzLmNyZWF0ZUNpcmNsZShsYXRsbmcsIG9wdGlvbnMpO1xuICAgICAgICAgICAgY2lyY2xlLmVuYWJsZUVkaXQodGhpcy5tYXApLnN0YXJ0RHJhd2luZygpO1xuICAgICAgICAgICAgcmV0dXJuIGNpcmNsZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdGFydEhvbGU6IGZ1bmN0aW9uIChlZGl0b3IsIGxhdGxuZykge1xuICAgICAgICAgICAgZWRpdG9yLm5ld0hvbGUobGF0bG5nKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVMYXllcjogZnVuY3Rpb24gKGtsYXNzLCBsYXRsbmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gTC5VdGlsLmV4dGVuZCh7ZWRpdE9wdGlvbnM6IHtlZGl0VG9vbHM6IHRoaXN9fSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSBuZXcga2xhc3MobGF0bG5ncywgb3B0aW9ucyk7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6Y3JlYXRlZDogTGF5ZXJFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIG5ldyBmZWF0dXJlIChNYXJrZXIsIFBvbHlsaW5l4oCmKSBpcyBjcmVhdGVkLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6Y3JlYXRlZCcsIHtsYXllcjogbGF5ZXJ9KTtcbiAgICAgICAgICAgIHJldHVybiBsYXllcjtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVQb2x5bGluZTogZnVuY3Rpb24gKGxhdGxuZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUxheWVyKG9wdGlvbnMgJiYgb3B0aW9ucy5wb2x5bGluZUNsYXNzIHx8IHRoaXMub3B0aW9ucy5wb2x5bGluZUNsYXNzLCBsYXRsbmdzLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVQb2x5Z29uOiBmdW5jdGlvbiAobGF0bG5ncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTGF5ZXIob3B0aW9ucyAmJiBvcHRpb25zLnBvbHlnb25DbGFzcyB8fCB0aGlzLm9wdGlvbnMucG9seWdvbkNsYXNzLCBsYXRsbmdzLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVNYXJrZXI6IGZ1bmN0aW9uIChsYXRsbmcsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUxheWVyKG9wdGlvbnMgJiYgb3B0aW9ucy5tYXJrZXJDbGFzcyB8fCB0aGlzLm9wdGlvbnMubWFya2VyQ2xhc3MsIGxhdGxuZywgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlUmVjdGFuZ2xlOiBmdW5jdGlvbiAoYm91bmRzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVMYXllcihvcHRpb25zICYmIG9wdGlvbnMucmVjdGFuZ2xlQ2xhc3MgfHwgdGhpcy5vcHRpb25zLnJlY3RhbmdsZUNsYXNzLCBib3VuZHMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUNpcmNsZTogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTGF5ZXIob3B0aW9ucyAmJiBvcHRpb25zLmNpcmNsZUNsYXNzIHx8IHRoaXMub3B0aW9ucy5jaXJjbGVDbGFzcywgbGF0bG5nLCBvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBMLmV4dGVuZChMLkVkaXRhYmxlLCB7XG5cbiAgICAgICAgbWFrZUNhbmNlbGxhYmxlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZS5fY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8g8J+Ngm5hbWVzcGFjZSBNYXA7IPCfjYJjbGFzcyBNYXBcbiAgICAvLyBMZWFmbGV0LkVkaXRhYmxlIGFkZCBvcHRpb25zIGFuZCBldmVudHMgdG8gdGhlIGBMLk1hcGAgb2JqZWN0LlxuICAgIC8vIFNlZSBgRWRpdGFibGVgIGV2ZW50cyBmb3IgdGhlIGxpc3Qgb2YgZXZlbnRzIGZpcmVkIG9uIHRoZSBNYXAuXG4gICAgLy8g8J+NgmV4YW1wbGVcbiAgICAvL1xuICAgIC8vIGBgYGpzXG4gICAgLy8gdmFyIG1hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgLy8gIGVkaXRhYmxlOiB0cnVlLFxuICAgIC8vICBlZGl0T3B0aW9uczoge1xuICAgIC8vICAgIOKAplxuICAgIC8vIH1cbiAgICAvLyB9KTtcbiAgICAvLyBgYGBcbiAgICAvLyDwn42Cc2VjdGlvbiBFZGl0YWJsZSBNYXAgT3B0aW9uc1xuICAgIEwuTWFwLm1lcmdlT3B0aW9ucyh7XG5cbiAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBNYXBcbiAgICAgICAgLy8g8J+NgnNlY3Rpb24gTWFwIE9wdGlvbnNcbiAgICAgICAgLy8g8J+Ngm9wdGlvbiBlZGl0VG9vbHNDbGFzczogY2xhc3MgPSBMLkVkaXRhYmxlXG4gICAgICAgIC8vIENsYXNzIHRvIGJlIHVzZWQgYXMgdmVydGV4LCBmb3IgcGF0aCBlZGl0aW5nLlxuICAgICAgICBlZGl0VG9vbHNDbGFzczogTC5FZGl0YWJsZSxcblxuICAgICAgICAvLyDwn42Cb3B0aW9uIGVkaXRhYmxlOiBib29sZWFuID0gZmFsc2VcbiAgICAgICAgLy8gV2hldGhlciB0byBjcmVhdGUgYSBMLkVkaXRhYmxlIGluc3RhbmNlIGF0IG1hcCBpbml0LlxuICAgICAgICBlZGl0YWJsZTogZmFsc2UsXG5cbiAgICAgICAgLy8g8J+Ngm9wdGlvbiBlZGl0T3B0aW9uczogaGFzaCA9IHt9XG4gICAgICAgIC8vIE9wdGlvbnMgdG8gcGFzcyB0byBMLkVkaXRhYmxlIHdoZW4gaW5zdGFuY2lhdGluZy5cbiAgICAgICAgZWRpdE9wdGlvbnM6IHt9XG5cbiAgICB9KTtcblxuICAgIEwuTWFwLmFkZEluaXRIb29rKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB0aGlzLndoZW5SZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmVkaXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0VG9vbHMgPSBuZXcgdGhpcy5vcHRpb25zLmVkaXRUb29sc0NsYXNzKHRoaXMsIHRoaXMub3B0aW9ucy5lZGl0T3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBMLkVkaXRhYmxlLlZlcnRleEljb24gPSBMLkRpdkljb24uZXh0ZW5kKHtcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBpY29uU2l6ZTogbmV3IEwuUG9pbnQoOCwgOClcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBMLkVkaXRhYmxlLlRvdWNoVmVydGV4SWNvbiA9IEwuRWRpdGFibGUuVmVydGV4SWNvbi5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGljb25TaXplOiBuZXcgTC5Qb2ludCg4LCA4KVxuICAgICAgICB9XG5cbiAgICB9KTtcblxuXG4gICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZTsg8J+NgmNsYXNzIFZlcnRleE1hcmtlcjsgSGFuZGxlciBmb3IgZHJhZ2dpbmcgcGF0aCB2ZXJ0aWNlcy5cbiAgICBMLkVkaXRhYmxlLlZlcnRleE1hcmtlciA9IEwuTWFya2VyLmV4dGVuZCh7XG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnbGVhZmxldC1kaXYtaWNvbiBsZWFmbGV0LXZlcnRleC1pY29uJ1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLy8g8J+NgnNlY3Rpb24gUHVibGljIG1ldGhvZHNcbiAgICAgICAgLy8gVGhlIG1hcmtlciB1c2VkIHRvIGhhbmRsZSBwYXRoIHZlcnRleC4gWW91IHdpbGwgdXN1YWxseSBpbnRlcmFjdCB3aXRoIGEgYFZlcnRleE1hcmtlcmBcbiAgICAgICAgLy8gaW5zdGFuY2Ugd2hlbiBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBsaWtlIGBlZGl0YWJsZTp2ZXJ0ZXg6Y3RybGNsaWNrYC5cblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAobGF0bG5nLCBsYXRsbmdzLCBlZGl0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIFdlIGRvbid0IHVzZSB0aGlzLl9sYXRsbmcsIGJlY2F1c2Ugb24gZHJhZyBMZWFmbGV0IHJlcGxhY2UgaXQgd2hpbGVcbiAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8ga2VlcCByZWZlcmVuY2UuXG4gICAgICAgICAgICB0aGlzLmxhdGxuZyA9IGxhdGxuZztcbiAgICAgICAgICAgIHRoaXMubGF0bG5ncyA9IGxhdGxuZ3M7XG4gICAgICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgICAgIEwuTWFya2VyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbGF0bG5nLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pY29uID0gdGhpcy5lZGl0b3IudG9vbHMuY3JlYXRlVmVydGV4SWNvbih7Y2xhc3NOYW1lOiB0aGlzLm9wdGlvbnMuY2xhc3NOYW1lfSk7XG4gICAgICAgICAgICB0aGlzLmxhdGxuZy5fX3ZlcnRleCA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5lZGl0TGF5ZXIuYWRkTGF5ZXIodGhpcyk7XG4gICAgICAgICAgICB0aGlzLnNldFpJbmRleE9mZnNldChlZGl0b3IudG9vbHMuX2xhc3RaSW5kZXggKyAxKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICAgICAgTC5NYXJrZXIucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcbiAgICAgICAgICAgIHRoaXMub24oJ2RyYWcnLCB0aGlzLm9uRHJhZyk7XG4gICAgICAgICAgICB0aGlzLm9uKCdkcmFnc3RhcnQnLCB0aGlzLm9uRHJhZ1N0YXJ0KTtcbiAgICAgICAgICAgIHRoaXMub24oJ2RyYWdlbmQnLCB0aGlzLm9uRHJhZ0VuZCk7XG4gICAgICAgICAgICB0aGlzLm9uKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNldXApO1xuICAgICAgICAgICAgdGhpcy5vbignY2xpY2snLCB0aGlzLm9uQ2xpY2spO1xuICAgICAgICAgICAgdGhpcy5vbignY29udGV4dG1lbnUnLCB0aGlzLm9uQ29udGV4dE1lbnUpO1xuICAgICAgICAgICAgdGhpcy5vbignbW91c2Vkb3duIHRvdWNoc3RhcnQnLCB0aGlzLm9uTW91c2VEb3duKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTWlkZGxlTWFya2VycygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5taWRkbGVNYXJrZXIpIHRoaXMubWlkZGxlTWFya2VyLmRlbGV0ZSgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMubGF0bG5nLl9fdmVydGV4O1xuICAgICAgICAgICAgdGhpcy5vZmYoJ2RyYWcnLCB0aGlzLm9uRHJhZyk7XG4gICAgICAgICAgICB0aGlzLm9mZignZHJhZ3N0YXJ0JywgdGhpcy5vbkRyYWdTdGFydCk7XG4gICAgICAgICAgICB0aGlzLm9mZignZHJhZ2VuZCcsIHRoaXMub25EcmFnRW5kKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNldXApO1xuICAgICAgICAgICAgdGhpcy5vZmYoJ2NsaWNrJywgdGhpcy5vbkNsaWNrKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKCdjb250ZXh0bWVudScsIHRoaXMub25Db250ZXh0TWVudSk7XG4gICAgICAgICAgICB0aGlzLm9mZignbW91c2Vkb3duIHRvdWNoc3RhcnQnLCB0aGlzLm9uTW91c2VEb3duKTtcbiAgICAgICAgICAgIEwuTWFya2VyLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS52ZXJ0ZXggPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3Iub25WZXJ0ZXhNYXJrZXJEcmFnKGUpO1xuICAgICAgICAgICAgdmFyIGljb25Qb3MgPSBMLkRvbVV0aWwuZ2V0UG9zaXRpb24odGhpcy5faWNvbiksXG4gICAgICAgICAgICAgICAgbGF0bG5nID0gdGhpcy5fbWFwLmxheWVyUG9pbnRUb0xhdExuZyhpY29uUG9zKTtcbiAgICAgICAgICAgIHRoaXMubGF0bG5nLnVwZGF0ZShsYXRsbmcpO1xuICAgICAgICAgICAgdGhpcy5fbGF0bG5nID0gdGhpcy5sYXRsbmc7ICAvLyBQdXNoIGJhY2sgdG8gTGVhZmxldCBvdXIgcmVmZXJlbmNlLlxuICAgICAgICAgICAgdGhpcy5lZGl0b3IucmVmcmVzaCgpO1xuICAgICAgICAgICAgaWYgKHRoaXMubWlkZGxlTWFya2VyKSB0aGlzLm1pZGRsZU1hcmtlci51cGRhdGVMYXRMbmcoKTtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gdGhpcy5nZXROZXh0KCk7XG4gICAgICAgICAgICBpZiAobmV4dCAmJiBuZXh0Lm1pZGRsZU1hcmtlcikgbmV4dC5taWRkbGVNYXJrZXIudXBkYXRlTGF0TG5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmFnU3RhcnQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnZlcnRleCA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5vblZlcnRleE1hcmtlckRyYWdTdGFydChlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkRyYWdFbmQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnZlcnRleCA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5vblZlcnRleE1hcmtlckRyYWdFbmQoZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUudmVydGV4ID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLm9uVmVydGV4TWFya2VyQ2xpY2soZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZXVwOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgTC5Eb21FdmVudC5zdG9wKGUpO1xuICAgICAgICAgICAgZS52ZXJ0ZXggPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IubWFwLmZpcmUoJ21vdXNldXAnLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkNvbnRleHRNZW51OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS52ZXJ0ZXggPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3Iub25WZXJ0ZXhNYXJrZXJDb250ZXh0TWVudShlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUudmVydGV4ID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLm9uVmVydGV4TWFya2VyTW91c2VEb3duKGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgZGVsZXRlKClcbiAgICAgICAgLy8gRGVsZXRlIGEgdmVydGV4IGFuZCB0aGUgcmVsYXRlZCBMYXRMbmcuXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSB0aGlzLmdldE5leHQoKTsgIC8vIENvbXB1dGUgYmVmb3JlIGNoYW5naW5nIGxhdGxuZ1xuICAgICAgICAgICAgdGhpcy5sYXRsbmdzLnNwbGljZSh0aGlzLmdldEluZGV4KCksIDEpO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IuZWRpdExheWVyLnJlbW92ZUxheWVyKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3Iub25WZXJ0ZXhEZWxldGVkKHtsYXRsbmc6IHRoaXMubGF0bG5nLCB2ZXJ0ZXg6IHRoaXN9KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5sYXRsbmdzLmxlbmd0aCkgdGhpcy5lZGl0b3IuZGVsZXRlU2hhcGUodGhpcy5sYXRsbmdzKTtcbiAgICAgICAgICAgIGlmIChuZXh0KSBuZXh0LnJlc2V0TWlkZGxlTWFya2VyKCk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5yZWZyZXNoKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBnZXRJbmRleCgpOiBpbnRcbiAgICAgICAgLy8gR2V0IHRoZSBpbmRleCBvZiB0aGUgY3VycmVudCB2ZXJ0ZXggYW1vbmcgb3RoZXJzIG9mIHRoZSBzYW1lIExhdExuZ3MgZ3JvdXAuXG4gICAgICAgIGdldEluZGV4OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXRsbmdzLmluZGV4T2YodGhpcy5sYXRsbmcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgZ2V0TGFzdEluZGV4KCk6IGludFxuICAgICAgICAvLyBHZXQgbGFzdCB2ZXJ0ZXggaW5kZXggb2YgdGhlIExhdExuZ3MgZ3JvdXAgb2YgdGhlIGN1cnJlbnQgdmVydGV4LlxuICAgICAgICBnZXRMYXN0SW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhdGxuZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIGdldFByZXZpb3VzKCk6IFZlcnRleE1hcmtlclxuICAgICAgICAvLyBHZXQgdGhlIHByZXZpb3VzIFZlcnRleE1hcmtlciBpbiB0aGUgc2FtZSBMYXRMbmdzIGdyb3VwLlxuICAgICAgICBnZXRQcmV2aW91czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubGF0bG5ncy5sZW5ndGggPCAyKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldEluZGV4KCksXG4gICAgICAgICAgICAgICAgcHJldmlvdXNJbmRleCA9IGluZGV4IC0gMTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMCAmJiB0aGlzLmVkaXRvci5DTE9TRUQpIHByZXZpb3VzSW5kZXggPSB0aGlzLmdldExhc3RJbmRleCgpO1xuICAgICAgICAgICAgdmFyIHByZXZpb3VzID0gdGhpcy5sYXRsbmdzW3ByZXZpb3VzSW5kZXhdO1xuICAgICAgICAgICAgaWYgKHByZXZpb3VzKSByZXR1cm4gcHJldmlvdXMuX192ZXJ0ZXg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBnZXROZXh0KCk6IFZlcnRleE1hcmtlclxuICAgICAgICAvLyBHZXQgdGhlIG5leHQgVmVydGV4TWFya2VyIGluIHRoZSBzYW1lIExhdExuZ3MgZ3JvdXAuXG4gICAgICAgIGdldE5leHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxhdGxuZ3MubGVuZ3RoIDwgMikgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXRJbmRleCgpLFxuICAgICAgICAgICAgICAgIG5leHRJbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5nZXRMYXN0SW5kZXgoKSAmJiB0aGlzLmVkaXRvci5DTE9TRUQpIG5leHRJbmRleCA9IDA7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMubGF0bG5nc1tuZXh0SW5kZXhdO1xuICAgICAgICAgICAgaWYgKG5leHQpIHJldHVybiBuZXh0Ll9fdmVydGV4O1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZE1pZGRsZU1hcmtlcjogZnVuY3Rpb24gKHByZXZpb3VzKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZWRpdG9yLmhhc01pZGRsZU1hcmtlcnMoKSkgcmV0dXJuO1xuICAgICAgICAgICAgcHJldmlvdXMgPSBwcmV2aW91cyB8fCB0aGlzLmdldFByZXZpb3VzKCk7XG4gICAgICAgICAgICBpZiAocHJldmlvdXMgJiYgIXRoaXMubWlkZGxlTWFya2VyKSB0aGlzLm1pZGRsZU1hcmtlciA9IHRoaXMuZWRpdG9yLmFkZE1pZGRsZU1hcmtlcihwcmV2aW91cywgdGhpcywgdGhpcy5sYXRsbmdzLCB0aGlzLmVkaXRvcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkTWlkZGxlTWFya2VyczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmVkaXRvci5oYXNNaWRkbGVNYXJrZXJzKCkpIHJldHVybjtcbiAgICAgICAgICAgIHZhciBwcmV2aW91cyA9IHRoaXMuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgICAgIGlmIChwcmV2aW91cykgdGhpcy5hZGRNaWRkbGVNYXJrZXIocHJldmlvdXMpO1xuICAgICAgICAgICAgdmFyIG5leHQgPSB0aGlzLmdldE5leHQoKTtcbiAgICAgICAgICAgIGlmIChuZXh0KSBuZXh0LnJlc2V0TWlkZGxlTWFya2VyKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzZXRNaWRkbGVNYXJrZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1pZGRsZU1hcmtlcikgdGhpcy5taWRkbGVNYXJrZXIuZGVsZXRlKCk7XG4gICAgICAgICAgICB0aGlzLmFkZE1pZGRsZU1hcmtlcigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2Qgc3BsaXQoKVxuICAgICAgICAvLyBTcGxpdCB0aGUgdmVydGV4IExhdExuZ3MgZ3JvdXAgYXQgaXRzIGluZGV4LCBpZiBwb3NzaWJsZS5cbiAgICAgICAgc3BsaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5lZGl0b3Iuc3BsaXRTaGFwZSkgcmV0dXJuOyAgLy8gT25seSBmb3IgUG9seWxpbmVFZGl0b3JcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLnNwbGl0U2hhcGUodGhpcy5sYXRsbmdzLCB0aGlzLmdldEluZGV4KCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgY29udGludWUoKVxuICAgICAgICAvLyBDb250aW51ZSB0aGUgdmVydGV4IExhdExuZ3MgZnJvbSB0aGlzIHZlcnRleC4gT25seSBhY3RpdmUgZm9yIGZpcnN0IGFuZCBsYXN0IHZlcnRpY2VzIG9mIGEgUG9seWxpbmUuXG4gICAgICAgIGNvbnRpbnVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZWRpdG9yLmNvbnRpbnVlQmFja3dhcmQpIHJldHVybjsgIC8vIE9ubHkgZm9yIFBvbHlsaW5lRWRpdG9yXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldEluZGV4KCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IDApIHRoaXMuZWRpdG9yLmNvbnRpbnVlQmFja3dhcmQodGhpcy5sYXRsbmdzKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4ID09PSB0aGlzLmdldExhc3RJbmRleCgpKSB0aGlzLmVkaXRvci5jb250aW51ZUZvcndhcmQodGhpcy5sYXRsbmdzKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBMLkVkaXRhYmxlLm1lcmdlT3B0aW9ucyh7XG5cbiAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAvLyDwn42Cb3B0aW9uIHZlcnRleE1hcmtlckNsYXNzOiBjbGFzcyA9IFZlcnRleE1hcmtlclxuICAgICAgICAvLyBDbGFzcyB0byBiZSB1c2VkIGFzIHZlcnRleCwgZm9yIHBhdGggZWRpdGluZy5cbiAgICAgICAgdmVydGV4TWFya2VyQ2xhc3M6IEwuRWRpdGFibGUuVmVydGV4TWFya2VyXG5cbiAgICB9KTtcblxuICAgIEwuRWRpdGFibGUuTWlkZGxlTWFya2VyID0gTC5NYXJrZXIuZXh0ZW5kKHtcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjUsXG4gICAgICAgICAgICBjbGFzc05hbWU6ICdsZWFmbGV0LWRpdi1pY29uIGxlYWZsZXQtbWlkZGxlLWljb24nLFxuICAgICAgICAgICAgZHJhZ2dhYmxlOiB0cnVlXG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxlZnQsIHJpZ2h0LCBsYXRsbmdzLCBlZGl0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgICAgIHRoaXMubGF0bG5ncyA9IGxhdGxuZ3M7XG4gICAgICAgICAgICBMLk1hcmtlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIHRoaXMuY29tcHV0ZUxhdExuZygpLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuX29wYWNpdHkgPSB0aGlzLm9wdGlvbnMub3BhY2l0eTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5pY29uID0gdGhpcy5lZGl0b3IudG9vbHMuY3JlYXRlVmVydGV4SWNvbih7Y2xhc3NOYW1lOiB0aGlzLm9wdGlvbnMuY2xhc3NOYW1lfSk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5lZGl0TGF5ZXIuYWRkTGF5ZXIodGhpcyk7XG4gICAgICAgICAgICB0aGlzLnNldFZpc2liaWxpdHkoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRWaXNpYmlsaXR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbGVmdFBvaW50ID0gdGhpcy5fbWFwLmxhdExuZ1RvQ29udGFpbmVyUG9pbnQodGhpcy5sZWZ0LmxhdGxuZyksXG4gICAgICAgICAgICAgICAgcmlnaHRQb2ludCA9IHRoaXMuX21hcC5sYXRMbmdUb0NvbnRhaW5lclBvaW50KHRoaXMucmlnaHQubGF0bG5nKSxcbiAgICAgICAgICAgICAgICBzaXplID0gTC5wb2ludCh0aGlzLm9wdGlvbnMuaWNvbi5vcHRpb25zLmljb25TaXplKTtcbiAgICAgICAgICAgIGlmIChsZWZ0UG9pbnQuZGlzdGFuY2VUbyhyaWdodFBvaW50KSA8IHNpemUueCAqIDMpIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgZWxzZSB0aGlzLnNob3coKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNldE9wYWNpdHkodGhpcy5fb3BhY2l0eSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlkZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5zZXRPcGFjaXR5KDApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUxhdExuZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5zZXRMYXRMbmcodGhpcy5jb21wdXRlTGF0TG5nKCkpO1xuICAgICAgICAgICAgdGhpcy5zZXRWaXNpYmlsaXR5KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29tcHV0ZUxhdExuZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxlZnRQb2ludCA9IHRoaXMuZWRpdG9yLm1hcC5sYXRMbmdUb0NvbnRhaW5lclBvaW50KHRoaXMubGVmdC5sYXRsbmcpLFxuICAgICAgICAgICAgICAgIHJpZ2h0UG9pbnQgPSB0aGlzLmVkaXRvci5tYXAubGF0TG5nVG9Db250YWluZXJQb2ludCh0aGlzLnJpZ2h0LmxhdGxuZyksXG4gICAgICAgICAgICAgICAgeSA9IChsZWZ0UG9pbnQueSArIHJpZ2h0UG9pbnQueSkgLyAyLFxuICAgICAgICAgICAgICAgIHggPSAobGVmdFBvaW50LnggKyByaWdodFBvaW50LngpIC8gMjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVkaXRvci5tYXAuY29udGFpbmVyUG9pbnRUb0xhdExuZyhbeCwgeV0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uQWRkOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgICAgICBMLk1hcmtlci5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xuICAgICAgICAgICAgTC5Eb21FdmVudC5vbih0aGlzLl9pY29uLCAnbW91c2Vkb3duIHRvdWNoc3RhcnQnLCB0aGlzLm9uTW91c2VEb3duLCB0aGlzKTtcbiAgICAgICAgICAgIG1hcC5vbignem9vbWVuZCcsIHRoaXMuc2V0VmlzaWJpbGl0eSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnJpZ2h0Lm1pZGRsZU1hcmtlcjtcbiAgICAgICAgICAgIEwuRG9tRXZlbnQub2ZmKHRoaXMuX2ljb24sICdtb3VzZWRvd24gdG91Y2hzdGFydCcsIHRoaXMub25Nb3VzZURvd24sIHRoaXMpO1xuICAgICAgICAgICAgbWFwLm9mZignem9vbWVuZCcsIHRoaXMuc2V0VmlzaWJpbGl0eSwgdGhpcyk7XG4gICAgICAgICAgICBMLk1hcmtlci5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VEb3duOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIGljb25Qb3MgPSBMLkRvbVV0aWwuZ2V0UG9zaXRpb24odGhpcy5faWNvbiksXG4gICAgICAgICAgICAgICAgbGF0bG5nID0gdGhpcy5lZGl0b3IubWFwLmxheWVyUG9pbnRUb0xhdExuZyhpY29uUG9zKTtcbiAgICAgICAgICAgIGUgPSB7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZSxcbiAgICAgICAgICAgICAgICBsYXRsbmc6IGxhdGxuZ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMub3BhY2l0eSA9PT0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5tYWtlQ2FuY2VsbGFibGUoZSk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5vbk1pZGRsZU1hcmtlck1vdXNlRG93bihlKTtcbiAgICAgICAgICAgIGlmIChlLl9jYW5jZWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMubGF0bG5ncy5zcGxpY2UodGhpcy5pbmRleCgpLCAwLCBlLmxhdGxuZyk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5yZWZyZXNoKCk7XG4gICAgICAgICAgICB2YXIgaWNvbiA9IHRoaXMuX2ljb247XG4gICAgICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5lZGl0b3IuYWRkVmVydGV4TWFya2VyKGUubGF0bG5nLCB0aGlzLmxhdGxuZ3MpO1xuICAgICAgICAgICAgLyogSGFjayB0byB3b3JrYXJvdW5kIGJyb3dzZXIgbm90IGZpcmluZyB0b3VjaGVuZCB3aGVuIGVsZW1lbnQgaXMgbm8gbW9yZSBvbiBET00gKi9cbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBtYXJrZXIuX2ljb24ucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChtYXJrZXIuX2ljb24pO1xuICAgICAgICAgICAgbWFya2VyLl9pY29uID0gaWNvbjtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChtYXJrZXIuX2ljb24pO1xuICAgICAgICAgICAgbWFya2VyLl9pbml0SWNvbigpO1xuICAgICAgICAgICAgbWFya2VyLl9pbml0SW50ZXJhY3Rpb24oKTtcbiAgICAgICAgICAgIG1hcmtlci5zZXRPcGFjaXR5KDEpO1xuICAgICAgICAgICAgLyogRW5kIGhhY2sgKi9cbiAgICAgICAgICAgIC8vIFRyYW5zZmVyIG9uZ29pbmcgZHJhZ2dpbmcgdG8gcmVhbCBtYXJrZXJcbiAgICAgICAgICAgIEwuRHJhZ2dhYmxlLl9kcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgbWFya2VyLmRyYWdnaW5nLl9kcmFnZ2FibGUuX29uRG93bihlLm9yaWdpbmFsRXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5kZWxldGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmVkaXRMYXllci5yZW1vdmVMYXllcih0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbmRleDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGF0bG5ncy5pbmRleE9mKHRoaXMucmlnaHQubGF0bG5nKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBMLkVkaXRhYmxlLm1lcmdlT3B0aW9ucyh7XG5cbiAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAvLyDwn42Cb3B0aW9uIG1pZGRsZU1hcmtlckNsYXNzOiBjbGFzcyA9IFZlcnRleE1hcmtlclxuICAgICAgICAvLyBDbGFzcyB0byBiZSB1c2VkIGFzIG1pZGRsZSB2ZXJ0ZXgsIHB1bGxlZCBieSB0aGUgdXNlciB0byBjcmVhdGUgYSBuZXcgcG9pbnQgaW4gdGhlIG1pZGRsZSBvZiBhIHBhdGguXG4gICAgICAgIG1pZGRsZU1hcmtlckNsYXNzOiBMLkVkaXRhYmxlLk1pZGRsZU1hcmtlclxuXG4gICAgfSk7XG5cbiAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlOyDwn42CY2xhc3MgQmFzZUVkaXRvcjsg8J+NgmFrYSBMLkVkaXRhYmxlLkJhc2VFZGl0b3JcbiAgICAvLyBXaGVuIGVkaXRpbmcgYSBmZWF0dXJlIChNYXJrZXIsIFBvbHlsaW5l4oCmKSwgYW4gZWRpdG9yIGlzIGF0dGFjaGVkIHRvIGl0LiBUaGlzXG4gICAgLy8gZWRpdG9yIGJhc2ljYWxseSBrbm93cyBob3cgdG8gaGFuZGxlIHRoZSBlZGl0aW9uLlxuICAgIEwuRWRpdGFibGUuQmFzZUVkaXRvciA9IEwuSGFuZGxlci5leHRlbmQoe1xuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChtYXAsIGZlYXR1cmUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMubWFwID0gbWFwO1xuICAgICAgICAgICAgdGhpcy5mZWF0dXJlID0gZmVhdHVyZTtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZS5lZGl0b3IgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5lZGl0TGF5ZXIgPSBuZXcgTC5MYXllckdyb3VwKCk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzID0gdGhpcy5vcHRpb25zLmVkaXRUb29scyB8fCBtYXAuZWRpdFRvb2xzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgZW5hYmxlKCk6IHRoaXNcbiAgICAgICAgLy8gU2V0IHVwIHRoZSBkcmF3aW5nIHRvb2xzIGZvciB0aGUgZmVhdHVyZSB0byBiZSBlZGl0YWJsZS5cbiAgICAgICAgYWRkSG9va3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ29ubmVjdGVkKCkpIHRoaXMub25GZWF0dXJlQWRkKCk7XG4gICAgICAgICAgICBlbHNlIHRoaXMuZmVhdHVyZS5vbmNlKCdhZGQnLCB0aGlzLm9uRmVhdHVyZUFkZCwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLm9uRW5hYmxlKCk7XG4gICAgICAgICAgICB0aGlzLmZlYXR1cmUub24odGhpcy5fZ2V0RXZlbnRzKCksIHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgZGlzYWJsZSgpOiB0aGlzXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgZHJhd2luZyB0b29scyBmb3IgdGhlIGZlYXR1cmUuXG4gICAgICAgIHJlbW92ZUhvb2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmZlYXR1cmUub2ZmKHRoaXMuX2dldEV2ZW50cygpLCB0aGlzKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZlYXR1cmUuZHJhZ2dpbmcpIHRoaXMuZmVhdHVyZS5kcmFnZ2luZy5kaXNhYmxlKCk7XG4gICAgICAgICAgICB0aGlzLmVkaXRMYXllci5jbGVhckxheWVycygpO1xuICAgICAgICAgICAgdGhpcy50b29scy5lZGl0TGF5ZXIucmVtb3ZlTGF5ZXIodGhpcy5lZGl0TGF5ZXIpO1xuICAgICAgICAgICAgdGhpcy5vbkRpc2FibGUoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmF3aW5nKSB0aGlzLmNhbmNlbERyYXdpbmcoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIGRyYXdpbmcoKTogYm9vbGVhblxuICAgICAgICAvLyBSZXR1cm4gdHJ1ZSBpZiBhbnkgZHJhd2luZyBhY3Rpb24gaXMgb25nb2luZyB3aXRoIHRoaXMgZWRpdG9yLlxuICAgICAgICBkcmF3aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISF0aGlzLl9kcmF3aW5nO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7fSxcblxuICAgICAgICBvbkZlYXR1cmVBZGQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudG9vbHMuZWRpdExheWVyLmFkZExheWVyKHRoaXMuZWRpdExheWVyKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZlYXR1cmUuZHJhZ2dpbmcpIHRoaXMuZmVhdHVyZS5kcmFnZ2luZy5lbmFibGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoYXNNaWRkbGVNYXJrZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMub3B0aW9ucy5za2lwTWlkZGxlTWFya2VycyAmJiAhdGhpcy50b29scy5vcHRpb25zLnNraXBNaWRkbGVNYXJrZXJzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpcmVBbmRGb3J3YXJkOiBmdW5jdGlvbiAodHlwZSwgZSkge1xuICAgICAgICAgICAgZSA9IGUgfHwge307XG4gICAgICAgICAgICBlLmxheWVyID0gdGhpcy5mZWF0dXJlO1xuICAgICAgICAgICAgdGhpcy5mZWF0dXJlLmZpcmUodHlwZSwgZSk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLmZpcmVBbmRGb3J3YXJkKHR5cGUsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRW5hYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6ZW5hYmxlOiBFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhbiBleGlzdGluZyBmZWF0dXJlIGlzIHJlYWR5IHRvIGJlIGVkaXRlZC5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOmVuYWJsZScpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRGlzYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOmRpc2FibGU6IEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIGFuIGV4aXN0aW5nIGZlYXR1cmUgaXMgbm90IHJlYWR5IGFueW1vcmUgdG8gYmUgZWRpdGVkLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZGlzYWJsZScpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRWRpdGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOmVkaXRpbmc6IEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCBhcyBzb29uIGFzIGFueSBjaGFuZ2UgaXMgbWFkZSB0byB0aGUgZmVhdHVyZSBnZW9tZXRyeS5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOmVkaXRpbmcnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblN0YXJ0RHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gRHJhd2luZyBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTpkcmF3aW5nOnN0YXJ0OiBFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIGZlYXR1cmUgaXMgdG8gYmUgZHJhd24uXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmF3aW5nOnN0YXJ0Jyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25FbmREcmF3aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBEcmF3aW5nIGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOmRyYXdpbmc6ZW5kOiBFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIGZlYXR1cmUgaXMgbm90IGRyYXduIGFueW1vcmUuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmF3aW5nOmVuZCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uQ2FuY2VsRHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gRHJhd2luZyBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTpkcmF3aW5nOmNhbmNlbDogRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gdXNlciBjYW5jZWwgZHJhd2luZyB3aGlsZSBhIGZlYXR1cmUgaXMgYmVpbmcgZHJhd24uXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmF3aW5nOmNhbmNlbCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uQ29tbWl0RHJhd2luZzogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIERyYXdpbmcgZXZlbnRzXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6ZHJhd2luZzpjb21taXQ6IEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIHVzZXIgZmluaXNoIGRyYXdpbmcgYSBmZWF0dXJlLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZHJhd2luZzpjb21taXQnLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkRyYXdpbmdNb3VzZURvd246IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBEcmF3aW5nIGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOmRyYXdpbmc6bW91c2Vkb3duOiBFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiB1c2VyIGBtb3VzZWRvd25gIHdoaWxlIGRyYXdpbmcuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmF3aW5nOm1vdXNlZG93bicsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRHJhd2luZ01vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBEcmF3aW5nIGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOmRyYXdpbmc6bW91c2V1cDogRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gdXNlciBgbW91c2V1cGAgd2hpbGUgZHJhd2luZy5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOmRyYXdpbmc6bW91c2V1cCcsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0RHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9kcmF3aW5nKSB0aGlzLl9kcmF3aW5nID0gTC5FZGl0YWJsZS5GT1JXQVJEO1xuICAgICAgICAgICAgdGhpcy50b29scy5yZWdpc3RlckZvckRyYXdpbmcodGhpcyk7XG4gICAgICAgICAgICB0aGlzLm9uU3RhcnREcmF3aW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29tbWl0RHJhd2luZzogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHRoaXMub25Db21taXREcmF3aW5nKGUpO1xuICAgICAgICAgICAgdGhpcy5lbmREcmF3aW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FuY2VsRHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gSWYgY2FsbGVkIGR1cmluZyBhIHZlcnRleCBkcmFnLCB0aGUgdmVydGV4IHdpbGwgYmUgcmVtb3ZlZCBiZWZvcmVcbiAgICAgICAgICAgIC8vIHRoZSBtb3VzZXVwIGZpcmVzIG9uIGl0LiBUaGlzIGlzIGEgd29ya2Fyb3VuZC4gTWF5YmUgYmV0dGVyIGZpeCBpc1xuICAgICAgICAgICAgLy8gVG8gaGF2ZSBMLkRyYWdnYWJsZSByZXNldCBpdCdzIHN0YXR1cyBvbiBkaXNhYmxlIChMZWFmbGV0IHNpZGUpLlxuICAgICAgICAgICAgTC5EcmFnZ2FibGUuX2RyYWdnaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLm9uQ2FuY2VsRHJhd2luZygpO1xuICAgICAgICAgICAgdGhpcy5lbmREcmF3aW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW5kRHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fZHJhd2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy50b29scy51bnJlZ2lzdGVyRm9yRHJhd2luZyh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMub25FbmREcmF3aW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmF3aW5nQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZHJhd2luZygpKSByZXR1cm47XG4gICAgICAgICAgICBMLkVkaXRhYmxlLm1ha2VDYW5jZWxsYWJsZShlKTtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIERyYXdpbmcgZXZlbnRzXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6ZHJhd2luZzpjbGljazogQ2FuY2VsYWJsZUV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIHVzZXIgYGNsaWNrYCB3aGlsZSBkcmF3aW5nLCBiZWZvcmUgYW55IGludGVybmFsIGFjdGlvbiBpcyBiZWluZyBwcm9jZXNzZWQuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmF3aW5nOmNsaWNrJywgZSk7XG4gICAgICAgICAgICBpZiAoZS5fY2FuY2VsbGVkKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQoKSkgdGhpcy5jb25uZWN0KGUpO1xuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRHJhd2luZ0NsaWNrKGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzQ29ubmVjdGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXAuaGFzTGF5ZXIodGhpcy5mZWF0dXJlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjb25uZWN0OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdGhpcy50b29scy5jb25uZWN0Q3JlYXRlZFRvTWFwKHRoaXMuZmVhdHVyZSk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLmVkaXRMYXllci5hZGRMYXllcih0aGlzLmVkaXRMYXllcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gRHJhd2luZyBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTpkcmF3aW5nOm1vdmU6IEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIGBtb3ZlYCBtb3VzZSB3aGlsZSBkcmF3aW5nLCB3aGlsZSBkcmFnZ2luZyBhIG1hcmtlciwgYW5kIHdoaWxlIGRyYWdnaW5nIGEgdmVydGV4LlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZHJhd2luZzptb3ZlJywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmF3aW5nTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdGhpcy5vbk1vdmUoZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkcmFnc3RhcnQ6IHRoaXMub25EcmFnU3RhcnQsXG4gICAgICAgICAgICAgICAgZHJhZzogdGhpcy5vbkRyYWcsXG4gICAgICAgICAgICAgICAgZHJhZ2VuZDogdGhpcy5vbkRyYWdFbmQsXG4gICAgICAgICAgICAgICAgcmVtb3ZlOiB0aGlzLmRpc2FibGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmFnU3RhcnQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB0aGlzLm9uRWRpdGluZygpO1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOmRyYWdzdGFydDogRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIGJlZm9yZSBhIHBhdGggZmVhdHVyZSBpcyBkcmFnZ2VkLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZHJhZ3N0YXJ0JywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdGhpcy5vbk1vdmUoZSk7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6ZHJhZzogRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gYSBwYXRoIGZlYXR1cmUgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOmRyYWcnLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkRyYWdFbmQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6ZHJhZ2VuZDogRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIGFmdGVyIGEgcGF0aCBmZWF0dXJlIGhhcyBiZWVuIGRyYWdnZWQuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmFnZW5kJywgZSk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZTsg8J+NgmNsYXNzIE1hcmtlckVkaXRvcjsg8J+NgmFrYSBMLkVkaXRhYmxlLk1hcmtlckVkaXRvclxuICAgIC8vIPCfjYJpbmhlcml0cyBCYXNlRWRpdG9yXG4gICAgLy8gRWRpdG9yIGZvciBNYXJrZXIuXG4gICAgTC5FZGl0YWJsZS5NYXJrZXJFZGl0b3IgPSBMLkVkaXRhYmxlLkJhc2VFZGl0b3IuZXh0ZW5kKHtcblxuICAgICAgICBvbkRyYXdpbmdNb3VzZU1vdmU6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBMLkVkaXRhYmxlLkJhc2VFZGl0b3IucHJvdG90eXBlLm9uRHJhd2luZ01vdXNlTW92ZS5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RyYXdpbmcpIHRoaXMuZmVhdHVyZS5zZXRMYXRMbmcoZS5sYXRsbmcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHByb2Nlc3NEcmF3aW5nQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBEcmF3aW5nIGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOmRyYXdpbmc6Y2xpY2tlZDogRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gdXNlciBgY2xpY2tgIHdoaWxlIGRyYXdpbmcsIGFmdGVyIGFsbCBpbnRlcm5hbCBhY3Rpb25zLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZHJhd2luZzpjbGlja2VkJywgZSk7XG4gICAgICAgICAgICB0aGlzLmNvbW1pdERyYXdpbmcoZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29ubmVjdDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIE9uIHRvdWNoLCB0aGUgbGF0bG5nIGhhcyBub3QgYmVlbiB1cGRhdGVkIGJlY2F1c2UgdGhlcmUgaXNcbiAgICAgICAgICAgIC8vIG5vIG1vdXNlbW92ZS5cbiAgICAgICAgICAgIGlmIChlKSB0aGlzLmZlYXR1cmUuX2xhdGxuZyA9IGUubGF0bG5nO1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5CYXNlRWRpdG9yLnByb3RvdHlwZS5jb25uZWN0LmNhbGwodGhpcywgZSk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZTsg8J+NgmNsYXNzIFBhdGhFZGl0b3I7IPCfjYJha2EgTC5FZGl0YWJsZS5QYXRoRWRpdG9yXG4gICAgLy8g8J+NgmluaGVyaXRzIEJhc2VFZGl0b3JcbiAgICAvLyBCYXNlIGNsYXNzIGZvciBhbGwgcGF0aCBlZGl0b3JzLlxuICAgIEwuRWRpdGFibGUuUGF0aEVkaXRvciA9IEwuRWRpdGFibGUuQmFzZUVkaXRvci5leHRlbmQoe1xuXG4gICAgICAgIENMT1NFRDogZmFsc2UsXG4gICAgICAgIE1JTl9WRVJURVg6IDIsXG5cbiAgICAgICAgYWRkSG9va3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIEwuRWRpdGFibGUuQmFzZUVkaXRvci5wcm90b3R5cGUuYWRkSG9va3MuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZlYXR1cmUpIHRoaXMuaW5pdFZlcnRleE1hcmtlcnMoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRWZXJ0ZXhNYXJrZXJzOiBmdW5jdGlvbiAobGF0bG5ncykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQoKSkgcmV0dXJuO1xuICAgICAgICAgICAgbGF0bG5ncyA9IGxhdGxuZ3MgfHwgdGhpcy5nZXRMYXRMbmdzKCk7XG4gICAgICAgICAgICBpZiAoTC5Qb2x5bGluZS5fZmxhdChsYXRsbmdzKSkgdGhpcy5hZGRWZXJ0ZXhNYXJrZXJzKGxhdGxuZ3MpO1xuICAgICAgICAgICAgZWxzZSBmb3IgKHZhciBpID0gMDsgaSA8IGxhdGxuZ3MubGVuZ3RoOyBpKyspIHRoaXMuaW5pdFZlcnRleE1hcmtlcnMobGF0bG5nc1tpXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TGF0TG5nczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmVhdHVyZS5nZXRMYXRMbmdzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCByZXNldCgpXG4gICAgICAgIC8vIFJlYnVpbGQgZWRpdCBlbGVtZW50cyAoVmVydGV4LCBNaWRkbGVNYXJrZXIsIGV0Yy4pLlxuICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5lZGl0TGF5ZXIuY2xlYXJMYXllcnMoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdFZlcnRleE1hcmtlcnMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRWZXJ0ZXhNYXJrZXI6IGZ1bmN0aW9uIChsYXRsbmcsIGxhdGxuZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy50b29scy5vcHRpb25zLnZlcnRleE1hcmtlckNsYXNzKGxhdGxuZywgbGF0bG5ncywgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkVmVydGV4TWFya2VyczogZnVuY3Rpb24gKGxhdGxuZ3MpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF0bG5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkVmVydGV4TWFya2VyKGxhdGxuZ3NbaV0sIGxhdGxuZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlZnJlc2hWZXJ0ZXhNYXJrZXJzOiBmdW5jdGlvbiAobGF0bG5ncykge1xuICAgICAgICAgICAgbGF0bG5ncyA9IGxhdGxuZ3MgfHwgdGhpcy5nZXREZWZhdWx0TGF0TG5ncygpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXRsbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGF0bG5nc1tpXS5fX3ZlcnRleC51cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhZGRNaWRkbGVNYXJrZXI6IGZ1bmN0aW9uIChsZWZ0LCByaWdodCwgbGF0bG5ncykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLnRvb2xzLm9wdGlvbnMubWlkZGxlTWFya2VyQ2xhc3MobGVmdCwgcmlnaHQsIGxhdGxuZ3MsIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uVmVydGV4TWFya2VyQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBMLkVkaXRhYmxlLm1ha2VDYW5jZWxsYWJsZShlKTtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIFZlcnRleCBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTp2ZXJ0ZXg6Y2xpY2s6IENhbmNlbGFibGVWZXJ0ZXhFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIGBjbGlja2AgaXMgaXNzdWVkIG9uIGEgdmVydGV4LCBiZWZvcmUgYW55IGludGVybmFsIGFjdGlvbiBpcyBiZWluZyBwcm9jZXNzZWQuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTp2ZXJ0ZXg6Y2xpY2snLCBlKTtcbiAgICAgICAgICAgIGlmIChlLl9jYW5jZWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvb2xzLmRyYXdpbmcoKSAmJiB0aGlzLnRvb2xzLl9kcmF3aW5nRWRpdG9yICE9PSB0aGlzKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBlLnZlcnRleC5nZXRJbmRleCgpLCBjb21taXQ7XG4gICAgICAgICAgICBpZiAoZS5vcmlnaW5hbEV2ZW50LmN0cmxLZXkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uVmVydGV4TWFya2VyQ3RybENsaWNrKGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlLm9yaWdpbmFsRXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vblZlcnRleE1hcmtlckFsdENsaWNrKGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlLm9yaWdpbmFsRXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uVmVydGV4TWFya2VyU2hpZnRDbGljayhlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZS5vcmlnaW5hbEV2ZW50Lm1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uVmVydGV4TWFya2VyTWV0YUtleUNsaWNrKGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gZS52ZXJ0ZXguZ2V0TGFzdEluZGV4KCkgJiYgdGhpcy5fZHJhd2luZyA9PT0gTC5FZGl0YWJsZS5GT1JXQVJEKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IHRoaXMuTUlOX1ZFUlRFWCAtIDEpIGNvbW1pdCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSAwICYmIHRoaXMuX2RyYXdpbmcgPT09IEwuRWRpdGFibGUuQkFDS1dBUkQgJiYgdGhpcy5fZHJhd25MYXRMbmdzLmxlbmd0aCA+PSB0aGlzLk1JTl9WRVJURVgpIHtcbiAgICAgICAgICAgICAgICBjb21taXQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gMCAmJiB0aGlzLl9kcmF3aW5nID09PSBMLkVkaXRhYmxlLkZPUldBUkQgJiYgdGhpcy5fZHJhd25MYXRMbmdzLmxlbmd0aCA+PSB0aGlzLk1JTl9WRVJURVggJiYgdGhpcy5DTE9TRUQpIHtcbiAgICAgICAgICAgICAgICBjb21taXQgPSB0cnVlOyAgLy8gQWxsb3cgdG8gY2xvc2Ugb24gZmlyc3QgcG9pbnQgYWxzbyBmb3IgcG9seWdvbnNcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vblZlcnRleFJhd01hcmtlckNsaWNrKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gVmVydGV4IGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOnZlcnRleDpjbGlja2VkOiBWZXJ0ZXhFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIGBjbGlja2AgaXMgaXNzdWVkIG9uIGEgdmVydGV4LCBhZnRlciBhbGwgaW50ZXJuYWwgYWN0aW9ucy5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDpjbGlja2VkJywgZSk7XG4gICAgICAgICAgICBpZiAoY29tbWl0KSB0aGlzLmNvbW1pdERyYXdpbmcoZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25WZXJ0ZXhSYXdNYXJrZXJDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIFZlcnRleCBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTp2ZXJ0ZXg6cmF3Y2xpY2s6IENhbmNlbGFibGVWZXJ0ZXhFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIGBjbGlja2AgaXMgaXNzdWVkIG9uIGEgdmVydGV4IHdpdGhvdXQgYW55IHNwZWNpYWwga2V5IGFuZCB3aXRob3V0IGJlaW5nIGluIGRyYXdpbmcgbW9kZS5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDpyYXdjbGljaycsIGUpO1xuICAgICAgICAgICAgaWYgKGUuX2NhbmNlbGxlZCkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnZlcnRleENhbkJlRGVsZXRlZChlLnZlcnRleCkpIHJldHVybjtcbiAgICAgICAgICAgIGUudmVydGV4LmRlbGV0ZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZlcnRleENhbkJlRGVsZXRlZDogZnVuY3Rpb24gKHZlcnRleCkge1xuICAgICAgICAgICAgcmV0dXJuIHZlcnRleC5sYXRsbmdzLmxlbmd0aCA+IHRoaXMuTUlOX1ZFUlRFWDtcbiAgICAgICAgfSxcblxuICAgICAgICBvblZlcnRleERlbGV0ZWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBWZXJ0ZXggZXZlbnRzXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6dmVydGV4OmRlbGV0ZWQ6IFZlcnRleEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCBhZnRlciBhIHZlcnRleCBoYXMgYmVlbiBkZWxldGVkIGJ5IHVzZXIuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTp2ZXJ0ZXg6ZGVsZXRlZCcsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uVmVydGV4TWFya2VyQ3RybENsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gVmVydGV4IGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOnZlcnRleDpjdHJsY2xpY2s6IFZlcnRleEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIGEgYGNsaWNrYCB3aXRoIGBjdHJsS2V5YCBpcyBpc3N1ZWQgb24gYSB2ZXJ0ZXguXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTp2ZXJ0ZXg6Y3RybGNsaWNrJywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25WZXJ0ZXhNYXJrZXJTaGlmdENsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gVmVydGV4IGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOnZlcnRleDpzaGlmdGNsaWNrOiBWZXJ0ZXhFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIGBjbGlja2Agd2l0aCBgc2hpZnRLZXlgIGlzIGlzc3VlZCBvbiBhIHZlcnRleC5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDpzaGlmdGNsaWNrJywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25WZXJ0ZXhNYXJrZXJNZXRhS2V5Q2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBWZXJ0ZXggZXZlbnRzXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6dmVydGV4Om1ldGFrZXljbGljazogVmVydGV4RXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gYSBgY2xpY2tgIHdpdGggYG1ldGFLZXlgIGlzIGlzc3VlZCBvbiBhIHZlcnRleC5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDptZXRha2V5Y2xpY2snLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblZlcnRleE1hcmtlckFsdENsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gVmVydGV4IGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOnZlcnRleDphbHRjbGljazogVmVydGV4RXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gYSBgY2xpY2tgIHdpdGggYGFsdEtleWAgaXMgaXNzdWVkIG9uIGEgdmVydGV4LlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6dmVydGV4OmFsdGNsaWNrJywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25WZXJ0ZXhNYXJrZXJDb250ZXh0TWVudTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIFZlcnRleCBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTp2ZXJ0ZXg6Y29udGV4dG1lbnU6IFZlcnRleEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIGEgYGNvbnRleHRtZW51YCBpcyBpc3N1ZWQgb24gYSB2ZXJ0ZXguXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTp2ZXJ0ZXg6Y29udGV4dG1lbnUnLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblZlcnRleE1hcmtlck1vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIFZlcnRleCBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTp2ZXJ0ZXg6bW91c2Vkb3duOiBWZXJ0ZXhFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiB1c2VyIGBtb3VzZWRvd25gIGEgdmVydGV4LlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6dmVydGV4Om1vdXNlZG93bicsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uTWlkZGxlTWFya2VyTW91c2VEb3duOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gTWlkZGxlTWFya2VyIGV2ZW50c1xuICAgICAgICAgICAgLy8g8J+NgmV2ZW50IGVkaXRhYmxlOm1pZGRsZW1hcmtlcjptb3VzZWRvd246IFZlcnRleEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIHVzZXIgYG1vdXNlZG93bmAgYSBtaWRkbGUgbWFya2VyLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6bWlkZGxlbWFya2VyOm1vdXNlZG93bicsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uVmVydGV4TWFya2VyRHJhZzogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHRoaXMub25Nb3ZlKGUpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmVhdHVyZS5fYm91bmRzKSB0aGlzLmV4dGVuZEJvdW5kcyhlKTtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIFZlcnRleCBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTp2ZXJ0ZXg6ZHJhZzogVmVydGV4RXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gYSB2ZXJ0ZXggaXMgZHJhZ2dlZCBieSB1c2VyLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6dmVydGV4OmRyYWcnLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblZlcnRleE1hcmtlckRyYWdTdGFydDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vIPCfjYJuYW1lc3BhY2UgRWRpdGFibGVcbiAgICAgICAgICAgIC8vIPCfjYJzZWN0aW9uIFZlcnRleCBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTp2ZXJ0ZXg6ZHJhZ3N0YXJ0OiBWZXJ0ZXhFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgYmVmb3JlIGEgdmVydGV4IGlzIGRyYWdnZWQgYnkgdXNlci5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDpkcmFnc3RhcnQnLCBlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblZlcnRleE1hcmtlckRyYWdFbmQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBWZXJ0ZXggZXZlbnRzXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6dmVydGV4OmRyYWdlbmQ6IFZlcnRleEV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCBhZnRlciBhIHZlcnRleCBpcyBkcmFnZ2VkIGJ5IHVzZXIuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTp2ZXJ0ZXg6ZHJhZ2VuZCcsIGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldERyYXduTGF0TG5nczogZnVuY3Rpb24gKGxhdGxuZ3MpIHtcbiAgICAgICAgICAgIHRoaXMuX2RyYXduTGF0TG5ncyA9IGxhdGxuZ3MgfHwgdGhpcy5nZXREZWZhdWx0TGF0TG5ncygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0RHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9kcmF3bkxhdExuZ3MpIHRoaXMuc2V0RHJhd25MYXRMbmdzKCk7XG4gICAgICAgICAgICBMLkVkaXRhYmxlLkJhc2VFZGl0b3IucHJvdG90eXBlLnN0YXJ0RHJhd2luZy5jYWxsKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0RHJhd2luZ0ZvcndhcmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnREcmF3aW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW5kRHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy50b29scy5kZXRhY2hGb3J3YXJkTGluZUd1aWRlKCk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLmRldGFjaEJhY2t3YXJkTGluZUd1aWRlKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZHJhd25MYXRMbmdzICYmIHRoaXMuX2RyYXduTGF0TG5ncy5sZW5ndGggPCB0aGlzLk1JTl9WRVJURVgpIHRoaXMuZGVsZXRlU2hhcGUodGhpcy5fZHJhd25MYXRMbmdzKTtcbiAgICAgICAgICAgIEwuRWRpdGFibGUuQmFzZUVkaXRvci5wcm90b3R5cGUuZW5kRHJhd2luZy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2RyYXduTGF0TG5ncztcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRMYXRMbmc6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmF3aW5nID09PSBMLkVkaXRhYmxlLkZPUldBUkQpIHRoaXMuX2RyYXduTGF0TG5ncy5wdXNoKGxhdGxuZyk7XG4gICAgICAgICAgICBlbHNlIHRoaXMuX2RyYXduTGF0TG5ncy51bnNoaWZ0KGxhdGxuZyk7XG4gICAgICAgICAgICB0aGlzLmZlYXR1cmUuX2JvdW5kcy5leHRlbmQobGF0bG5nKTtcbiAgICAgICAgICAgIHRoaXMuYWRkVmVydGV4TWFya2VyKGxhdGxuZywgdGhpcy5fZHJhd25MYXRMbmdzKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG5ld1BvaW50Rm9yd2FyZDogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgdGhpcy5hZGRMYXRMbmcobGF0bG5nKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMuYXR0YWNoRm9yd2FyZExpbmVHdWlkZSgpO1xuICAgICAgICAgICAgdGhpcy50b29scy5hbmNob3JGb3J3YXJkTGluZUd1aWRlKGxhdGxuZyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbmV3UG9pbnRCYWNrd2FyZDogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgdGhpcy5hZGRMYXRMbmcobGF0bG5nKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMuYW5jaG9yQmFja3dhcmRMaW5lR3VpZGUobGF0bG5nKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbmFtZXNwYWNlIFBhdGhFZGl0b3JcbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBwdXNoKClcbiAgICAgICAgLy8gUHJvZ3JhbW1hdGljYWxseSBhZGQgYSBwb2ludCB3aGlsZSBkcmF3aW5nLlxuICAgICAgICBwdXNoOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgICAgICBpZiAoIWxhdGxuZykgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0wuRWRpdGFibGUuUGF0aEVkaXRvci5wdXNoIGV4cGVjdCBhIHZhaWxkIGxhdGxuZyBhcyBwYXJhbWV0ZXInKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmF3aW5nID09PSBMLkVkaXRhYmxlLkZPUldBUkQpIHRoaXMubmV3UG9pbnRGb3J3YXJkKGxhdGxuZyk7XG4gICAgICAgICAgICBlbHNlIHRoaXMubmV3UG9pbnRCYWNrd2FyZChsYXRsbmcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZUxhdExuZzogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgbGF0bG5nLl9fdmVydGV4LmRlbGV0ZSgpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBwb3AoKTogTC5MYXRMbmcgb3IgbnVsbFxuICAgICAgICAvLyBQcm9ncmFtbWF0aWNhbGx5IHJlbW92ZSBsYXN0IHBvaW50IChpZiBhbnkpIHdoaWxlIGRyYXdpbmcuXG4gICAgICAgIHBvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RyYXduTGF0TG5ncy5sZW5ndGggPD0gMSkgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIGxhdGxuZztcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmF3aW5nID09PSBMLkVkaXRhYmxlLkZPUldBUkQpIGxhdGxuZyA9IHRoaXMuX2RyYXduTGF0TG5nc1t0aGlzLl9kcmF3bkxhdExuZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBlbHNlIGxhdGxuZyA9IHRoaXMuX2RyYXduTGF0TG5nc1swXTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlTGF0TG5nKGxhdGxuZyk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZHJhd2luZyA9PT0gTC5FZGl0YWJsZS5GT1JXQVJEKSB0aGlzLnRvb2xzLmFuY2hvckZvcndhcmRMaW5lR3VpZGUodGhpcy5fZHJhd25MYXRMbmdzW3RoaXMuX2RyYXduTGF0TG5ncy5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgICBlbHNlIHRoaXMudG9vbHMuYW5jaG9yRm9yd2FyZExpbmVHdWlkZSh0aGlzLl9kcmF3bkxhdExuZ3NbMF0pO1xuICAgICAgICAgICAgcmV0dXJuIGxhdGxuZztcbiAgICAgICAgfSxcblxuICAgICAgICBwcm9jZXNzRHJhd2luZ0NsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGUudmVydGV4ICYmIGUudmVydGV4LmVkaXRvciA9PT0gdGhpcykgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RyYXdpbmcgPT09IEwuRWRpdGFibGUuRk9SV0FSRCkgdGhpcy5uZXdQb2ludEZvcndhcmQoZS5sYXRsbmcpO1xuICAgICAgICAgICAgZWxzZSB0aGlzLm5ld1BvaW50QmFja3dhcmQoZS5sYXRsbmcpO1xuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZHJhd2luZzpjbGlja2VkJywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmF3aW5nTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5CYXNlRWRpdG9yLnByb3RvdHlwZS5vbkRyYXdpbmdNb3VzZU1vdmUuY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmF3aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b29scy5tb3ZlRm9yd2FyZExpbmVHdWlkZShlLmxhdGxuZyk7XG4gICAgICAgICAgICAgICAgdGhpcy50b29scy5tb3ZlQmFja3dhcmRMaW5lR3VpZGUoZS5sYXRsbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlZnJlc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZS5yZWRyYXcoKTtcbiAgICAgICAgICAgIHRoaXMub25FZGl0aW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBQYXRoRWRpdG9yXG4gICAgICAgIC8vIPCfjYJtZXRob2QgbmV3U2hhcGUobGF0bG5nPzogTC5MYXRMbmcpXG4gICAgICAgIC8vIEFkZCBhIG5ldyBzaGFwZSAoUG9seWxpbmUsIFBvbHlnb24pIGluIGEgbXVsdGksIGFuZCBzZXR1cCB1cCBkcmF3aW5nIHRvb2xzIHRvIGRyYXcgaXQ7XG4gICAgICAgIC8vIGlmIG9wdGlvbmFsIGBsYXRsbmdgIGlzIGdpdmVuLCBzdGFydCBhIHBhdGggYXQgdGhpcyBwb2ludC5cbiAgICAgICAgbmV3U2hhcGU6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IHRoaXMuYWRkTmV3RW1wdHlTaGFwZSgpO1xuICAgICAgICAgICAgaWYgKCFzaGFwZSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5zZXREcmF3bkxhdExuZ3Moc2hhcGVbMF0gfHwgc2hhcGUpOyAgLy8gUG9seWdvbiBvciBwb2x5bGluZVxuICAgICAgICAgICAgdGhpcy5zdGFydERyYXdpbmdGb3J3YXJkKCk7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBTaGFwZSBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTpzaGFwZTpuZXc6IFNoYXBlRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gYSBuZXcgc2hhcGUgaXMgY3JlYXRlZCBpbiBhIG11bHRpIChQb2x5Z29uIG9yIFBvbHlsaW5lKS5cbiAgICAgICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnNoYXBlOm5ldycsIHtzaGFwZTogc2hhcGV9KTtcbiAgICAgICAgICAgIGlmIChsYXRsbmcpIHRoaXMubmV3UG9pbnRGb3J3YXJkKGxhdGxuZyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVsZXRlU2hhcGU6IGZ1bmN0aW9uIChzaGFwZSwgbGF0bG5ncykge1xuICAgICAgICAgICAgdmFyIGUgPSB7c2hhcGU6IHNoYXBlfTtcbiAgICAgICAgICAgIEwuRWRpdGFibGUubWFrZUNhbmNlbGxhYmxlKGUpO1xuICAgICAgICAgICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZVxuICAgICAgICAgICAgLy8g8J+NgnNlY3Rpb24gU2hhcGUgZXZlbnRzXG4gICAgICAgICAgICAvLyDwn42CZXZlbnQgZWRpdGFibGU6c2hhcGU6ZGVsZXRlOiBDYW5jZWxhYmxlU2hhcGVFdmVudFxuICAgICAgICAgICAgLy8gRmlyZWQgYmVmb3JlIGEgbmV3IHNoYXBlIGlzIGRlbGV0ZWQgaW4gYSBtdWx0aSAoUG9seWdvbiBvciBQb2x5bGluZSkuXG4gICAgICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpzaGFwZTpkZWxldGUnLCBlKTtcbiAgICAgICAgICAgIGlmIChlLl9jYW5jZWxsZWQpIHJldHVybjtcbiAgICAgICAgICAgIHNoYXBlID0gdGhpcy5fZGVsZXRlU2hhcGUoc2hhcGUsIGxhdGxuZ3MpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZW5zdXJlTm90RmxhdCkgdGhpcy5lbnN1cmVOb3RGbGF0KCk7ICAvLyBQb2x5Z29uLlxuICAgICAgICAgICAgdGhpcy5mZWF0dXJlLnNldExhdExuZ3ModGhpcy5nZXRMYXRMbmdzKCkpOyAgLy8gRm9yY2UgYm91bmRzIHJlc2V0LlxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlXG4gICAgICAgICAgICAvLyDwn42Cc2VjdGlvbiBTaGFwZSBldmVudHNcbiAgICAgICAgICAgIC8vIPCfjYJldmVudCBlZGl0YWJsZTpzaGFwZTpkZWxldGVkOiBTaGFwZUV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCBhZnRlciBhIG5ldyBzaGFwZSBpcyBkZWxldGVkIGluIGEgbXVsdGkgKFBvbHlnb24gb3IgUG9seWxpbmUpLlxuICAgICAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6c2hhcGU6ZGVsZXRlZCcsIHtzaGFwZTogc2hhcGV9KTtcbiAgICAgICAgICAgIHJldHVybiBzaGFwZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZGVsZXRlU2hhcGU6IGZ1bmN0aW9uIChzaGFwZSwgbGF0bG5ncykge1xuICAgICAgICAgICAgbGF0bG5ncyA9IGxhdGxuZ3MgfHwgdGhpcy5nZXRMYXRMbmdzKCk7XG4gICAgICAgICAgICBpZiAoIWxhdGxuZ3MubGVuZ3RoKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgaW5wbGFjZURlbGV0ZSA9IGZ1bmN0aW9uIChsYXRsbmdzLCBzaGFwZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDYWxsZWQgd2hlbiBkZWxldGluZyBhIGZsYXQgbGF0bG5nc1xuICAgICAgICAgICAgICAgICAgICBzaGFwZSA9IGxhdGxuZ3Muc3BsaWNlKDAsIE51bWJlci5NQVhfVkFMVUUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hhcGU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzcGxpY2VEZWxldGUgPSBmdW5jdGlvbiAobGF0bG5ncywgc2hhcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbGVkIHdoZW4gcmVtb3ZpbmcgYSBsYXRsbmdzIGluc2lkZSBhbiBhcnJheVxuICAgICAgICAgICAgICAgICAgICBsYXRsbmdzLnNwbGljZShsYXRsbmdzLmluZGV4T2Yoc2hhcGUpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFsYXRsbmdzLmxlbmd0aCkgc2VsZi5fZGVsZXRlU2hhcGUobGF0bG5ncyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaGFwZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGxhdGxuZ3MgPT09IHNoYXBlKSByZXR1cm4gaW5wbGFjZURlbGV0ZShsYXRsbmdzLCBzaGFwZSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhdGxuZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGF0bG5nc1tpXSA9PT0gc2hhcGUpIHJldHVybiBzcGxpY2VEZWxldGUobGF0bG5ncywgc2hhcGUpO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxhdGxuZ3NbaV0uaW5kZXhPZihzaGFwZSkgIT09IC0xKSByZXR1cm4gc3BsaWNlRGVsZXRlKGxhdGxuZ3NbaV0sIHNoYXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbmFtZXNwYWNlIFBhdGhFZGl0b3JcbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBkZWxldGVTaGFwZUF0KGxhdGxuZzogTC5MYXRMbmcpOiBBcnJheVxuICAgICAgICAvLyBSZW1vdmUgYSBwYXRoIHNoYXBlIGF0IHRoZSBnaXZlbiBgbGF0bG5nYC5cbiAgICAgICAgZGVsZXRlU2hhcGVBdDogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgdmFyIHNoYXBlID0gdGhpcy5mZWF0dXJlLnNoYXBlQXQobGF0bG5nKTtcbiAgICAgICAgICAgIGlmIChzaGFwZSkgcmV0dXJuIHRoaXMuZGVsZXRlU2hhcGUoc2hhcGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgYXBwZW5kU2hhcGUoc2hhcGU6IEFycmF5KVxuICAgICAgICAvLyBBcHBlbmQgYSBuZXcgc2hhcGUgdG8gdGhlIFBvbHlnb24gb3IgUG9seWxpbmUuXG4gICAgICAgIGFwcGVuZFNoYXBlOiBmdW5jdGlvbiAoc2hhcGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0U2hhcGUoc2hhcGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgcHJlcGVuZFNoYXBlKHNoYXBlOiBBcnJheSlcbiAgICAgICAgLy8gUHJlcGVuZCBhIG5ldyBzaGFwZSB0byB0aGUgUG9seWdvbiBvciBQb2x5bGluZS5cbiAgICAgICAgcHJlcGVuZFNoYXBlOiBmdW5jdGlvbiAoc2hhcGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0U2hhcGUoc2hhcGUsIDApO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgaW5zZXJ0U2hhcGUoc2hhcGU6IEFycmF5LCBpbmRleDogaW50KVxuICAgICAgICAvLyBJbnNlcnQgYSBuZXcgc2hhcGUgdG8gdGhlIFBvbHlnb24gb3IgUG9seWxpbmUgYXQgZ2l2ZW4gaW5kZXggKGRlZmF1bHQgaXMgdG8gYXBwZW5kKS5cbiAgICAgICAgaW5zZXJ0U2hhcGU6IGZ1bmN0aW9uIChzaGFwZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlTXVsdGkoKTtcbiAgICAgICAgICAgIHNoYXBlID0gdGhpcy5mb3JtYXRTaGFwZShzaGFwZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGluZGV4ID09PSAndW5kZWZpbmVkJykgaW5kZXggPSB0aGlzLmZlYXR1cmUuX2xhdGxuZ3MubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5mZWF0dXJlLl9sYXRsbmdzLnNwbGljZShpbmRleCwgMCwgc2hhcGUpO1xuICAgICAgICAgICAgdGhpcy5mZWF0dXJlLnJlZHJhdygpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2VuYWJsZWQpIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBleHRlbmRCb3VuZHM6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB0aGlzLmZlYXR1cmUuX2JvdW5kcy5leHRlbmQoZS52ZXJ0ZXgubGF0bG5nKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkRyYWdTdGFydDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdExheWVyLmNsZWFyTGF5ZXJzKCk7XG4gICAgICAgICAgICBMLkVkaXRhYmxlLkJhc2VFZGl0b3IucHJvdG90eXBlLm9uRHJhZ1N0YXJ0LmNhbGwodGhpcywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmFnRW5kOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0VmVydGV4TWFya2VycygpO1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5CYXNlRWRpdG9yLnByb3RvdHlwZS5vbkRyYWdFbmQuY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlOyDwn42CY2xhc3MgUG9seWxpbmVFZGl0b3I7IPCfjYJha2EgTC5FZGl0YWJsZS5Qb2x5bGluZUVkaXRvclxuICAgIC8vIPCfjYJpbmhlcml0cyBQYXRoRWRpdG9yXG4gICAgTC5FZGl0YWJsZS5Qb2x5bGluZUVkaXRvciA9IEwuRWRpdGFibGUuUGF0aEVkaXRvci5leHRlbmQoe1xuXG4gICAgICAgIHN0YXJ0RHJhd2luZ0JhY2t3YXJkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3aW5nID0gTC5FZGl0YWJsZS5CQUNLV0FSRDtcbiAgICAgICAgICAgIHRoaXMuc3RhcnREcmF3aW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCBjb250aW51ZUJhY2t3YXJkKGxhdGxuZ3M/OiBBcnJheSlcbiAgICAgICAgLy8gU2V0IHVwIGRyYXdpbmcgdG9vbHMgdG8gY29udGludWUgdGhlIGxpbmUgYmFja3dhcmQuXG4gICAgICAgIGNvbnRpbnVlQmFja3dhcmQ6IGZ1bmN0aW9uIChsYXRsbmdzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kcmF3aW5nKCkpIHJldHVybjtcbiAgICAgICAgICAgIGxhdGxuZ3MgPSBsYXRsbmdzIHx8IHRoaXMuZ2V0RGVmYXVsdExhdExuZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0RHJhd25MYXRMbmdzKGxhdGxuZ3MpO1xuICAgICAgICAgICAgaWYgKGxhdGxuZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudG9vbHMuYXR0YWNoQmFja3dhcmRMaW5lR3VpZGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRvb2xzLmFuY2hvckJhY2t3YXJkTGluZUd1aWRlKGxhdGxuZ3NbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGFydERyYXdpbmdCYWNrd2FyZCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgY29udGludWVGb3J3YXJkKGxhdGxuZ3M/OiBBcnJheSlcbiAgICAgICAgLy8gU2V0IHVwIGRyYXdpbmcgdG9vbHMgdG8gY29udGludWUgdGhlIGxpbmUgZm9yd2FyZC5cbiAgICAgICAgY29udGludWVGb3J3YXJkOiBmdW5jdGlvbiAobGF0bG5ncykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZHJhd2luZygpKSByZXR1cm47XG4gICAgICAgICAgICBsYXRsbmdzID0gbGF0bG5ncyB8fCB0aGlzLmdldERlZmF1bHRMYXRMbmdzKCk7XG4gICAgICAgICAgICB0aGlzLnNldERyYXduTGF0TG5ncyhsYXRsbmdzKTtcbiAgICAgICAgICAgIGlmIChsYXRsbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvb2xzLmF0dGFjaEZvcndhcmRMaW5lR3VpZGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRvb2xzLmFuY2hvckZvcndhcmRMaW5lR3VpZGUobGF0bG5nc1tsYXRsbmdzLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhcnREcmF3aW5nRm9yd2FyZCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldERlZmF1bHRMYXRMbmdzOiBmdW5jdGlvbiAobGF0bG5ncykge1xuICAgICAgICAgICAgbGF0bG5ncyA9IGxhdGxuZ3MgfHwgdGhpcy5mZWF0dXJlLl9sYXRsbmdzO1xuICAgICAgICAgICAgaWYgKCFsYXRsbmdzLmxlbmd0aCB8fCBsYXRsbmdzWzBdIGluc3RhbmNlb2YgTC5MYXRMbmcpIHJldHVybiBsYXRsbmdzO1xuICAgICAgICAgICAgZWxzZSByZXR1cm4gdGhpcy5nZXREZWZhdWx0TGF0TG5ncyhsYXRsbmdzWzBdKTtcbiAgICAgICAgfSxcblxuICAgICAgICBlbnN1cmVNdWx0aTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmVhdHVyZS5fbGF0bG5ncy5sZW5ndGggJiYgTC5Qb2x5bGluZS5fZmxhdCh0aGlzLmZlYXR1cmUuX2xhdGxuZ3MpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mZWF0dXJlLl9sYXRsbmdzID0gW3RoaXMuZmVhdHVyZS5fbGF0bG5nc107XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkTmV3RW1wdHlTaGFwZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmVhdHVyZS5fbGF0bG5ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2hhcGUgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZFNoYXBlKHNoYXBlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2hhcGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZlYXR1cmUuX2xhdGxuZ3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0U2hhcGU6IGZ1bmN0aW9uIChzaGFwZSkge1xuICAgICAgICAgICAgaWYgKEwuUG9seWxpbmUuX2ZsYXQoc2hhcGUpKSByZXR1cm4gc2hhcGU7XG4gICAgICAgICAgICBlbHNlIGlmIChzaGFwZVswXSkgcmV0dXJuIHRoaXMuZm9ybWF0U2hhcGUoc2hhcGVbMF0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2Qgc3BsaXRTaGFwZShsYXRsbmdzPzogQXJyYXksIGluZGV4OiBpbnQpXG4gICAgICAgIC8vIFNwbGl0IHRoZSBnaXZlbiBgbGF0bG5nc2Agc2hhcGUgYXQgaW5kZXggYGluZGV4YCBhbmQgaW50ZWdyYXRlIG5ldyBzaGFwZSBpbiBpbnN0YW5jZSBgbGF0bG5nc2AuXG4gICAgICAgIHNwbGl0U2hhcGU6IGZ1bmN0aW9uIChzaGFwZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICghaW5kZXggfHwgaW5kZXggPj0gc2hhcGUubGVuZ3RoIC0gMSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVNdWx0aSgpO1xuICAgICAgICAgICAgdmFyIHNoYXBlSW5kZXggPSB0aGlzLmZlYXR1cmUuX2xhdGxuZ3MuaW5kZXhPZihzaGFwZSk7XG4gICAgICAgICAgICBpZiAoc2hhcGVJbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHNoYXBlLnNsaWNlKDAsIGluZGV4ICsgMSksXG4gICAgICAgICAgICAgICAgc2Vjb25kID0gc2hhcGUuc2xpY2UoaW5kZXgpO1xuICAgICAgICAgICAgLy8gV2UgZGVhbCB3aXRoIHJlZmVyZW5jZSwgd2UgZG9uJ3Qgd2FudCB0d2ljZSB0aGUgc2FtZSBsYXRsbmcgYXJvdW5kLlxuICAgICAgICAgICAgc2Vjb25kWzBdID0gTC5sYXRMbmcoc2Vjb25kWzBdLmxhdCwgc2Vjb25kWzBdLmxuZywgc2Vjb25kWzBdLmFsdCk7XG4gICAgICAgICAgICB0aGlzLmZlYXR1cmUuX2xhdGxuZ3Muc3BsaWNlKHNoYXBlSW5kZXgsIDEsIGZpcnN0LCBzZWNvbmQpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZTsg8J+NgmNsYXNzIFBvbHlnb25FZGl0b3I7IPCfjYJha2EgTC5FZGl0YWJsZS5Qb2x5Z29uRWRpdG9yXG4gICAgLy8g8J+NgmluaGVyaXRzIFBhdGhFZGl0b3JcbiAgICBMLkVkaXRhYmxlLlBvbHlnb25FZGl0b3IgPSBMLkVkaXRhYmxlLlBhdGhFZGl0b3IuZXh0ZW5kKHtcblxuICAgICAgICBDTE9TRUQ6IHRydWUsXG4gICAgICAgIE1JTl9WRVJURVg6IDMsXG5cbiAgICAgICAgbmV3UG9pbnRGb3J3YXJkOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgICAgICBMLkVkaXRhYmxlLlBhdGhFZGl0b3IucHJvdG90eXBlLm5ld1BvaW50Rm9yd2FyZC5jYWxsKHRoaXMsIGxhdGxuZyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMudG9vbHMuYmFja3dhcmRMaW5lR3VpZGUuX2xhdGxuZ3MubGVuZ3RoKSB0aGlzLnRvb2xzLmFuY2hvckJhY2t3YXJkTGluZUd1aWRlKGxhdGxuZyk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZHJhd25MYXRMbmdzLmxlbmd0aCA9PT0gMikgdGhpcy50b29scy5hdHRhY2hCYWNrd2FyZExpbmVHdWlkZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZE5ld0VtcHR5SG9sZTogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVOb3RGbGF0KCk7XG4gICAgICAgICAgICB2YXIgbGF0bG5ncyA9IHRoaXMuZmVhdHVyZS5zaGFwZUF0KGxhdGxuZyk7XG4gICAgICAgICAgICBpZiAoIWxhdGxuZ3MpIHJldHVybjtcbiAgICAgICAgICAgIHZhciBob2xlcyA9IFtdO1xuICAgICAgICAgICAgbGF0bG5ncy5wdXNoKGhvbGVzKTtcbiAgICAgICAgICAgIHJldHVybiBob2xlcztcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIG5ld0hvbGUobGF0bG5nPzogTC5MYXRMbmcsIGluZGV4OiBpbnQpXG4gICAgICAgIC8vIFNldCB1cCBkcmF3aW5nIHRvb2xzIGZvciBjcmVhdGluZyBhIG5ldyBob2xlIG9uIHRoZSBQb2x5Z29uLiBJZiB0aGUgYGxhdGxuZ2AgcGFyYW0gaXMgZ2l2ZW4sIGEgZmlyc3QgcG9pbnQgaXMgY3JlYXRlZC5cbiAgICAgICAgbmV3SG9sZTogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICAgICAgdmFyIGhvbGVzID0gdGhpcy5hZGROZXdFbXB0eUhvbGUobGF0bG5nKTtcbiAgICAgICAgICAgIGlmICghaG9sZXMpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuc2V0RHJhd25MYXRMbmdzKGhvbGVzKTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnREcmF3aW5nRm9yd2FyZCgpO1xuICAgICAgICAgICAgaWYgKGxhdGxuZykgdGhpcy5uZXdQb2ludEZvcndhcmQobGF0bG5nKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGROZXdFbXB0eVNoYXBlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5mZWF0dXJlLl9sYXRsbmdzLmxlbmd0aCAmJiB0aGlzLmZlYXR1cmUuX2xhdGxuZ3NbMF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNoYXBlID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRTaGFwZShzaGFwZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoYXBlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mZWF0dXJlLl9sYXRsbmdzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGVuc3VyZU11bHRpOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5mZWF0dXJlLl9sYXRsbmdzLmxlbmd0aCAmJiBMLlBvbHlsaW5lLl9mbGF0KHRoaXMuZmVhdHVyZS5fbGF0bG5nc1swXSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZlYXR1cmUuX2xhdGxuZ3MgPSBbdGhpcy5mZWF0dXJlLl9sYXRsbmdzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBlbnN1cmVOb3RGbGF0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZmVhdHVyZS5fbGF0bG5ncy5sZW5ndGggfHwgTC5Qb2x5bGluZS5fZmxhdCh0aGlzLmZlYXR1cmUuX2xhdGxuZ3MpKSB0aGlzLmZlYXR1cmUuX2xhdGxuZ3MgPSBbdGhpcy5mZWF0dXJlLl9sYXRsbmdzXTtcbiAgICAgICAgfSxcblxuICAgICAgICB2ZXJ0ZXhDYW5CZURlbGV0ZWQ6IGZ1bmN0aW9uICh2ZXJ0ZXgpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmZlYXR1cmUucGFyZW50U2hhcGUodmVydGV4LmxhdGxuZ3MpLFxuICAgICAgICAgICAgICAgIGlkeCA9IEwuVXRpbC5pbmRleE9mKHBhcmVudCwgdmVydGV4LmxhdGxuZ3MpO1xuICAgICAgICAgICAgaWYgKGlkeCA+IDApIHJldHVybiB0cnVlOyAgLy8gSG9sZXMgY2FuIGJlIHRvdGFsbHkgZGVsZXRlZCB3aXRob3V0IHJlbW92aW5nIHRoZSBsYXllciBpdHNlbGYuXG4gICAgICAgICAgICByZXR1cm4gTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS52ZXJ0ZXhDYW5CZURlbGV0ZWQuY2FsbCh0aGlzLCB2ZXJ0ZXgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldERlZmF1bHRMYXRMbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZmVhdHVyZS5fbGF0bG5ncy5sZW5ndGgpIHRoaXMuZmVhdHVyZS5fbGF0bG5ncy5wdXNoKFtdKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZlYXR1cmUuX2xhdGxuZ3NbMF07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0U2hhcGU6IGZ1bmN0aW9uIChzaGFwZSkge1xuICAgICAgICAgICAgLy8gW1sxLCAyXSwgWzMsIDRdXSA9PiBtdXN0IGJlIG5lc3RlZFxuICAgICAgICAgICAgLy8gW10gPT4gbXVzdCBiZSBuZXN0ZWRcbiAgICAgICAgICAgIC8vIFtbXV0gPT4gaXMgYWxyZWFkeSBuZXN0ZWRcbiAgICAgICAgICAgIGlmIChMLlBvbHlsaW5lLl9mbGF0KHNoYXBlKSAmJiAoIXNoYXBlWzBdIHx8IHNoYXBlWzBdLmxlbmd0aCAhPT0gMCkpIHJldHVybiBbc2hhcGVdO1xuICAgICAgICAgICAgZWxzZSByZXR1cm4gc2hhcGU7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZTsg8J+NgmNsYXNzIFJlY3RhbmdsZUVkaXRvcjsg8J+NgmFrYSBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvclxuICAgIC8vIPCfjYJpbmhlcml0cyBQYXRoRWRpdG9yXG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IgPSBMLkVkaXRhYmxlLlBhdGhFZGl0b3IuZXh0ZW5kKHtcblxuICAgICAgICBDTE9TRUQ6IHRydWUsXG4gICAgICAgIE1JTl9WRVJURVg6IDQsXG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgc2tpcE1pZGRsZU1hcmtlcnM6IHRydWVcbiAgICAgICAgfSxcblxuICAgICAgICBleHRlbmRCb3VuZHM6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBlLnZlcnRleC5nZXRJbmRleCgpLFxuICAgICAgICAgICAgICAgIG5leHQgPSBlLnZlcnRleC5nZXROZXh0KCksXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgPSBlLnZlcnRleC5nZXRQcmV2aW91cygpLFxuICAgICAgICAgICAgICAgIG9wcG9zaXRlSW5kZXggPSAoaW5kZXggKyAyKSAlIDQsXG4gICAgICAgICAgICAgICAgb3Bwb3NpdGUgPSBlLnZlcnRleC5sYXRsbmdzW29wcG9zaXRlSW5kZXhdLFxuICAgICAgICAgICAgICAgIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhlLmxhdGxuZywgb3Bwb3NpdGUpO1xuICAgICAgICAgICAgLy8gVXBkYXRlIGxhdGxuZ3MgYnkgaGFuZCB0byBwcmVzZXJ2ZSBvcmRlci5cbiAgICAgICAgICAgIHByZXZpb3VzLmxhdGxuZy51cGRhdGUoW2UubGF0bG5nLmxhdCwgb3Bwb3NpdGUubG5nXSk7XG4gICAgICAgICAgICBuZXh0LmxhdGxuZy51cGRhdGUoW29wcG9zaXRlLmxhdCwgZS5sYXRsbmcubG5nXSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUJvdW5kcyhib3VuZHMpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoVmVydGV4TWFya2VycygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRHJhd2luZ01vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIEwuRWRpdGFibGUuUGF0aEVkaXRvci5wcm90b3R5cGUub25EcmF3aW5nTW91c2VEb3duLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3QoKTtcbiAgICAgICAgICAgIHZhciBsYXRsbmdzID0gdGhpcy5nZXREZWZhdWx0TGF0TG5ncygpO1xuICAgICAgICAgICAgLy8gTC5Qb2x5Z29uLl9jb252ZXJ0TGF0TG5ncyByZW1vdmVzIGxhc3QgbGF0bG5nIGlmIGl0IGVxdWFscyBmaXJzdCBwb2ludCxcbiAgICAgICAgICAgIC8vIHdoaWNoIGlzIHRoZSBjYXNlIGhlcmUgYXMgYWxsIGxhdGxuZ3MgYXJlIFswLCAwXVxuICAgICAgICAgICAgaWYgKGxhdGxuZ3MubGVuZ3RoID09PSAzKSBsYXRsbmdzLnB1c2goZS5sYXRsbmcpO1xuICAgICAgICAgICAgdmFyIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhlLmxhdGxuZywgZS5sYXRsbmcpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVCb3VuZHMoYm91bmRzKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF0TG5ncyhib3VuZHMpO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAvLyBTdG9wIGRyYWdnaW5nIG1hcC5cbiAgICAgICAgICAgIC8vIEwuRHJhZ2dhYmxlIGhhcyB0d28gd29ya2Zsb3dzOlxuICAgICAgICAgICAgLy8gLSBtb3VzZWRvd24gPT4gbW91c2Vtb3ZlID0+IG1vdXNldXBcbiAgICAgICAgICAgIC8vIC0gdG91Y2hzdGFydCA9PiB0b3VjaG1vdmUgPT4gdG91Y2hlbmRcbiAgICAgICAgICAgIC8vIFByb2JsZW06IEwuTWFwLlRhcCBkb2VzIG5vdCBhbGxvdyB1cyB0byBsaXN0ZW4gdG8gdG91Y2hzdGFydCwgc28gd2Ugb25seVxuICAgICAgICAgICAgLy8gY2FuIGRlYWwgd2l0aCBtb3VzZWRvd24sIGJ1dCB0aGVuIHdoZW4gaW4gYSB0b3VjaCBkZXZpY2UsIHdlIGFyZSBkZWFsaW5nIHdpdGhcbiAgICAgICAgICAgIC8vIHNpbXVsYXRlZCBldmVudHMgKGFjdHVhbGx5IHNpbXVsYXRlZCBieSBMLk1hcC5UYXApLCB3aGljaCBhcmUgbm8gbW9yZSB0YWtlblxuICAgICAgICAgICAgLy8gaW50byBhY2NvdW50IGJ5IEwuRHJhZ2dhYmxlLlxuICAgICAgICAgICAgLy8gUmVmLjogaHR0cHM6Ly9naXRodWIuY29tL0xlYWZsZXQvTGVhZmxldC5FZGl0YWJsZS9pc3N1ZXMvMTAzXG4gICAgICAgICAgICBlLm9yaWdpbmFsRXZlbnQuX3NpbXVsYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5tYXAuZHJhZ2dpbmcuX2RyYWdnYWJsZS5fb25VcChlLm9yaWdpbmFsRXZlbnQpO1xuICAgICAgICAgICAgLy8gTm93IHRyYW5zZmVyIG9uZ29pbmcgZHJhZyBhY3Rpb24gdG8gdGhlIGJvdHRvbSByaWdodCBjb3JuZXIuXG4gICAgICAgICAgICAvLyBTaG91bGQgd2UgcmVmaW5lIHdoaWNoIGNvcm5lIHdpbGwgaGFuZGxlIHRoZSBkcmFnIGFjY29yZGluZyB0b1xuICAgICAgICAgICAgLy8gZHJhZyBkaXJlY3Rpb24/XG4gICAgICAgICAgICBsYXRsbmdzWzNdLl9fdmVydGV4LmRyYWdnaW5nLl9kcmFnZ2FibGUuX29uRG93bihlLm9yaWdpbmFsRXZlbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRHJhd2luZ01vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbW1pdERyYXdpbmcoZSk7XG4gICAgICAgICAgICBlLm9yaWdpbmFsRXZlbnQuX3NpbXVsYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS5vbkRyYXdpbmdNb3VzZVVwLmNhbGwodGhpcywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmF3aW5nTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5vcmlnaW5hbEV2ZW50Ll9zaW11bGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIEwuRWRpdGFibGUuUGF0aEVkaXRvci5wcm90b3R5cGUub25EcmF3aW5nTW91c2VNb3ZlLmNhbGwodGhpcywgZSk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICBnZXREZWZhdWx0TGF0TG5nczogZnVuY3Rpb24gKGxhdGxuZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBsYXRsbmdzIHx8IHRoaXMuZmVhdHVyZS5fbGF0bG5nc1swXTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVCb3VuZHM6IGZ1bmN0aW9uIChib3VuZHMpIHtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZS5fYm91bmRzID0gYm91bmRzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUxhdExuZ3M6IGZ1bmN0aW9uIChib3VuZHMpIHtcbiAgICAgICAgICAgIHZhciBsYXRsbmdzID0gdGhpcy5nZXREZWZhdWx0TGF0TG5ncygpLFxuICAgICAgICAgICAgICAgIG5ld0xhdGxuZ3MgPSB0aGlzLmZlYXR1cmUuX2JvdW5kc1RvTGF0TG5ncyhib3VuZHMpO1xuICAgICAgICAgICAgLy8gS2VlcCByZWZlcmVuY2VzLlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXRsbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGF0bG5nc1tpXS51cGRhdGUobmV3TGF0bG5nc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8g8J+Ngm5hbWVzcGFjZSBFZGl0YWJsZTsg8J+NgmNsYXNzIENpcmNsZUVkaXRvcjsg8J+NgmFrYSBMLkVkaXRhYmxlLkNpcmNsZUVkaXRvclxuICAgIC8vIPCfjYJpbmhlcml0cyBQYXRoRWRpdG9yXG4gICAgTC5FZGl0YWJsZS5DaXJjbGVFZGl0b3IgPSBMLkVkaXRhYmxlLlBhdGhFZGl0b3IuZXh0ZW5kKHtcblxuICAgICAgICBNSU5fVkVSVEVYOiAyLFxuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHNraXBNaWRkbGVNYXJrZXJzOiB0cnVlXG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG1hcCwgZmVhdHVyZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbWFwLCBmZWF0dXJlLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2l6ZUxhdExuZyA9IHRoaXMuY29tcHV0ZVJlc2l6ZUxhdExuZygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNvbXB1dGVSZXNpemVMYXRMbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFdoaWxlIGNpcmNsZSBpcyBub3QgYWRkZWQgdG8gdGhlIG1hcCwgX3JhZGl1cyBpcyBub3Qgc2V0LlxuICAgICAgICAgICAgdmFyIGRlbHRhID0gKHRoaXMuZmVhdHVyZS5fcmFkaXVzIHx8IHRoaXMuZmVhdHVyZS5fbVJhZGl1cykgKiBNYXRoLmNvcyhNYXRoLlBJIC8gNCksXG4gICAgICAgICAgICAgICAgcG9pbnQgPSB0aGlzLm1hcC5wcm9qZWN0KHRoaXMuZmVhdHVyZS5fbGF0bG5nKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcC51bnByb2plY3QoW3BvaW50LnggKyBkZWx0YSwgcG9pbnQueSAtIGRlbHRhXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlUmVzaXplTGF0TG5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNpemVMYXRMbmcudXBkYXRlKHRoaXMuY29tcHV0ZVJlc2l6ZUxhdExuZygpKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2l6ZUxhdExuZy5fX3ZlcnRleC51cGRhdGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRMYXRMbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMuZmVhdHVyZS5fbGF0bG5nLCB0aGlzLl9yZXNpemVMYXRMbmddO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldERlZmF1bHRMYXRMbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRMYXRMbmdzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25WZXJ0ZXhNYXJrZXJEcmFnOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGUudmVydGV4LmdldEluZGV4KCkgPT09IDEpIHRoaXMucmVzaXplKGUpO1xuICAgICAgICAgICAgZWxzZSB0aGlzLnVwZGF0ZVJlc2l6ZUxhdExuZyhlKTtcbiAgICAgICAgICAgIEwuRWRpdGFibGUuUGF0aEVkaXRvci5wcm90b3R5cGUub25WZXJ0ZXhNYXJrZXJEcmFnLmNhbGwodGhpcywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzaXplOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHJhZGl1cyA9IHRoaXMuZmVhdHVyZS5fbGF0bG5nLmRpc3RhbmNlVG8oZS5sYXRsbmcpXG4gICAgICAgICAgICB0aGlzLmZlYXR1cmUuc2V0UmFkaXVzKHJhZGl1cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmF3aW5nTW91c2VEb3duOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS5vbkRyYXdpbmdNb3VzZURvd24uY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2l6ZUxhdExuZy51cGRhdGUoZS5sYXRsbmcpO1xuICAgICAgICAgICAgdGhpcy5mZWF0dXJlLl9sYXRsbmcudXBkYXRlKGUubGF0bG5nKTtcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdCgpO1xuICAgICAgICAgICAgLy8gU3RvcCBkcmFnZ2luZyBtYXAuXG4gICAgICAgICAgICBlLm9yaWdpbmFsRXZlbnQuX3NpbXVsYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5tYXAuZHJhZ2dpbmcuX2RyYWdnYWJsZS5fb25VcChlLm9yaWdpbmFsRXZlbnQpO1xuICAgICAgICAgICAgLy8gTm93IHRyYW5zZmVyIG9uZ29pbmcgZHJhZyBhY3Rpb24gdG8gdGhlIHJhZGl1cyBoYW5kbGVyLlxuICAgICAgICAgICAgdGhpcy5fcmVzaXplTGF0TG5nLl9fdmVydGV4LmRyYWdnaW5nLl9kcmFnZ2FibGUuX29uRG93bihlLm9yaWdpbmFsRXZlbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRHJhd2luZ01vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbW1pdERyYXdpbmcoZSk7XG4gICAgICAgICAgICBlLm9yaWdpbmFsRXZlbnQuX3NpbXVsYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS5vbkRyYXdpbmdNb3VzZVVwLmNhbGwodGhpcywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmF3aW5nTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5vcmlnaW5hbEV2ZW50Ll9zaW11bGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIEwuRWRpdGFibGUuUGF0aEVkaXRvci5wcm90b3R5cGUub25EcmF3aW5nTW91c2VNb3ZlLmNhbGwodGhpcywgZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS5vbkRyYWcuY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZS5kcmFnZ2luZy51cGRhdGVMYXRMbmcodGhpcy5fcmVzaXplTGF0TG5nKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAvLyDwn42CbmFtZXNwYWNlIEVkaXRhYmxlOyDwn42CY2xhc3MgRWRpdGFibGVNaXhpblxuICAgIC8vIGBFZGl0YWJsZU1peGluYCBpcyBpbmNsdWRlZCB0byBgTC5Qb2x5bGluZWAsIGBMLlBvbHlnb25gLCBgTC5SZWN0YW5nbGVgLCBgTC5DaXJjbGVgXG4gICAgLy/CoGFuZCBgTC5NYXJrZXJgLiBJdCBhZGRzIHNvbWUgbWV0aG9kcyB0byB0aGVtLlxuICAgIC8vICpXaGVuIGVkaXRpbmcgaXMgZW5hYmxlZCwgdGhlIGVkaXRvciBpcyBhY2Nlc3NpYmxlIG9uIHRoZSBpbnN0YW5jZSB3aXRoIHRoZVxuICAgIC8vIGBlZGl0b3JgIHByb3BlcnR5LipcbiAgICB2YXIgRWRpdGFibGVNaXhpbiA9IHtcblxuICAgICAgICBjcmVhdGVFZGl0b3I6IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgICAgIG1hcCA9IG1hcCB8fCB0aGlzLl9tYXA7XG4gICAgICAgICAgICB2YXIgdG9vbHMgPSAodGhpcy5vcHRpb25zLmVkaXRPcHRpb25zIHx8IHt9KS5lZGl0VG9vbHMgfHwgbWFwLmVkaXRUb29scztcbiAgICAgICAgICAgIGlmICghdG9vbHMpIHRocm93IEVycm9yKCdVbmFibGUgdG8gZGV0ZWN0IEVkaXRhYmxlIGluc3RhbmNlLicpXG4gICAgICAgICAgICB2YXIgS2xhc3MgPSB0aGlzLm9wdGlvbnMuZWRpdG9yQ2xhc3MgfHwgdGhpcy5nZXRFZGl0b3JDbGFzcyh0b29scyk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEtsYXNzKG1hcCwgdGhpcywgdGhpcy5vcHRpb25zLmVkaXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIGVuYWJsZUVkaXQobWFwPzogTC5NYXApOiB0aGlzLmVkaXRvclxuICAgICAgICAvLyBFbmFibGUgZWRpdGluZywgYnkgY3JlYXRpbmcgYW4gZWRpdG9yIGlmIG5vdCBleGlzdGluZywgYW5kIHRoZW4gY2FsbGluZyBgZW5hYmxlYCBvbiBpdC5cbiAgICAgICAgZW5hYmxlRWRpdDogZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmVkaXRvcikgdGhpcy5jcmVhdGVFZGl0b3IobWFwKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmVuYWJsZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIPCfjYJtZXRob2QgZWRpdEVuYWJsZWQoKTogYm9vbGVhblxuICAgICAgICAvLyBSZXR1cm4gdHJ1ZSBpZiBjdXJyZW50IGluc3RhbmNlIGhhcyBhbiBlZGl0b3IgYXR0YWNoZWQsIGFuZCB0aGlzIGVkaXRvciBpcyBlbmFibGVkLlxuICAgICAgICBlZGl0RW5hYmxlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yICYmIHRoaXMuZWRpdG9yLmVuYWJsZWQoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDwn42CbWV0aG9kIGRpc2FibGVFZGl0KClcbiAgICAgICAgLy8gRGlzYWJsZSBlZGl0aW5nLCBhbHNvIHJlbW92ZSB0aGUgZWRpdG9yIHByb3BlcnR5IHJlZmVyZW5jZS5cbiAgICAgICAgZGlzYWJsZUVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yLmRpc2FibGUoKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5lZGl0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g8J+Ngm1ldGhvZCB0b2dnbGVFZGl0KClcbiAgICAgICAgLy8gRW5hYmxlIG9yIGRpc2FibGUgZWRpdGluZywgYWNjb3JkaW5nIHRvIGN1cnJlbnQgc3RhdHVzLlxuICAgICAgICB0b2dnbGVFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0RW5hYmxlZCgpKSB0aGlzLmRpc2FibGVFZGl0KCk7XG4gICAgICAgICAgICBlbHNlIHRoaXMuZW5hYmxlRWRpdCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9vbkVkaXRhYmxlQWRkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3IpIHRoaXMuZW5hYmxlRWRpdCgpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgdmFyIFBvbHlsaW5lTWl4aW4gPSB7XG5cbiAgICAgICAgZ2V0RWRpdG9yQ2xhc3M6IGZ1bmN0aW9uICh0b29scykge1xuICAgICAgICAgICAgcmV0dXJuICh0b29scyAmJiB0b29scy5vcHRpb25zLnBvbHlsaW5lRWRpdG9yQ2xhc3MpID8gdG9vbHMub3B0aW9ucy5wb2x5bGluZUVkaXRvckNsYXNzIDogTC5FZGl0YWJsZS5Qb2x5bGluZUVkaXRvcjtcbiAgICAgICAgfSxcblxuICAgICAgICBzaGFwZUF0OiBmdW5jdGlvbiAobGF0bG5nLCBsYXRsbmdzKSB7XG4gICAgICAgICAgICAvLyBXZSBjYW4gaGF2ZSB0aG9zZSBjYXNlczpcbiAgICAgICAgICAgIC8vIC0gbGF0bG5ncyBhcmUganVzdCBhIGZsYXQgYXJyYXkgb2YgbGF0bG5ncywgdXNlIHRoaXNcbiAgICAgICAgICAgIC8vIC0gbGF0bG5ncyBpcyBhbiBhcnJheSBvZiBhcnJheXMgb2YgbGF0bG5ncywgbG9vcCBvdmVyXG4gICAgICAgICAgICB2YXIgc2hhcGUgPSBudWxsO1xuICAgICAgICAgICAgbGF0bG5ncyA9IGxhdGxuZ3MgfHwgdGhpcy5fbGF0bG5ncztcbiAgICAgICAgICAgIGlmICghbGF0bG5ncy5sZW5ndGgpIHJldHVybiBzaGFwZTtcbiAgICAgICAgICAgIGVsc2UgaWYgKEwuUG9seWxpbmUuX2ZsYXQobGF0bG5ncykgJiYgdGhpcy5pc0luTGF0TG5ncyhsYXRsbmcsIGxhdGxuZ3MpKSBzaGFwZSA9IGxhdGxuZ3M7XG4gICAgICAgICAgICBlbHNlIGZvciAodmFyIGkgPSAwOyBpIDwgbGF0bG5ncy5sZW5ndGg7IGkrKykgaWYgKHRoaXMuaXNJbkxhdExuZ3MobGF0bG5nLCBsYXRsbmdzW2ldKSkgcmV0dXJuIGxhdGxuZ3NbaV07XG4gICAgICAgICAgICByZXR1cm4gc2hhcGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNJbkxhdExuZ3M6IGZ1bmN0aW9uIChsLCBsYXRsbmdzKSB7XG4gICAgICAgICAgICBpZiAoIWxhdGxuZ3MpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHZhciBpLCBrLCBsZW4sIHBhcnQgPSBbXSwgcCxcbiAgICAgICAgICAgICAgICB3ID0gdGhpcy5fY2xpY2tUb2xlcmFuY2UoKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3RMYXRsbmdzKGxhdGxuZ3MsIHBhcnQsIHRoaXMuX3B4Qm91bmRzKTtcbiAgICAgICAgICAgIHBhcnQgPSBwYXJ0WzBdO1xuICAgICAgICAgICAgcCA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQobCk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5fcHhCb3VuZHMuY29udGFpbnMocCkpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgICAgICBmb3IgKGkgPSAxLCBsZW4gPSBwYXJ0Lmxlbmd0aCwgayA9IDA7IGkgPCBsZW47IGsgPSBpKyspIHtcblxuICAgICAgICAgICAgICAgIGlmIChMLkxpbmVVdGlsLnBvaW50VG9TZWdtZW50RGlzdGFuY2UocCwgcGFydFtrXSwgcGFydFtpXSkgPD0gdykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICB2YXIgUG9seWdvbk1peGluID0ge1xuXG4gICAgICAgIGdldEVkaXRvckNsYXNzOiBmdW5jdGlvbiAodG9vbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAodG9vbHMgJiYgdG9vbHMub3B0aW9ucy5wb2x5Z29uRWRpdG9yQ2xhc3MpID8gdG9vbHMub3B0aW9ucy5wb2x5Z29uRWRpdG9yQ2xhc3MgOiBMLkVkaXRhYmxlLlBvbHlnb25FZGl0b3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hhcGVBdDogZnVuY3Rpb24gKGxhdGxuZywgbGF0bG5ncykge1xuICAgICAgICAgICAgLy8gV2UgY2FuIGhhdmUgdGhvc2UgY2FzZXM6XG4gICAgICAgICAgICAvLyAtIGxhdGxuZ3MgYXJlIGp1c3QgYSBmbGF0IGFycmF5IG9mIGxhdGxuZ3MsIHVzZSB0aGlzXG4gICAgICAgICAgICAvLyAtIGxhdGxuZ3MgaXMgYW4gYXJyYXkgb2YgYXJyYXlzIG9mIGxhdGxuZ3MsIHRoaXMgaXMgYSBzaW1wbGUgcG9seWdvbiAobWF5YmUgd2l0aCBob2xlcyksIHVzZSB0aGUgZmlyc3RcbiAgICAgICAgICAgIC8vIC0gbGF0bG5ncyBpcyBhbiBhcnJheSBvZiBhcnJheXMgb2YgYXJyYXlzLCB0aGlzIGlzIGEgbXVsdGksIGxvb3Agb3ZlclxuICAgICAgICAgICAgdmFyIHNoYXBlID0gbnVsbDtcbiAgICAgICAgICAgIGxhdGxuZ3MgPSBsYXRsbmdzIHx8IHRoaXMuX2xhdGxuZ3M7XG4gICAgICAgICAgICBpZiAoIWxhdGxuZ3MubGVuZ3RoKSByZXR1cm4gc2hhcGU7XG4gICAgICAgICAgICBlbHNlIGlmIChMLlBvbHlsaW5lLl9mbGF0KGxhdGxuZ3MpICYmIHRoaXMuaXNJbkxhdExuZ3MobGF0bG5nLCBsYXRsbmdzKSkgc2hhcGUgPSBsYXRsbmdzO1xuICAgICAgICAgICAgZWxzZSBpZiAoTC5Qb2x5bGluZS5fZmxhdChsYXRsbmdzWzBdKSAmJiB0aGlzLmlzSW5MYXRMbmdzKGxhdGxuZywgbGF0bG5nc1swXSkpIHNoYXBlID0gbGF0bG5ncztcbiAgICAgICAgICAgIGVsc2UgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXRsbmdzLmxlbmd0aDsgaSsrKSBpZiAodGhpcy5pc0luTGF0TG5ncyhsYXRsbmcsIGxhdGxuZ3NbaV1bMF0pKSByZXR1cm4gbGF0bG5nc1tpXTtcbiAgICAgICAgICAgIHJldHVybiBzaGFwZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0luTGF0TG5nczogZnVuY3Rpb24gKGwsIGxhdGxuZ3MpIHtcbiAgICAgICAgICAgIHZhciBpbnNpZGUgPSBmYWxzZSwgbDEsIGwyLCBqLCBrLCBsZW4yO1xuXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW4yID0gbGF0bG5ncy5sZW5ndGgsIGsgPSBsZW4yIC0gMTsgaiA8IGxlbjI7IGsgPSBqKyspIHtcbiAgICAgICAgICAgICAgICBsMSA9IGxhdGxuZ3Nbal07XG4gICAgICAgICAgICAgICAgbDIgPSBsYXRsbmdzW2tdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCgobDEubGF0ID4gbC5sYXQpICE9PSAobDIubGF0ID4gbC5sYXQpKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGwubG5nIDwgKGwyLmxuZyAtIGwxLmxuZykgKiAobC5sYXQgLSBsMS5sYXQpIC8gKGwyLmxhdCAtIGwxLmxhdCkgKyBsMS5sbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZSA9ICFpbnNpZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaW5zaWRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcmVudFNoYXBlOiBmdW5jdGlvbiAoc2hhcGUsIGxhdGxuZ3MpIHtcbiAgICAgICAgICAgIGxhdGxuZ3MgPSBsYXRsbmdzIHx8IHRoaXMuX2xhdGxuZ3M7XG4gICAgICAgICAgICBpZiAoIWxhdGxuZ3MpIHJldHVybjtcbiAgICAgICAgICAgIHZhciBpZHggPSBMLlV0aWwuaW5kZXhPZihsYXRsbmdzLCBzaGFwZSk7XG4gICAgICAgICAgICBpZiAoaWR4ICE9PSAtMSkgcmV0dXJuIGxhdGxuZ3M7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhdGxuZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZHggPSBMLlV0aWwuaW5kZXhPZihsYXRsbmdzW2ldLCBzaGFwZSk7XG4gICAgICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHJldHVybiBsYXRsbmdzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbiAgICB2YXIgTWFya2VyTWl4aW4gPSB7XG5cbiAgICAgICAgZ2V0RWRpdG9yQ2xhc3M6IGZ1bmN0aW9uICh0b29scykge1xuICAgICAgICAgICAgcmV0dXJuICh0b29scyAmJiB0b29scy5vcHRpb25zLm1hcmtlckVkaXRvckNsYXNzKSA/IHRvb2xzLm9wdGlvbnMubWFya2VyRWRpdG9yQ2xhc3MgOiBMLkVkaXRhYmxlLk1hcmtlckVkaXRvcjtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIHZhciBSZWN0YW5nbGVNaXhpbiA9IHtcblxuICAgICAgICBnZXRFZGl0b3JDbGFzczogZnVuY3Rpb24gKHRvb2xzKSB7XG4gICAgICAgICAgICByZXR1cm4gKHRvb2xzICYmIHRvb2xzLm9wdGlvbnMucmVjdGFuZ2xlRWRpdG9yQ2xhc3MpID8gdG9vbHMub3B0aW9ucy5yZWN0YW5nbGVFZGl0b3JDbGFzcyA6IEwuRWRpdGFibGUuUmVjdGFuZ2xlRWRpdG9yO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgdmFyIENpcmNsZU1peGluID0ge1xuXG4gICAgICAgIGdldEVkaXRvckNsYXNzOiBmdW5jdGlvbiAodG9vbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAodG9vbHMgJiYgdG9vbHMub3B0aW9ucy5jaXJjbGVFZGl0b3JDbGFzcykgPyB0b29scy5vcHRpb25zLmNpcmNsZUVkaXRvckNsYXNzIDogTC5FZGl0YWJsZS5DaXJjbGVFZGl0b3I7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICB2YXIga2VlcEVkaXRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBNYWtlIHN1cmUgeW91IGNhbiByZW1vdmUvcmVhZGQgYW4gZWRpdGFibGUgbGF5ZXIuXG4gICAgICAgIHRoaXMub24oJ2FkZCcsIHRoaXMuX29uRWRpdGFibGVBZGQpO1xuICAgIH07XG5cblxuXG4gICAgaWYgKEwuUG9seWxpbmUpIHtcbiAgICAgICAgTC5Qb2x5bGluZS5pbmNsdWRlKEVkaXRhYmxlTWl4aW4pO1xuICAgICAgICBMLlBvbHlsaW5lLmluY2x1ZGUoUG9seWxpbmVNaXhpbik7XG4gICAgICAgIEwuUG9seWxpbmUuYWRkSW5pdEhvb2soa2VlcEVkaXRhYmxlKTtcbiAgICB9XG4gICAgaWYgKEwuUG9seWdvbikge1xuICAgICAgICBMLlBvbHlnb24uaW5jbHVkZShFZGl0YWJsZU1peGluKTtcbiAgICAgICAgTC5Qb2x5Z29uLmluY2x1ZGUoUG9seWdvbk1peGluKTtcbiAgICB9XG4gICAgaWYgKEwuTWFya2VyKSB7XG4gICAgICAgIEwuTWFya2VyLmluY2x1ZGUoRWRpdGFibGVNaXhpbik7XG4gICAgICAgIEwuTWFya2VyLmluY2x1ZGUoTWFya2VyTWl4aW4pO1xuICAgICAgICBMLk1hcmtlci5hZGRJbml0SG9vayhrZWVwRWRpdGFibGUpO1xuICAgIH1cbiAgICBpZiAoTC5SZWN0YW5nbGUpIHtcbiAgICAgICAgTC5SZWN0YW5nbGUuaW5jbHVkZShFZGl0YWJsZU1peGluKTtcbiAgICAgICAgTC5SZWN0YW5nbGUuaW5jbHVkZShSZWN0YW5nbGVNaXhpbik7XG4gICAgfVxuICAgIGlmIChMLkNpcmNsZSkge1xuICAgICAgICBMLkNpcmNsZS5pbmNsdWRlKEVkaXRhYmxlTWl4aW4pO1xuICAgICAgICBMLkNpcmNsZS5pbmNsdWRlKENpcmNsZU1peGluKTtcbiAgICB9XG5cbiAgICBMLkxhdExuZy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICBsYXRsbmcgPSBMLmxhdExuZyhsYXRsbmcpO1xuICAgICAgICB0aGlzLmxhdCA9IGxhdGxuZy5sYXQ7XG4gICAgICAgIHRoaXMubG5nID0gbGF0bG5nLmxuZztcbiAgICB9XG5cbn0sIHdpbmRvdykpO1xuIl0sImZpbGUiOiJwbHVnaW5zL0xlYWZsZXQvTGVhZmxldC5FZGl0YWJsZS5qcyJ9
