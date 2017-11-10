/*
 * Leaflet Location Picker v0.2.3 - 2015-09-03
 *
 * Copyright 2015 Stefano Cudini
 * stefano.cudini@gmail.com
 * http://labs.easyblog.it/
 *
 * Licensed under the MIT license.
 *
 * Demo:
 * http://labs.easyblog.it/maps/leaflet-locationpicker/
 *
 * Source:
 * git@github.com:stefanocudini/leaflet-locationpicker.git
 *
 */
/*
TODO
(function(factory){
    if (typeof define === "function" && define.amd) {
        define(['jquery','leaflet'], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery'), require('leaflet'));
    } else {
        factory(jQuery, L);
    }
}*/

/*
 * Leaflet Control Search v2.7.0 - 2016-09-13
 *
 * Copyright 2016 Stefano Cudini
 * stefano.cudini@gmail.com
 * http://labs.easyblog.it/
 *
 * Licensed under the MIT license.
 *
 * Demo:
 * http://labs.easyblog.it/maps/leaflet-search/
 *
 * Source:
 * git@github.com:stefanocudini/leaflet-search.git
 *
 */
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

    var $ = jQuery;

    $.fn.leafletLocationPicker = function(opts, onChangeLocation) {

        var http = window.location.protocol;

        var baseClassName = 'leaflet-locpicker',
            baseLayers = {
                //'OSM': http + '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'OSM': 'http://www.google.cn/maps/vt?lyrs=p,m&hl={language}&x={x}&y={y}&z={z}',
                //'SAT': http + '//otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png'
                'SAT': 'http://www.google.cn/maps/vt?lyrs=s,m&hl={language}&x={x}&y={y}&z={z}'
                //TODO add more free base layers
            };

        var optsMap = {
            zoom: 3,
            minZoom: 1,
            maxZoom: 15,
            center: L.latLng([30.1220, 104.250]),
            zoomControl: false,
            attributionControl: false,
            inertia: true,
            worldCopyJump: true,
            language: main.Lang
        };

        if($.isPlainObject(opts) && $.isPlainObject(opts.map))
            optsMap = $.extend(optsMap, opts.map);

        var defaults = {
            className: baseClassName,
            locationFormat: '{lng}{sep}{lat}',
            locationMarker: true,
            locationDigits: 6,
            locationSep: ',',
            activeOnMove: false,
            layer: 'OSM',
            height: 140,
            width: 200,
            cursorSize: '30px',
            map: optsMap,
            onChangeLocation: $.noop,
            attachTo: null,
            binding : {
                latitude:'',
                longitude:'',
                radius:''
            },
            location:[],
            radius:null
        };

        if($.isPlainObject(opts))
            opts = $.extend(defaults, opts);

        else if($.isFunction(opts))
            opts = $.extend(defaults, {
                onChangeLocation: opts
            });
        else
            opts = defaults;

        if($.isFunction(onChangeLocation))
            opts = $.extend(defaults, {
                onChangeLocation: onChangeLocation
            });

        function roundLocation(loc) {
            return loc ? L.latLng(
                    parseFloat(loc.lat).toFixed(opts.locationDigits),
                    parseFloat(loc.lng).toFixed(opts.locationDigits)
                ) : loc;
        }

        function parseLocation(loc) {
            var retLoc = loc;

            switch($.type(loc)) {
                case 'string':
                    var ll = loc.split(opts.locationSep);
                    if(ll[0] && ll[1])
                        retLoc = L.latLng(ll);
                    else
                        retLoc = null;
                    break;
                case 'array':
                    retLoc = L.latLng(loc);
                    break;
                case 'object':
                    var lat, lng;
                    if(loc.hasOwnProperty('lat'))
                        lat = loc.lat;
                    else if(loc.hasOwnProperty('latitude'))
                        lat = loc.latitude;

                    if(loc.hasOwnProperty('lng'))
                        lng = loc.lng;
                    else if(loc.hasOwnProperty('lon'))
                        lng = loc.lon;
                    else if(loc.hasOwnProperty('longitude'))
                        lng = loc.longitude;

                    retLoc = L.latLng(parseFloat(lat),parseFloat(lng));
                    break;
                default:
                    retLoc = loc;
            }
            return roundLocation( retLoc );
        }

        function buildMap(self) {
            $(self.$input).attr("readonly", "readonly");
            $(opts.binding.latitude).attr("readonly", "readonly");
            $(opts.binding.longitude).attr("readonly", "readonly");
            $(opts.binding.radius).attr("readonly", "readonly");

            L.SVG.include({
                _updateFocusIcon: function (layer) {
                    var p = self.map.latLngToLayerPoint(layer._latlng);
                    var r = layer._radius;
                    var r2 = layer._radiusY || r;
                    var arc = 'a' + r + ',' + r2 + ' 0 1,0 ';
                    var circlePath = layer._empty() ? 'M0 0' :
                        'M' + (p.x - r) + ',' + p.y +
                        arc + (r * 2) + ',0 ' +
                        arc + (-r * 2) + ',0 ';
                    var focusPath = 'M' + (p.x + 15) + ',' + (p.y) +
                        'L' + (p.x - 15) + ',' + (p.y) +
                        'M' + (p.x) + ',' + (p.y + 15) +
                        'L' + (p.x) + ',' + (p.y - 15);
                    this._setPath(layer, [circlePath,focusPath].join(' '));
                }
            });
            L.CircleFocus = L.Circle.extend({
                _update: function () {
                    if (this._map) {
                        this._renderer._updateFocusIcon(this);
                    }
                }
            });

            L.circleFocus = function (latlng, options, legacyOptions) {
                return new L.CircleFocus(latlng, options, legacyOptions);
            };

            self.divMap = document.createElement('div');
            self.$map = $(document.createElement('div'))
                .attr("id", "location-picker")
                .addClass(opts.className + '-map')
                .height(opts.height)
                .width(opts.width)
                .append(self.divMap)
                .appendTo('body');

            if(self.location)
                optsMap.center = self.location;

            if(typeof opts.layer === 'string' && baseLayers[opts.layer])
                optsMap.layers = L.tileLayer(baseLayers[opts.layer], {language: optsMap.language || 'zh'});

            else if(opts.layer instanceof L.TileLayer ||
                opts.layer instanceof L.LayerGroup )
                optsMap.layers = opts.layer;

            else
                optsMap.layers = L.tileLayer(baseLayers.OSM, {language: optsMap.language || 'zh'});

            var mapClickHandler = function(e) {
                self.circle.dragging.disable();
                self.setLocation(e.latlng);
            };

            //leaflet map
            self.map = L.map(self.divMap, optsMap).setView(opts.location, 3)
                .addControl( L.control.zoom({position:'topleft'}) )
                // .on('click', mapClickHandler)
                .on('editable:dragstart', function (e) {
                    self.map.dragging.disable();
                })
                .on('editable:dragend', function (e) {
                    self.map.dragging.enable();
                    self.setLocation(e.layer.getLatLng());
                })
                .on('editable:vertex:dragend', function (e) {
                    self.setLocation(self.circle.getLatLng());
                    self.map.dragging.disable();
                    self.map.dragging.enable();
                });

            if(opts.activeOnMove) {
                self.map.on('move', function(e) {
                    self.setLocation(e.target.getCenter());
                });
            }

            var xmap = L.control({position: 'topright'});
            xmap.onAdd = function(map) {
                var btn_holder = L.DomUtil.create('div', 'leaflet-bar');
                var btn = L.DomUtil.create('a','leaflet-control '+opts.className+'-close');
                btn.innerHTML = '&times;';
                btn_holder.appendChild(btn);
                L.DomEvent
                    .on(btn, 'click', L.DomEvent.stop, self)
                    .on(btn, 'click', self.closeMap, self);
                return btn_holder;
            };
            xmap.addTo(self.map);

            if(opts.locationMarker) {
                self.circle = L.circleFocus(opts.location, {radius:opts.radius}).addTo(self.map);
                self.circle.enableEdit(self.map);
            }
            return self.$map;
        }

        function fitView(map) {
            var bounds = new L.LatLngBounds([map.getCenter(), map.getCenter()]);
            map.eachLayer(function (t, e) {
                try {
                    if (typeof(t.getBounds)=="function") {
                        t.getBounds() && bounds.extend(t.getBounds());
                    } else if (typeof(t.getLatLng)=="function") {
                        t.getLatLng() && bounds.extend(t.getLatLng());
                    }
                } catch (e) {
                }
            });
            return map.fitBounds(bounds);
        }

        $(this).each(function(index, input) {
            var self = this;

            self.$input = $(this);

            self.locationOri = self.$input.val();

            self.onChangeLocation = function() {
                var edata = {
                    latlng: self.location,
                    location: self.getLocation()
                };
                self.$input.trigger($.extend(edata, {
                    type: 'changeLocation'
                }));
                opts.onChangeLocation.call(self, edata);
            };

            self.setLocation = function(loc, noSet) {
                loc = loc || defaults.location;
                self.location = parseLocation(loc);
                if(self.circle){
                    self.radius = self.circle.getRadius();
                }

                if(self.circle){
                    self.circle.setLatLng(loc);
                    self.circle.disableEdit();
                    self.circle.enableEdit(self.map);
                }

                if(!noSet) {
                    self.$input.data('location', self.location);
                    self.$input.val(self.getLocation());
                    $(opts.binding.latitude).val(self.location.lat);
                    $(opts.binding.longitude).val(self.location.lng);
                    $(opts.binding.radius).val(parseFloat(self.radius).fixed(6));
                    self.onChangeLocation();
                }
            };

            self.getLocation = function() {
                return self.location ? L.Util.template(opts.locationFormat, {
                        lat: self.location.lat,
                        lng: self.location.lng,
                        sep: opts.locationSep
                    }) : self.location;
            };

            self.updatePosition = function() {
                if(opts.attachTo != null){
                    self.$map.css({
                        top: $(".modal-content", opts.attachTo).offset().top,
                        left: $(".modal-content", opts.attachTo).offset().left + $(".modal-content", opts.attachTo).width() + 6,
                        height: $(".modal-content", opts.attachTo).height(),
                        width: $(".modal-content", opts.attachTo).height(),
                        zIndex:$(opts.attachTo).css("zIndex")
                    });
                    return;
                }
            };

            self.openMap = function() {
                self.updatePosition();
                self.$map.show();
                self.map.invalidateSize();
//                self.$input.trigger('show');
                fitView(self.map);
            };

            self.closeMap = function() {
                self.$map.hide();
//                self.$input.trigger('hide');
            };

            self.setLocation(self.locationOri, true);

            self.$map = buildMap(self);
            self.$input
                .addClass(opts.className)
                .on('focus.'+opts.className, function(e) {
                    e.preventDefault();
                    self.openMap();
                })
                .on('blur.'+opts.className, function(e) {
                    e.preventDefault();
                    var p = e.target;
                    var close = true;
                    while (p) {
                        if (p._leaflet_id) {
                            close = false;
                            break;
                        }
                        p = p.parentElement;
                    }
                    if(close) {
                        self.closeMap();
                    }
                });
            $(opts.attachTo).on('click', function (e) {
                if($(e.target).attr("id") != $(self.$input).attr("id")
                    && $(e.target).attr("id") != $(opts.binding.latitude).attr("id")
                    && $(e.target).attr("id") != $(opts.binding.longitude).attr("id")
                    && $(e.target).attr("id") != $(opts.binding.radius).attr("id")){
                    self.closeMap();
                }
            });
            $(window).on('resize', function() {
                if (self.$map.is(':visible'))
                    self.updatePosition();
            });
        });

        return this;
    };
});
