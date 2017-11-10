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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2xvY2F0aW9uUGlja2VyL2xlYWZsZXQtbG9jYXRpb25waWNrZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIExlYWZsZXQgTG9jYXRpb24gUGlja2VyIHYwLjIuMyAtIDIwMTUtMDktMDNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNSBTdGVmYW5vIEN1ZGluaVxuICogc3RlZmFuby5jdWRpbmlAZ21haWwuY29tXG4gKiBodHRwOi8vbGFicy5lYXN5YmxvZy5pdC9cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKlxuICogRGVtbzpcbiAqIGh0dHA6Ly9sYWJzLmVhc3libG9nLml0L21hcHMvbGVhZmxldC1sb2NhdGlvbnBpY2tlci9cbiAqXG4gKiBTb3VyY2U6XG4gKiBnaXRAZ2l0aHViLmNvbTpzdGVmYW5vY3VkaW5pL2xlYWZsZXQtbG9jYXRpb25waWNrZXIuZ2l0XG4gKlxuICovXG4vKlxuVE9ET1xuKGZ1bmN0aW9uKGZhY3Rvcnkpe1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoWydqcXVlcnknLCdsZWFmbGV0J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xlYWZsZXQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShqUXVlcnksIEwpO1xuICAgIH1cbn0qL1xuXG4vKlxuICogTGVhZmxldCBDb250cm9sIFNlYXJjaCB2Mi43LjAgLSAyMDE2LTA5LTEzXG4gKlxuICogQ29weXJpZ2h0IDIwMTYgU3RlZmFubyBDdWRpbmlcbiAqIHN0ZWZhbm8uY3VkaW5pQGdtYWlsLmNvbVxuICogaHR0cDovL2xhYnMuZWFzeWJsb2cuaXQvXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICpcbiAqIERlbW86XG4gKiBodHRwOi8vbGFicy5lYXN5YmxvZy5pdC9tYXBzL2xlYWZsZXQtc2VhcmNoL1xuICpcbiAqIFNvdXJjZTpcbiAqIGdpdEBnaXRodWIuY29tOnN0ZWZhbm9jdWRpbmkvbGVhZmxldC1zZWFyY2guZ2l0XG4gKlxuICovXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy9BTURcbiAgICAgICAgZGVmaW5lKFsnbGVhZmxldCddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gTm9kZS9Db21tb25KU1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnbGVhZmxldCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICAgICAgaWYodHlwZW9mIHdpbmRvdy5MID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIHRocm93ICdMZWFmbGV0IG11c3QgYmUgbG9hZGVkIGZpcnN0JztcbiAgICAgICAgZmFjdG9yeSh3aW5kb3cuTCk7XG4gICAgfVxufSkoZnVuY3Rpb24gKEwpIHtcblxuICAgIHZhciAkID0galF1ZXJ5O1xuXG4gICAgJC5mbi5sZWFmbGV0TG9jYXRpb25QaWNrZXIgPSBmdW5jdGlvbihvcHRzLCBvbkNoYW5nZUxvY2F0aW9uKSB7XG5cbiAgICAgICAgdmFyIGh0dHAgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2w7XG5cbiAgICAgICAgdmFyIGJhc2VDbGFzc05hbWUgPSAnbGVhZmxldC1sb2NwaWNrZXInLFxuICAgICAgICAgICAgYmFzZUxheWVycyA9IHtcbiAgICAgICAgICAgICAgICAvLydPU00nOiBodHRwICsgJy8ve3N9LnRpbGUub3BlbnN0cmVldG1hcC5vcmcve3p9L3t4fS97eX0ucG5nJyxcbiAgICAgICAgICAgICAgICAnT1NNJzogJ2h0dHA6Ly93d3cuZ29vZ2xlLmNuL21hcHMvdnQ/bHlycz1wLG0maGw9e2xhbmd1YWdlfSZ4PXt4fSZ5PXt5fSZ6PXt6fScsXG4gICAgICAgICAgICAgICAgLy8nU0FUJzogaHR0cCArICcvL290aWxlMS5tcWNkbi5jb20vdGlsZXMvMS4wLjAvc2F0L3t6fS97eH0ve3l9LnBuZydcbiAgICAgICAgICAgICAgICAnU0FUJzogJ2h0dHA6Ly93d3cuZ29vZ2xlLmNuL21hcHMvdnQ/bHlycz1zLG0maGw9e2xhbmd1YWdlfSZ4PXt4fSZ5PXt5fSZ6PXt6fSdcbiAgICAgICAgICAgICAgICAvL1RPRE8gYWRkIG1vcmUgZnJlZSBiYXNlIGxheWVyc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3B0c01hcCA9IHtcbiAgICAgICAgICAgIHpvb206IDMsXG4gICAgICAgICAgICBtaW5ab29tOiAxLFxuICAgICAgICAgICAgbWF4Wm9vbTogMTUsXG4gICAgICAgICAgICBjZW50ZXI6IEwubGF0TG5nKFszMC4xMjIwLCAxMDQuMjUwXSksXG4gICAgICAgICAgICB6b29tQ29udHJvbDogZmFsc2UsXG4gICAgICAgICAgICBhdHRyaWJ1dGlvbkNvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgaW5lcnRpYTogdHJ1ZSxcbiAgICAgICAgICAgIHdvcmxkQ29weUp1bXA6IHRydWUsXG4gICAgICAgICAgICBsYW5ndWFnZTogbWFpbi5MYW5nXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYoJC5pc1BsYWluT2JqZWN0KG9wdHMpICYmICQuaXNQbGFpbk9iamVjdChvcHRzLm1hcCkpXG4gICAgICAgICAgICBvcHRzTWFwID0gJC5leHRlbmQob3B0c01hcCwgb3B0cy5tYXApO1xuXG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIGNsYXNzTmFtZTogYmFzZUNsYXNzTmFtZSxcbiAgICAgICAgICAgIGxvY2F0aW9uRm9ybWF0OiAne2xuZ317c2VwfXtsYXR9JyxcbiAgICAgICAgICAgIGxvY2F0aW9uTWFya2VyOiB0cnVlLFxuICAgICAgICAgICAgbG9jYXRpb25EaWdpdHM6IDYsXG4gICAgICAgICAgICBsb2NhdGlvblNlcDogJywnLFxuICAgICAgICAgICAgYWN0aXZlT25Nb3ZlOiBmYWxzZSxcbiAgICAgICAgICAgIGxheWVyOiAnT1NNJyxcbiAgICAgICAgICAgIGhlaWdodDogMTQwLFxuICAgICAgICAgICAgd2lkdGg6IDIwMCxcbiAgICAgICAgICAgIGN1cnNvclNpemU6ICczMHB4JyxcbiAgICAgICAgICAgIG1hcDogb3B0c01hcCxcbiAgICAgICAgICAgIG9uQ2hhbmdlTG9jYXRpb246ICQubm9vcCxcbiAgICAgICAgICAgIGF0dGFjaFRvOiBudWxsLFxuICAgICAgICAgICAgYmluZGluZyA6IHtcbiAgICAgICAgICAgICAgICBsYXRpdHVkZTonJyxcbiAgICAgICAgICAgICAgICBsb25naXR1ZGU6JycsXG4gICAgICAgICAgICAgICAgcmFkaXVzOicnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9jYXRpb246W10sXG4gICAgICAgICAgICByYWRpdXM6bnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChvcHRzKSlcbiAgICAgICAgICAgIG9wdHMgPSAkLmV4dGVuZChkZWZhdWx0cywgb3B0cyk7XG5cbiAgICAgICAgZWxzZSBpZigkLmlzRnVuY3Rpb24ob3B0cykpXG4gICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoZGVmYXVsdHMsIHtcbiAgICAgICAgICAgICAgICBvbkNoYW5nZUxvY2F0aW9uOiBvcHRzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgb3B0cyA9IGRlZmF1bHRzO1xuXG4gICAgICAgIGlmKCQuaXNGdW5jdGlvbihvbkNoYW5nZUxvY2F0aW9uKSlcbiAgICAgICAgICAgIG9wdHMgPSAkLmV4dGVuZChkZWZhdWx0cywge1xuICAgICAgICAgICAgICAgIG9uQ2hhbmdlTG9jYXRpb246IG9uQ2hhbmdlTG9jYXRpb25cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIHJvdW5kTG9jYXRpb24obG9jKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jID8gTC5sYXRMbmcoXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlRmxvYXQobG9jLmxhdCkudG9GaXhlZChvcHRzLmxvY2F0aW9uRGlnaXRzKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VGbG9hdChsb2MubG5nKS50b0ZpeGVkKG9wdHMubG9jYXRpb25EaWdpdHMpXG4gICAgICAgICAgICAgICAgKSA6IGxvYztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlTG9jYXRpb24obG9jKSB7XG4gICAgICAgICAgICB2YXIgcmV0TG9jID0gbG9jO1xuXG4gICAgICAgICAgICBzd2l0Y2goJC50eXBlKGxvYykpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICB2YXIgbGwgPSBsb2Muc3BsaXQob3B0cy5sb2NhdGlvblNlcCk7XG4gICAgICAgICAgICAgICAgICAgIGlmKGxsWzBdICYmIGxsWzFdKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0TG9jID0gTC5sYXRMbmcobGwpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXRMb2MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhcnJheSc6XG4gICAgICAgICAgICAgICAgICAgIHJldExvYyA9IEwubGF0TG5nKGxvYyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXQsIGxuZztcbiAgICAgICAgICAgICAgICAgICAgaWYobG9jLmhhc093blByb3BlcnR5KCdsYXQnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhdCA9IGxvYy5sYXQ7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYobG9jLmhhc093blByb3BlcnR5KCdsYXRpdHVkZScpKVxuICAgICAgICAgICAgICAgICAgICAgICAgbGF0ID0gbG9jLmxhdGl0dWRlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKGxvYy5oYXNPd25Qcm9wZXJ0eSgnbG5nJykpXG4gICAgICAgICAgICAgICAgICAgICAgICBsbmcgPSBsb2MubG5nO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKGxvYy5oYXNPd25Qcm9wZXJ0eSgnbG9uJykpXG4gICAgICAgICAgICAgICAgICAgICAgICBsbmcgPSBsb2MubG9uO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKGxvYy5oYXNPd25Qcm9wZXJ0eSgnbG9uZ2l0dWRlJykpXG4gICAgICAgICAgICAgICAgICAgICAgICBsbmcgPSBsb2MubG9uZ2l0dWRlO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldExvYyA9IEwubGF0TG5nKHBhcnNlRmxvYXQobGF0KSxwYXJzZUZsb2F0KGxuZykpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXRMb2MgPSBsb2M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcm91bmRMb2NhdGlvbiggcmV0TG9jICk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBidWlsZE1hcChzZWxmKSB7XG4gICAgICAgICAgICAkKHNlbGYuJGlucHV0KS5hdHRyKFwicmVhZG9ubHlcIiwgXCJyZWFkb25seVwiKTtcbiAgICAgICAgICAgICQob3B0cy5iaW5kaW5nLmxhdGl0dWRlKS5hdHRyKFwicmVhZG9ubHlcIiwgXCJyZWFkb25seVwiKTtcbiAgICAgICAgICAgICQob3B0cy5iaW5kaW5nLmxvbmdpdHVkZSkuYXR0cihcInJlYWRvbmx5XCIsIFwicmVhZG9ubHlcIik7XG4gICAgICAgICAgICAkKG9wdHMuYmluZGluZy5yYWRpdXMpLmF0dHIoXCJyZWFkb25seVwiLCBcInJlYWRvbmx5XCIpO1xuXG4gICAgICAgICAgICBMLlNWRy5pbmNsdWRlKHtcbiAgICAgICAgICAgICAgICBfdXBkYXRlRm9jdXNJY29uOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBzZWxmLm1hcC5sYXRMbmdUb0xheWVyUG9pbnQobGF5ZXIuX2xhdGxuZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciByID0gbGF5ZXIuX3JhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHIyID0gbGF5ZXIuX3JhZGl1c1kgfHwgcjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyYyA9ICdhJyArIHIgKyAnLCcgKyByMiArICcgMCAxLDAgJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNpcmNsZVBhdGggPSBsYXllci5fZW1wdHkoKSA/ICdNMCAwJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAnTScgKyAocC54IC0gcikgKyAnLCcgKyBwLnkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJjICsgKHIgKiAyKSArICcsMCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyYyArICgtciAqIDIpICsgJywwICc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmb2N1c1BhdGggPSAnTScgKyAocC54ICsgMTUpICsgJywnICsgKHAueSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0wnICsgKHAueCAtIDE1KSArICcsJyArIChwLnkpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdNJyArIChwLngpICsgJywnICsgKHAueSArIDE1KSArXG4gICAgICAgICAgICAgICAgICAgICAgICAnTCcgKyAocC54KSArICcsJyArIChwLnkgLSAxNSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldFBhdGgobGF5ZXIsIFtjaXJjbGVQYXRoLGZvY3VzUGF0aF0uam9pbignICcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEwuQ2lyY2xlRm9jdXMgPSBMLkNpcmNsZS5leHRlbmQoe1xuICAgICAgICAgICAgICAgIF91cGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX21hcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuX3VwZGF0ZUZvY3VzSWNvbih0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBMLmNpcmNsZUZvY3VzID0gZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucywgbGVnYWN5T3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTC5DaXJjbGVGb2N1cyhsYXRsbmcsIG9wdGlvbnMsIGxlZ2FjeU9wdGlvbnMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2VsZi5kaXZNYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHNlbGYuJG1hcCA9ICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJpZFwiLCBcImxvY2F0aW9uLXBpY2tlclwiKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhvcHRzLmNsYXNzTmFtZSArICctbWFwJylcbiAgICAgICAgICAgICAgICAuaGVpZ2h0KG9wdHMuaGVpZ2h0KVxuICAgICAgICAgICAgICAgIC53aWR0aChvcHRzLndpZHRoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoc2VsZi5kaXZNYXApXG4gICAgICAgICAgICAgICAgLmFwcGVuZFRvKCdib2R5Jyk7XG5cbiAgICAgICAgICAgIGlmKHNlbGYubG9jYXRpb24pXG4gICAgICAgICAgICAgICAgb3B0c01hcC5jZW50ZXIgPSBzZWxmLmxvY2F0aW9uO1xuXG4gICAgICAgICAgICBpZih0eXBlb2Ygb3B0cy5sYXllciA9PT0gJ3N0cmluZycgJiYgYmFzZUxheWVyc1tvcHRzLmxheWVyXSlcbiAgICAgICAgICAgICAgICBvcHRzTWFwLmxheWVycyA9IEwudGlsZUxheWVyKGJhc2VMYXllcnNbb3B0cy5sYXllcl0sIHtsYW5ndWFnZTogb3B0c01hcC5sYW5ndWFnZSB8fCAnemgnfSk7XG5cbiAgICAgICAgICAgIGVsc2UgaWYob3B0cy5sYXllciBpbnN0YW5jZW9mIEwuVGlsZUxheWVyIHx8XG4gICAgICAgICAgICAgICAgb3B0cy5sYXllciBpbnN0YW5jZW9mIEwuTGF5ZXJHcm91cCApXG4gICAgICAgICAgICAgICAgb3B0c01hcC5sYXllcnMgPSBvcHRzLmxheWVyO1xuXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb3B0c01hcC5sYXllcnMgPSBMLnRpbGVMYXllcihiYXNlTGF5ZXJzLk9TTSwge2xhbmd1YWdlOiBvcHRzTWFwLmxhbmd1YWdlIHx8ICd6aCd9KTtcblxuICAgICAgICAgICAgdmFyIG1hcENsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmNpcmNsZS5kcmFnZ2luZy5kaXNhYmxlKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5zZXRMb2NhdGlvbihlLmxhdGxuZyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL2xlYWZsZXQgbWFwXG4gICAgICAgICAgICBzZWxmLm1hcCA9IEwubWFwKHNlbGYuZGl2TWFwLCBvcHRzTWFwKS5zZXRWaWV3KG9wdHMubG9jYXRpb24sIDMpXG4gICAgICAgICAgICAgICAgLmFkZENvbnRyb2woIEwuY29udHJvbC56b29tKHtwb3NpdGlvbjondG9wbGVmdCd9KSApXG4gICAgICAgICAgICAgICAgLy8gLm9uKCdjbGljaycsIG1hcENsaWNrSGFuZGxlcilcbiAgICAgICAgICAgICAgICAub24oJ2VkaXRhYmxlOmRyYWdzdGFydCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubWFwLmRyYWdnaW5nLmRpc2FibGUoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5vbignZWRpdGFibGU6ZHJhZ2VuZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubWFwLmRyYWdnaW5nLmVuYWJsZSgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNldExvY2F0aW9uKGUubGF5ZXIuZ2V0TGF0TG5nKCkpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLm9uKCdlZGl0YWJsZTp2ZXJ0ZXg6ZHJhZ2VuZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0TG9jYXRpb24oc2VsZi5jaXJjbGUuZ2V0TGF0TG5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm1hcC5kcmFnZ2luZy5kaXNhYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubWFwLmRyYWdnaW5nLmVuYWJsZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZihvcHRzLmFjdGl2ZU9uTW92ZSkge1xuICAgICAgICAgICAgICAgIHNlbGYubWFwLm9uKCdtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNldExvY2F0aW9uKGUudGFyZ2V0LmdldENlbnRlcigpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHhtYXAgPSBMLmNvbnRyb2woe3Bvc2l0aW9uOiAndG9wcmlnaHQnfSk7XG4gICAgICAgICAgICB4bWFwLm9uQWRkID0gZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0bl9ob2xkZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1iYXInKTtcbiAgICAgICAgICAgICAgICB2YXIgYnRuID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsJ2xlYWZsZXQtY29udHJvbCAnK29wdHMuY2xhc3NOYW1lKyctY2xvc2UnKTtcbiAgICAgICAgICAgICAgICBidG4uaW5uZXJIVE1MID0gJyZ0aW1lczsnO1xuICAgICAgICAgICAgICAgIGJ0bl9ob2xkZXIuYXBwZW5kQ2hpbGQoYnRuKTtcbiAgICAgICAgICAgICAgICBMLkRvbUV2ZW50XG4gICAgICAgICAgICAgICAgICAgIC5vbihidG4sICdjbGljaycsIEwuRG9tRXZlbnQuc3RvcCwgc2VsZilcbiAgICAgICAgICAgICAgICAgICAgLm9uKGJ0biwgJ2NsaWNrJywgc2VsZi5jbG9zZU1hcCwgc2VsZik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ0bl9ob2xkZXI7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgeG1hcC5hZGRUbyhzZWxmLm1hcCk7XG5cbiAgICAgICAgICAgIGlmKG9wdHMubG9jYXRpb25NYXJrZXIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmNpcmNsZSA9IEwuY2lyY2xlRm9jdXMob3B0cy5sb2NhdGlvbiwge3JhZGl1czpvcHRzLnJhZGl1c30pLmFkZFRvKHNlbGYubWFwKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNpcmNsZS5lbmFibGVFZGl0KHNlbGYubWFwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzZWxmLiRtYXA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmaXRWaWV3KG1hcCkge1xuICAgICAgICAgICAgdmFyIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhbbWFwLmdldENlbnRlcigpLCBtYXAuZ2V0Q2VudGVyKCldKTtcbiAgICAgICAgICAgIG1hcC5lYWNoTGF5ZXIoZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHQuZ2V0Qm91bmRzKT09XCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0LmdldEJvdW5kcygpICYmIGJvdW5kcy5leHRlbmQodC5nZXRCb3VuZHMoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKHQuZ2V0TGF0TG5nKT09XCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0LmdldExhdExuZygpICYmIGJvdW5kcy5leHRlbmQodC5nZXRMYXRMbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbWFwLmZpdEJvdW5kcyhib3VuZHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgJCh0aGlzKS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICBzZWxmLiRpbnB1dCA9ICQodGhpcyk7XG5cbiAgICAgICAgICAgIHNlbGYubG9jYXRpb25PcmkgPSBzZWxmLiRpbnB1dC52YWwoKTtcblxuICAgICAgICAgICAgc2VsZi5vbkNoYW5nZUxvY2F0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVkYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICBsYXRsbmc6IHNlbGYubG9jYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBzZWxmLmdldExvY2F0aW9uKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNlbGYuJGlucHV0LnRyaWdnZXIoJC5leHRlbmQoZWRhdGEsIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZUxvY2F0aW9uJ1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBvcHRzLm9uQ2hhbmdlTG9jYXRpb24uY2FsbChzZWxmLCBlZGF0YSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZWxmLnNldExvY2F0aW9uID0gZnVuY3Rpb24obG9jLCBub1NldCkge1xuICAgICAgICAgICAgICAgIGxvYyA9IGxvYyB8fCBkZWZhdWx0cy5sb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uID0gcGFyc2VMb2NhdGlvbihsb2MpO1xuICAgICAgICAgICAgICAgIGlmKHNlbGYuY2lyY2xlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yYWRpdXMgPSBzZWxmLmNpcmNsZS5nZXRSYWRpdXMoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihzZWxmLmNpcmNsZSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2lyY2xlLnNldExhdExuZyhsb2MpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNpcmNsZS5kaXNhYmxlRWRpdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNpcmNsZS5lbmFibGVFZGl0KHNlbGYubWFwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZighbm9TZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kaW5wdXQuZGF0YSgnbG9jYXRpb24nLCBzZWxmLmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kaW5wdXQudmFsKHNlbGYuZ2V0TG9jYXRpb24oKSk7XG4gICAgICAgICAgICAgICAgICAgICQob3B0cy5iaW5kaW5nLmxhdGl0dWRlKS52YWwoc2VsZi5sb2NhdGlvbi5sYXQpO1xuICAgICAgICAgICAgICAgICAgICAkKG9wdHMuYmluZGluZy5sb25naXR1ZGUpLnZhbChzZWxmLmxvY2F0aW9uLmxuZyk7XG4gICAgICAgICAgICAgICAgICAgICQob3B0cy5iaW5kaW5nLnJhZGl1cykudmFsKHBhcnNlRmxvYXQoc2VsZi5yYWRpdXMpLmZpeGVkKDYpKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkNoYW5nZUxvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2VsZi5nZXRMb2NhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmxvY2F0aW9uID8gTC5VdGlsLnRlbXBsYXRlKG9wdHMubG9jYXRpb25Gb3JtYXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhdDogc2VsZi5sb2NhdGlvbi5sYXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBsbmc6IHNlbGYubG9jYXRpb24ubG5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VwOiBvcHRzLmxvY2F0aW9uU2VwXG4gICAgICAgICAgICAgICAgICAgIH0pIDogc2VsZi5sb2NhdGlvbjtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNlbGYudXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZihvcHRzLmF0dGFjaFRvICE9IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRtYXAuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogJChcIi5tb2RhbC1jb250ZW50XCIsIG9wdHMuYXR0YWNoVG8pLm9mZnNldCgpLnRvcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6ICQoXCIubW9kYWwtY29udGVudFwiLCBvcHRzLmF0dGFjaFRvKS5vZmZzZXQoKS5sZWZ0ICsgJChcIi5tb2RhbC1jb250ZW50XCIsIG9wdHMuYXR0YWNoVG8pLndpZHRoKCkgKyA2LFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAkKFwiLm1vZGFsLWNvbnRlbnRcIiwgb3B0cy5hdHRhY2hUbykuaGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJChcIi5tb2RhbC1jb250ZW50XCIsIG9wdHMuYXR0YWNoVG8pLmhlaWdodCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgekluZGV4OiQob3B0cy5hdHRhY2hUbykuY3NzKFwiekluZGV4XCIpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2VsZi5vcGVuTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi51cGRhdGVQb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIHNlbGYuJG1hcC5zaG93KCk7XG4gICAgICAgICAgICAgICAgc2VsZi5tYXAuaW52YWxpZGF0ZVNpemUoKTtcbi8vICAgICAgICAgICAgICAgIHNlbGYuJGlucHV0LnRyaWdnZXIoJ3Nob3cnKTtcbiAgICAgICAgICAgICAgICBmaXRWaWV3KHNlbGYubWFwKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNlbGYuY2xvc2VNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLiRtYXAuaGlkZSgpO1xuLy8gICAgICAgICAgICAgICAgc2VsZi4kaW5wdXQudHJpZ2dlcignaGlkZScpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2VsZi5zZXRMb2NhdGlvbihzZWxmLmxvY2F0aW9uT3JpLCB0cnVlKTtcblxuICAgICAgICAgICAgc2VsZi4kbWFwID0gYnVpbGRNYXAoc2VsZik7XG4gICAgICAgICAgICBzZWxmLiRpbnB1dFxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhvcHRzLmNsYXNzTmFtZSlcbiAgICAgICAgICAgICAgICAub24oJ2ZvY3VzLicrb3B0cy5jbGFzc05hbWUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm9wZW5NYXAoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5vbignYmx1ci4nK29wdHMuY2xhc3NOYW1lLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBlLnRhcmdldDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsb3NlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwLl9sZWFmbGV0X2lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBwLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoY2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2xvc2VNYXAoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJChvcHRzLmF0dGFjaFRvKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmKCQoZS50YXJnZXQpLmF0dHIoXCJpZFwiKSAhPSAkKHNlbGYuJGlucHV0KS5hdHRyKFwiaWRcIilcbiAgICAgICAgICAgICAgICAgICAgJiYgJChlLnRhcmdldCkuYXR0cihcImlkXCIpICE9ICQob3B0cy5iaW5kaW5nLmxhdGl0dWRlKS5hdHRyKFwiaWRcIilcbiAgICAgICAgICAgICAgICAgICAgJiYgJChlLnRhcmdldCkuYXR0cihcImlkXCIpICE9ICQob3B0cy5iaW5kaW5nLmxvbmdpdHVkZSkuYXR0cihcImlkXCIpXG4gICAgICAgICAgICAgICAgICAgICYmICQoZS50YXJnZXQpLmF0dHIoXCJpZFwiKSAhPSAkKG9wdHMuYmluZGluZy5yYWRpdXMpLmF0dHIoXCJpZFwiKSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xvc2VNYXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuJG1hcC5pcygnOnZpc2libGUnKSlcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51cGRhdGVQb3NpdGlvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG59KTtcbiJdLCJmaWxlIjoicGx1Z2lucy9sb2NhdGlvblBpY2tlci9sZWFmbGV0LWxvY2F0aW9ucGlja2VyLmpzIn0=
