/**
 * Created by p00034 on 2017-01-10.
 */
"use strict";
define([
    'jquery',
    'css!plugins/Leaflet/leaflet.css',
    'css!plugins/Leaflet/leaflet.search.css',
    'css!plugins/Leaflet/L.Control.Basemaps.css',

    'leaflet',
    'plugins/Leaflet/leaflet.providers',
    'leaflet.awesomeMarkers',
    'leaflet.MarkerCluster',
    'plugins/Leaflet/leaflet.activearea',
    'plugins/Leaflet/Leaflet.Editable',
    'plugins/Leaflet/Leaflet.Editable.Drag',
    'plugins/Leaflet/leaflet.search',
    'plugins/Leaflet/L.Control.Basemaps',
    'plugins/Leaflet/leaflet.MassMarker'
], function () {
    var MapUtil = {
        ready: false,
        Cache: [], // 缓存数据
        defaultLanguage: 'zh',

        //theme: {
        //    'default': 'openstreet', // 默认主题 （openstreetmap地图）
        //    'streets': 'streets-v10', // 2D地图
        //    'satellite': 'satellite-v9', // 卫星地图（无街道等浮标信息）
        //    'outdoors': 'outdoors-v10', // 等高线地图
        //    'dark': 'dark-v9', // 暗色主题
        //    'light': 'light-v9', // 亮色主题
        //    'satellite-streets': 'satellite-streets-v10' // 卫星街道地图
        //},

        OptionTemplates: {
            "default": {
                zoomLevel: 3,
                minZoom: 3,
                maxZoom: 17,
                mapType: 0,
                zoomControl: {
                    show: true,
                    position: 'bottomright',
                    zoomInTitle: Msg.map.zoomsTitle[0],
                    zoomOutTitle: Msg.map.zoomsTitle[1]
                },
                scaleControl: {
                    show: true
                },
                mapTypeControl: {
                    show: true,
                    position: 'bottomright',
                    tileX: 0,
                    tileY: 0,
                    tileZ: 0,
                    layers: ['satellite', '2D']
                }
            },
            "plants": {
                zoomLevel: 3,
                minZoom: 3,
                maxZoom: 17,
                mapType: 1,
                zoomControl: {
                    show: false
                },
                scaleControl: {
                    show: false
                },
                mapTypeControl: {
                    show: true,
                    layers: ['satellite']
                }
            }
        },

        /**
         * 绘制并初始化地图
         * @param id 容器ID
         * @param option 配置参数
         * @returns {MapUtil}
         */
        Instance: function (id, option) {
            this.ready = !!(window.L);
            var self = this;

            try {
                var p = this.option = {
                    map: {},
                    option: $.extend(true, {}, self.OptionTemplates[option.theme || 'default'], option),
                    container: id
                };
                var lng = p.option.center[0];
                var lat = p.option.center[1];

                var offline = false;

//                (new Image('')).load(offline = true).error(offline = false);

                var tileLayers = [], initLayer = [];

                if (offline) {
                    initLayer.push(L.tileLayer.provider('PinnetMap', {language: (p.option.language || self.defaultLanguage)}))
                } else {
                    if (p.option.mapType) {
                        initLayer.push(L.tileLayer.provider('Google.Satellite', {language: (p.option.language || self.defaultLanguage)}));
                    } else {
                        initLayer.push(L.tileLayer.provider('Google.Normal', {language: (p.option.language || self.defaultLanguage)}));
                    }
                }
                tileLayers.push(initLayer);

                // 创建地图实例
                if ($('#' + p.container).length > 0) {
                    if (self.Cache[id] && self.Cache[id].map) {
                        self.clearMap(self.Cache[id].map);
                    }
                    p.map = L.map(p.container, {
                        center: self.createPoint(lng, lat),
                        zoom: p.option.zoomLevel || 5,
                        minZoom: 3,
                        maxZoom: 15,
                        layers: initLayer,
                        editable: true,
                        //renderer: L.canvas(),
                        zoomControl: false,
                        attributionControl: true,
                        keyboard: false,
                        //maxBounds: [[90, 180], [-90, -180]],
                        inertia: true,
                        worldCopyJump: true
                    });
                    p.map.invalidateSize(true);
                    p.option.activeArea && p.map.setActiveArea(p.option.activeArea);

                    /* TODO 添加控件 */
                    // 缩放控件
                    if (p.option.zoomControl && p.option.zoomControl.show) {
                        p.map.addControl(L.control.zoom({
                            position: p.option.zoomControl.position || 'bottomright',
                            zoomInText: p.option.zoomControl.zoomInText || '+',
                            zoomInTitle: p.option.zoomControl.zoomInTitle || 'Zoom in',
                            zoomOutText: p.option.zoomControl.zoomOutText || '-',
                            zoomOutTitle: p.option.zoomControl.zoomOutTitle || 'Zoom out'
                        }));
                    }
                    // 地图类型切换控件
                    if (!offline && p.option.mapTypeControl && p.option.mapTypeControl.show) {
                        $.each(p.option.mapTypeControl.layers, function (idx, layerName) {
                            if ("2D" == layerName) {
                                if (p.option.mapType != 0) {
                                    tileLayers.unshift([L.tileLayer.provider('Google.Normal', {language: (p.option.language || self.defaultLanguage)})]);
                                }
                            } else if ("satellite" == layerName) {
                                if (p.option.mapType != 1) {
                                    tileLayers.unshift([L.tileLayer.provider('Google.Satellite', {language: (p.option.language || self.defaultLanguage)})]);
                                }
                            }
                        });
                        p.map.addControl(L.control.basemaps({
                            position: p.option.mapTypeControl.position || 'bottomright',
                            tileLayers: tileLayers,
                            tileX: p.option.mapTypeControl.tileX || 1,
                            tileY: p.option.mapTypeControl.tileY || 0,
                            tileZ: p.option.mapTypeControl.tileZ || 1
                        }));
                    }
                    // 比例尺
                    if (p.option.scaleControl && p.option.scaleControl.show) {
                        p.map.addControl(L.control.scale({
                            position: p.option.scaleControl.position || 'bottomleft',
                            maxWidth: p.option.scaleControl.maxWidth || 100,
                            metric: p.option.scaleControl.metric || true,
                            imperial: p.option.scaleControl.imperial || true
                        }));
                    }

                    self.Cache[id] = self.option;
                }
            } catch (e) {
                console.error(e);
            }

            return self;
        },

        /**
         * 创建坐标点（Point）
         * @param lng 经度
         * @param lat 纬度
         * @return {* || o.LatLng}
         */
        createPoint: function (lng, lat) {
            if (!this.ready) return null;
            return new L.LatLng(lat, lng);
        },

        /**
         * 创建像素位置
         * @param x
         * @param y
         * @return {* || o.point}
         */
        createPixel: function (x, y) {
            if (!this.ready) return null;
            return L.point(x, y);
        },

        /**
         * 创建图标（Icon）
         * @param options 图标样式参数
         * <pre>
         *     {
         *          iconUrl: './images/marker-icon.png', // 图标图片地址
         *          iconSize: [38, 95], // 图标大小[x, y]
         *          iconAnchor: [22, 94], // 图标标识中心位置[x, y]
         *          popupAnchor: [-3, -76], // 弹出层指向图标位置[x, y]
         *          shadowUrl: './images/marker-shadow.png', // 图标阴影图层
         *          shadowSize: [68, 95], // 阴影大小[x, y]
         *          shadowAnchor: [22, 94] // 阴影标识中心位置[x, y]
         *     }
         * </pre>
         * @returns {* || o.Icon || L.AwesomeMarkers.Icon}
         */
        createIcon: function (options) {
            if (!this.ready) return null;
            var icon = L.icon($.extend({
                iconUrl: './images/marker-icon.png',
                iconSize: [38, 95],
                iconAnchor: [22, 94],
                popupAnchor: [-3, -76],
                shadowUrl: './images/marker-shadow.png',
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
            }, options));
            return icon || L.Icon.Default();
        },

        /**
         * 创建自定义图标（DivIcon）
         * @param options 图标样式参数
         * <pre>
         *     {
         *          iconUrl: './images/marker-icon.png', // 图标图片地址
         *          iconSize: [38, 95], // 图标大小[x, y]
         *          iconAnchor: [22, 94], // 图标标识中心位置[x, y]
         *          popupAnchor: [-3, -76], // 弹出层指向图标位置[x, y]
         *          shadowUrl: './images/marker-shadow.png', // 图标阴影图层
         *          shadowSize: [68, 95], // 阴影大小[x, y]
         *          shadowAnchor: [22, 94] // 阴影标识中心位置[x, y]
         *     }
         * </pre>
         * @returns {* || o.DivIcon}
         */
        createCustomIcon: function (options) {
            if (!this.ready) return null;
            var icon = L.divIcon($.extend({
                iconUrl: './images/marker-icon.png',
                iconSize: [38, 95],
                iconAnchor: [22, 94],
                popupAnchor: [-3, -76],
                shadowUrl: './images/marker-shadow.png',
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
            }, options));
            return icon || L.Icon.Default();
        },

        /**
         * 创建预定义标注点图标（AwesomeMarkersIcon）
         * @param options 图标参数
         * <pre>
         *     {<br>
         *          icon: 'home', // 图标名称，如：（'home', 'glass', 'flag', 'star', 'bookmark', ....）* 所有在：http://fortawesome.github.io/Font-Awesome/icons/，http://getbootstrap.com/components/#glyphicons，http://ionicons.com中的图标可以直接使用<br>
         *          prefix: 'glyphicon', // 图标前缀，可选图标库'glyphicon'（bootstrap 3）、'fa'(FontAwesome)<br>
         *          markerColor: 'blue', // 标注点颜色（可选值：'red', 'darkred', 'orange', 'green', 'darkgreen', 'blue', 'purple', 'darkpuple', 'cadetblue'）<br>
         *          iconColor: 'white', // 图标颜色（可选值：'white', 'black' 或者 颜色值 (hex, rgba 等)<br>
         *          spin: false, // 是否转动，* FontAwesome图标必填！<br>
         *          extraClasses: '' // 为Icon生成标签添加指定自定义的 class 属性，如：'fa-rotate90 myclass'<br>
         *     }<br>
         * </pre>
         * @returns {* || L.AwesomeMarkers.Icon}
         */
        createAwesomeMarkersIcon: function (options) {
            if (!this.ready) return null;
            var icon = L.AwesomeMarkers.icon($.extend({
                icon: 'home',
                prefix: 'glyphicon',
                markerColor: 'blue',
                iconColor: 'white',
                spin: true
            }, options));
            return icon || L.Icon.Default();
        },

        /**
         * 创建标注点(Marker)
         *
         * @param point {L.point} 点对象
         * @param options {*} 参数
         *  <pre>
         *      {<br>
         *          icon: L.Icon.Default(), // {L.Icon || L.AwesomeMarkers.Icon} 默认图标<br>
         *          draggable: true, // 使图标可拖拽<br>
         *          title: 'Title', // 添加一个标题<br>
         *          opacity: 0.5 // 设置透明度<br>
         *      }<br>
         *  </pre>
         * @return {Marker}
         */
        createMarker: function (point, options) {
            if (!this.ready) return null;
            options = $.extend({
                draggable: false,
                opacity: 1
            }, options);

            var marker = L.marker(point, options);
            options.popup && marker.bindPopup(options.popup, {
                autoPan: true,
                keepInView: true,
                maxWidth: 950
            }).openPopup();
            options.tooltip && marker.bindTooltip(options.tooltip, {
                direction: 'right',
                permanent: true,
                opacity: 0.7,
                offset: [14, -18]
            }).openTooltip();
            // 添加事件
            if (options && options.events) {
                for (var event in options.events) {
                    options.events.hasOwnProperty(event)
                    && options.events[event]
                    && (typeof options.events[event] == 'function')
                    && marker.on(event, function (e) {
                        options.events[e.type](e);
                    });
                }
            }
            return marker;
        },

        /**
         * 创建域标注点
         * @param map
         * @param center
         * @param radius
         * @param options
         * @returns {L.marker}
         */
        createDomainMarker: function (map, center, radius, options) {
            if (!this.ready) return null;
            var cssIcon = L.divIcon({
                className: 'domain-icon',
                html: '<div class="domain-wrapper"> <div class="glow"></div> <div class="title"><span>' + options.title + '</span></div> </div>',
                iconSize: [60, 60]
            });
            var marker = L.marker(center, {
                icon: cssIcon,
                domainId: options.domainId
            });
            if (options && options.events) {
                for (var event in options.events) {
                    options.events.hasOwnProperty(event)
                    && options.events[event]
                    && (typeof options.events[event] == 'function')
                    && marker.on(event, function (e) {
                        options.events[e.type](e);
                    });
                }
            }
            return marker;
        },

        /**
         * 添加一个标注点到地图
         * @param map {L.map} 地图
         * @param marker {Marker} 标注点对象
         */
        addMarker: function (map, marker) {
            if (!this.ready) return this;
            if (map && map.addLayer) {
                marker && marker.addTo(map);
            }
            return this;
        },

        /**
         * 添加若干个注点到地图，并返回点聚合对象
         * @param map {Map} 地图对象
         * @param cluster {L.markerClusterGroup} 点聚合对象，如果不存在，会自动创建一个聚合对象
         * @param markers {Array<Marker>} 标注点数组
         * @return {* || L.markerClusterGroup} 返回添加点聚合对象
         */
        addCluster: function (map, cluster, markers) {
            if (!this.ready) return {};
            if (markers && markers.length > 0) {
                if (!cluster) {
                    cluster = L.markerClusterGroup({
                        spiderfyOnMaxZoom: true,
                        showCoverageOnHover: false,
                        zoomToBoundsOnClick: true,
                        spiderLegPolylineOptions: {
                            weight: 1.5,
                            color: '#222',
                            opacity: 0.5
                        }
                    });
                }

                for (var i = 0; i < markers.length; i++) {
                    cluster.addLayer(markers[i]);
                }

                if (map && map.addLayer) {
                    map.addLayer(cluster);
                }
            }
            return cluster;
        },

        /**
         * 添加地图搜索控件
         * @param map
         * @param layerGroup {L.layerGroup}
         * @param options
         * @returns {*}
         */
        addSearchControl: function (map, layerGroup, options) {
            if (!this.ready) return {};
            var searchControl = new L.Control.Search($.extend({
                position: 'topleft',
                layer: layerGroup,
                initial: false,
                zoom: 12,
                marker: false,
                propertyName: 'tooltip',
                collapsed: false,
                textErr: '无法找到该电站',	//error message
                textCancel: '取消',		    //title in cancel button
                textPlaceholder: '请输入电站名...'   //placeholder value
            }, options));
            map && map.addControl && map.addControl(searchControl);

            return searchControl;
        },

        /**
         * 使地图自适应显示到合适的范围
         *
         * @param map
         * @param bounds {LatLngBounds} 给定的地理边界视图
         * @param options fitBounds options
         *
         * @return {LatLng} 新的中心点
         */
        fitView: function (map, bounds, options) {
            if (!(map && map.getCenter)) return null;
            if (!this.ready) return map.getCenter();
            if (!bounds) {
                var b = new L.LatLngBounds();
                map.eachLayer(function (t) {
                    try {
                        if (typeof(t.getBounds) == "function") {
                            t.getBounds() && b.extend(t.getBounds());
                        } else if (typeof(t.getLatLng) == "function") {
                            t.getLatLng() && b.extend(t.getLatLng());
                        }
                    } catch (e) {
                    }
                });
                //当地图上无任何域或者电站显示时, 不做fitBounds操作
                return b.isValid() && map.fitBounds(b, options);
            }

            return map.fitBounds(bounds, options);
        },

        /**
         * 定位到指定点
         * @param map
         * @param lng 经度
         * @param lat 纬度
         * @param zoomLevel 定位缩放级别（默认最大）
         * @param success 定位成功回调方法
         * @param error 定位失败回调方法
         */
        panToPoint: function (map, lng, lat, zoomLevel, success, error) {
            if (!this.ready) error && error instanceof Function && error();
            var self = this;
            setTimeout(function () {
                map.flyTo(self.createPoint(lng, lat), zoomLevel);
            }, 200);
            success && success instanceof Function && success();
        },

        /**
         * 清除地图
         * @param map
         * @return {MapUtil}
         */
        clearMap: function (map) {
            if (!this.ready) return this;
            if (map) {
                map.off();
                map.remove();
            }
            return this;
        },

        /**
         * 创建layerGroup, 用于保存电子围栏, 电站域, 电站等的标注信息, 重绘前可以方便的直接删除整个layerGroup
         * @param map
         * @returns {*}
         */
        createMarkerGroup: function (map) {
            if (!this.ready) return null;
            if (map && map.addLayer) {
                return L.layerGroup().addTo(map);
            }
            return null;
        },

        /**
         * 绘制折线
         * @param map
         * @param lineArr {Array.<LatLng>} 折线各端点坐标
         * @param properties {Object}
         */
        polyline: function (map, lineArr, properties) {
            if (!this.ready) return null;
            var p = L.polyline(lineArr, {
                color: (properties && properties.color) || 'red',            // 线颜色
                opacity: (properties && properties.opacity) || 1,            // 线透明度
                weight: (properties && properties.weight) || 2              // 线宽
            });
            if (map && map.addLayer) {
                p.addTo(map);
            }

            return p;
        },

        /**
         * 绘制多边形
         * @param map
         * @param gonArr {Array.<LatLng>} 多边形各顶点坐标
         * @param properties {Object}
         */
        polygon: function (map, gonArr, properties) {
            if (!this.ready) return null;
            var p = L.polygon(gonArr, {
                strokeColor: (properties && properties.strokeColor) || "#0000ff",
                strokeOpacity: (properties && properties.strokeOpacity) || 1,
                strokeWeight: (properties && properties.strokeWeight) || 2,
                fillColor: (properties && properties.fillColor) || "#f5deb3",
                fillOpacity: (properties && properties.fillOpacity) || 0.35
            });
            if (map && map.addLayer) {
                p.addTo(map);
            }

            return p;
        },

        /**
         * 绘制矩形
         * @param map
         * @param gonArr {Array.<LatLng>} 矩形左上角和右下角顶点坐标
         * @param properties {Object}
         */
        rectangle: function (map, gonArr, properties) {
            if (!this.ready) return null;
            var rect = L.rectangle(gonArr, {
                strokeColor: (properties && properties.strokeColor) || "#0000ff",
                strokeOpacity: (properties && properties.strokeOpacity) || 1,
                strokeWeight: (properties && properties.strokeWeight) || 2,
                fillColor: (properties && properties.fillColor) || "#f5deb3",
                fillOpacity: (properties && properties.fillOpacity) || 0.35
            });
            if (map && map.addLayer) {
                rect.addTo(map);
            }

            return rect;
        },

        /**
         * 绘制圆
         * @param map
         * @param center {LatLng} 圆心经纬度坐标
         * @param radius {Number} 半径
         * @param properties {Object}
         */
        circle: function (map, center, radius, properties) {
            if (!this.ready) return null;
            var c = L.circle(center, {
                opacity: (properties && properties.opacity) || 0.2,
                color: (properties && properties.color) || "orange", //线颜色
                fillColor: (properties && properties.fillColor) || "#ff0", //填充颜色
                fillOpacity: (properties && properties.fillOpacity) || 0.6,//填充透明度
                radius: radius
            });
            if (map && map.addLayer) {
                c.addTo(map);
            }

            return c;
        }

    };

    window.MapUtil = MapUtil;
    return MapUtil;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvTWFwVXRpbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSBwMDAwMzQgb24gMjAxNy0wMS0xMC5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5kZWZpbmUoW1xyXG4gICAgJ2pxdWVyeScsXHJcbiAgICAnY3NzIXBsdWdpbnMvTGVhZmxldC9sZWFmbGV0LmNzcycsXHJcbiAgICAnY3NzIXBsdWdpbnMvTGVhZmxldC9sZWFmbGV0LnNlYXJjaC5jc3MnLFxyXG4gICAgJ2NzcyFwbHVnaW5zL0xlYWZsZXQvTC5Db250cm9sLkJhc2VtYXBzLmNzcycsXHJcblxyXG4gICAgJ2xlYWZsZXQnLFxyXG4gICAgJ3BsdWdpbnMvTGVhZmxldC9sZWFmbGV0LnByb3ZpZGVycycsXHJcbiAgICAnbGVhZmxldC5hd2Vzb21lTWFya2VycycsXHJcbiAgICAnbGVhZmxldC5NYXJrZXJDbHVzdGVyJyxcclxuICAgICdwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5hY3RpdmVhcmVhJyxcclxuICAgICdwbHVnaW5zL0xlYWZsZXQvTGVhZmxldC5FZGl0YWJsZScsXHJcbiAgICAncGx1Z2lucy9MZWFmbGV0L0xlYWZsZXQuRWRpdGFibGUuRHJhZycsXHJcbiAgICAncGx1Z2lucy9MZWFmbGV0L2xlYWZsZXQuc2VhcmNoJyxcclxuICAgICdwbHVnaW5zL0xlYWZsZXQvTC5Db250cm9sLkJhc2VtYXBzJyxcclxuICAgICdwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5NYXNzTWFya2VyJ1xyXG5dLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgTWFwVXRpbCA9IHtcclxuICAgICAgICByZWFkeTogZmFsc2UsXHJcbiAgICAgICAgQ2FjaGU6IFtdLCAvLyDnvJPlrZjmlbDmja5cclxuICAgICAgICBkZWZhdWx0TGFuZ3VhZ2U6ICd6aCcsXHJcblxyXG4gICAgICAgIC8vdGhlbWU6IHtcclxuICAgICAgICAvLyAgICAnZGVmYXVsdCc6ICdvcGVuc3RyZWV0JywgLy8g6buY6K6k5Li76aKYIO+8iG9wZW5zdHJlZXRtYXDlnLDlm77vvIlcclxuICAgICAgICAvLyAgICAnc3RyZWV0cyc6ICdzdHJlZXRzLXYxMCcsIC8vIDJE5Zyw5Zu+XHJcbiAgICAgICAgLy8gICAgJ3NhdGVsbGl0ZSc6ICdzYXRlbGxpdGUtdjknLCAvLyDljavmmJ/lnLDlm77vvIjml6DooZfpgZPnrYnmta7moIfkv6Hmga/vvIlcclxuICAgICAgICAvLyAgICAnb3V0ZG9vcnMnOiAnb3V0ZG9vcnMtdjEwJywgLy8g562J6auY57q/5Zyw5Zu+XHJcbiAgICAgICAgLy8gICAgJ2RhcmsnOiAnZGFyay12OScsIC8vIOaal+iJsuS4u+mimFxyXG4gICAgICAgIC8vICAgICdsaWdodCc6ICdsaWdodC12OScsIC8vIOS6ruiJsuS4u+mimFxyXG4gICAgICAgIC8vICAgICdzYXRlbGxpdGUtc3RyZWV0cyc6ICdzYXRlbGxpdGUtc3RyZWV0cy12MTAnIC8vIOWNq+aYn+ihl+mBk+WcsOWbvlxyXG4gICAgICAgIC8vfSxcclxuXHJcbiAgICAgICAgT3B0aW9uVGVtcGxhdGVzOiB7XHJcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICB6b29tTGV2ZWw6IDMsXHJcbiAgICAgICAgICAgICAgICBtaW5ab29tOiAzLFxyXG4gICAgICAgICAgICAgICAgbWF4Wm9vbTogMTcsXHJcbiAgICAgICAgICAgICAgICBtYXBUeXBlOiAwLFxyXG4gICAgICAgICAgICAgICAgem9vbUNvbnRyb2w6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYm90dG9tcmlnaHQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHpvb21JblRpdGxlOiBNc2cubWFwLnpvb21zVGl0bGVbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgem9vbU91dFRpdGxlOiBNc2cubWFwLnpvb21zVGl0bGVbMV1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzY2FsZUNvbnRyb2w6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbWFwVHlwZUNvbnRyb2w6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYm90dG9tcmlnaHQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbGVYOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbGVZOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbGVaOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyczogWydzYXRlbGxpdGUnLCAnMkQnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcInBsYW50c1wiOiB7XHJcbiAgICAgICAgICAgICAgICB6b29tTGV2ZWw6IDMsXHJcbiAgICAgICAgICAgICAgICBtaW5ab29tOiAzLFxyXG4gICAgICAgICAgICAgICAgbWF4Wm9vbTogMTcsXHJcbiAgICAgICAgICAgICAgICBtYXBUeXBlOiAxLFxyXG4gICAgICAgICAgICAgICAgem9vbUNvbnRyb2w6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHNjYWxlQ29udHJvbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbWFwVHlwZUNvbnRyb2w6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyczogWydzYXRlbGxpdGUnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog57uY5Yi25bm25Yid5aeL5YyW5Zyw5Zu+XHJcbiAgICAgICAgICogQHBhcmFtIGlkIOWuueWZqElEXHJcbiAgICAgICAgICogQHBhcmFtIG9wdGlvbiDphY3nva7lj4LmlbBcclxuICAgICAgICAgKiBAcmV0dXJucyB7TWFwVXRpbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICBJbnN0YW5jZTogZnVuY3Rpb24gKGlkLCBvcHRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5yZWFkeSA9ICEhKHdpbmRvdy5MKTtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBwID0gdGhpcy5vcHRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwOiB7fSxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb246ICQuZXh0ZW5kKHRydWUsIHt9LCBzZWxmLk9wdGlvblRlbXBsYXRlc1tvcHRpb24udGhlbWUgfHwgJ2RlZmF1bHQnXSwgb3B0aW9uKSxcclxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGlkXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGxuZyA9IHAub3B0aW9uLmNlbnRlclswXTtcclxuICAgICAgICAgICAgICAgIHZhciBsYXQgPSBwLm9wdGlvbi5jZW50ZXJbMV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG9mZmxpbmUgPSBmYWxzZTtcclxuXHJcbi8vICAgICAgICAgICAgICAgIChuZXcgSW1hZ2UoJycpKS5sb2FkKG9mZmxpbmUgPSB0cnVlKS5lcnJvcihvZmZsaW5lID0gZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aWxlTGF5ZXJzID0gW10sIGluaXRMYXllciA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChvZmZsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5pdExheWVyLnB1c2goTC50aWxlTGF5ZXIucHJvdmlkZXIoJ1Bpbm5ldE1hcCcsIHtsYW5ndWFnZTogKHAub3B0aW9uLmxhbmd1YWdlIHx8IHNlbGYuZGVmYXVsdExhbmd1YWdlKX0pKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocC5vcHRpb24ubWFwVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0TGF5ZXIucHVzaChMLnRpbGVMYXllci5wcm92aWRlcignR29vZ2xlLlNhdGVsbGl0ZScsIHtsYW5ndWFnZTogKHAub3B0aW9uLmxhbmd1YWdlIHx8IHNlbGYuZGVmYXVsdExhbmd1YWdlKX0pKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0TGF5ZXIucHVzaChMLnRpbGVMYXllci5wcm92aWRlcignR29vZ2xlLk5vcm1hbCcsIHtsYW5ndWFnZTogKHAub3B0aW9uLmxhbmd1YWdlIHx8IHNlbGYuZGVmYXVsdExhbmd1YWdlKX0pKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aWxlTGF5ZXJzLnB1c2goaW5pdExheWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDliJvlu7rlnLDlm77lrp7kvotcclxuICAgICAgICAgICAgICAgIGlmICgkKCcjJyArIHAuY29udGFpbmVyKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuQ2FjaGVbaWRdICYmIHNlbGYuQ2FjaGVbaWRdLm1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyTWFwKHNlbGYuQ2FjaGVbaWRdLm1hcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHAubWFwID0gTC5tYXAocC5jb250YWluZXIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBzZWxmLmNyZWF0ZVBvaW50KGxuZywgbGF0KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogcC5vcHRpb24uem9vbUxldmVsIHx8IDUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblpvb206IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDE1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcnM6IGluaXRMYXllcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVuZGVyZXI6IEwuY2FudmFzKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvb21Db250cm9sOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRpb25Db250cm9sOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlib2FyZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbWF4Qm91bmRzOiBbWzkwLCAxODBdLCBbLTkwLCAtMTgwXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZXJ0aWE6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmxkQ29weUp1bXA6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBwLm1hcC5pbnZhbGlkYXRlU2l6ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBwLm9wdGlvbi5hY3RpdmVBcmVhICYmIHAubWFwLnNldEFjdGl2ZUFyZWEocC5vcHRpb24uYWN0aXZlQXJlYSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qIFRPRE8g5re75Yqg5o6n5Lu2ICovXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g57yp5pS+5o6n5Lu2XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAub3B0aW9uLnpvb21Db250cm9sICYmIHAub3B0aW9uLnpvb21Db250cm9sLnNob3cpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5tYXAuYWRkQ29udHJvbChMLmNvbnRyb2wuem9vbSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcC5vcHRpb24uem9vbUNvbnRyb2wucG9zaXRpb24gfHwgJ2JvdHRvbXJpZ2h0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvb21JblRleHQ6IHAub3B0aW9uLnpvb21Db250cm9sLnpvb21JblRleHQgfHwgJysnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgem9vbUluVGl0bGU6IHAub3B0aW9uLnpvb21Db250cm9sLnpvb21JblRpdGxlIHx8ICdab29tIGluJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpvb21PdXRUZXh0OiBwLm9wdGlvbi56b29tQ29udHJvbC56b29tT3V0VGV4dCB8fCAnLScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6b29tT3V0VGl0bGU6IHAub3B0aW9uLnpvb21Db250cm9sLnpvb21PdXRUaXRsZSB8fCAnWm9vbSBvdXQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5Zyw5Zu+57G75Z6L5YiH5o2i5o6n5Lu2XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvZmZsaW5lICYmIHAub3B0aW9uLm1hcFR5cGVDb250cm9sICYmIHAub3B0aW9uLm1hcFR5cGVDb250cm9sLnNob3cpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHAub3B0aW9uLm1hcFR5cGVDb250cm9sLmxheWVycywgZnVuY3Rpb24gKGlkeCwgbGF5ZXJOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXCIyRFwiID09IGxheWVyTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwLm9wdGlvbi5tYXBUeXBlICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGlsZUxheWVycy51bnNoaWZ0KFtMLnRpbGVMYXllci5wcm92aWRlcignR29vZ2xlLk5vcm1hbCcsIHtsYW5ndWFnZTogKHAub3B0aW9uLmxhbmd1YWdlIHx8IHNlbGYuZGVmYXVsdExhbmd1YWdlKX0pXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcInNhdGVsbGl0ZVwiID09IGxheWVyTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwLm9wdGlvbi5tYXBUeXBlICE9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGlsZUxheWVycy51bnNoaWZ0KFtMLnRpbGVMYXllci5wcm92aWRlcignR29vZ2xlLlNhdGVsbGl0ZScsIHtsYW5ndWFnZTogKHAub3B0aW9uLmxhbmd1YWdlIHx8IHNlbGYuZGVmYXVsdExhbmd1YWdlKX0pXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC5tYXAuYWRkQ29udHJvbChMLmNvbnRyb2wuYmFzZW1hcHMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHAub3B0aW9uLm1hcFR5cGVDb250cm9sLnBvc2l0aW9uIHx8ICdib3R0b21yaWdodCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aWxlTGF5ZXJzOiB0aWxlTGF5ZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGlsZVg6IHAub3B0aW9uLm1hcFR5cGVDb250cm9sLnRpbGVYIHx8IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aWxlWTogcC5vcHRpb24ubWFwVHlwZUNvbnRyb2wudGlsZVkgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbGVaOiBwLm9wdGlvbi5tYXBUeXBlQ29udHJvbC50aWxlWiB8fCAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5q+U5L6L5bC6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAub3B0aW9uLnNjYWxlQ29udHJvbCAmJiBwLm9wdGlvbi5zY2FsZUNvbnRyb2wuc2hvdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLm1hcC5hZGRDb250cm9sKEwuY29udHJvbC5zY2FsZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcC5vcHRpb24uc2NhbGVDb250cm9sLnBvc2l0aW9uIHx8ICdib3R0b21sZWZ0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiBwLm9wdGlvbi5zY2FsZUNvbnRyb2wubWF4V2lkdGggfHwgMTAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0cmljOiBwLm9wdGlvbi5zY2FsZUNvbnRyb2wubWV0cmljIHx8IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBlcmlhbDogcC5vcHRpb24uc2NhbGVDb250cm9sLmltcGVyaWFsIHx8IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5DYWNoZVtpZF0gPSBzZWxmLm9wdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNlbGY7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5Yib5bu65Z2Q5qCH54K577yIUG9pbnTvvIlcclxuICAgICAgICAgKiBAcGFyYW0gbG5nIOe7j+W6plxyXG4gICAgICAgICAqIEBwYXJhbSBsYXQg57qs5bqmXHJcbiAgICAgICAgICogQHJldHVybiB7KiB8fCBvLkxhdExuZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICBjcmVhdGVQb2ludDogZnVuY3Rpb24gKGxuZywgbGF0KSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTC5MYXRMbmcobGF0LCBsbmcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWIm+W7uuWDj+e0oOS9jee9rlxyXG4gICAgICAgICAqIEBwYXJhbSB4XHJcbiAgICAgICAgICogQHBhcmFtIHlcclxuICAgICAgICAgKiBAcmV0dXJuIHsqIHx8IG8ucG9pbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY3JlYXRlUGl4ZWw6IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBMLnBvaW50KHgsIHkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWIm+W7uuWbvuagh++8iEljb27vvIlcclxuICAgICAgICAgKiBAcGFyYW0gb3B0aW9ucyDlm77moIfmoLflvI/lj4LmlbBcclxuICAgICAgICAgKiA8cHJlPlxyXG4gICAgICAgICAqICAgICB7XHJcbiAgICAgICAgICogICAgICAgICAgaWNvblVybDogJy4vaW1hZ2VzL21hcmtlci1pY29uLnBuZycsIC8vIOWbvuagh+WbvueJh+WcsOWdgFxyXG4gICAgICAgICAqICAgICAgICAgIGljb25TaXplOiBbMzgsIDk1XSwgLy8g5Zu+5qCH5aSn5bCPW3gsIHldXHJcbiAgICAgICAgICogICAgICAgICAgaWNvbkFuY2hvcjogWzIyLCA5NF0sIC8vIOWbvuagh+agh+ivhuS4reW/g+S9jee9rlt4LCB5XVxyXG4gICAgICAgICAqICAgICAgICAgIHBvcHVwQW5jaG9yOiBbLTMsIC03Nl0sIC8vIOW8ueWHuuWxguaMh+WQkeWbvuagh+S9jee9rlt4LCB5XVxyXG4gICAgICAgICAqICAgICAgICAgIHNoYWRvd1VybDogJy4vaW1hZ2VzL21hcmtlci1zaGFkb3cucG5nJywgLy8g5Zu+5qCH6Zi05b2x5Zu+5bGCXHJcbiAgICAgICAgICogICAgICAgICAgc2hhZG93U2l6ZTogWzY4LCA5NV0sIC8vIOmYtOW9seWkp+Wwj1t4LCB5XVxyXG4gICAgICAgICAqICAgICAgICAgIHNoYWRvd0FuY2hvcjogWzIyLCA5NF0gLy8g6Zi05b2x5qCH6K+G5Lit5b+D5L2N572uW3gsIHldXHJcbiAgICAgICAgICogICAgIH1cclxuICAgICAgICAgKiA8L3ByZT5cclxuICAgICAgICAgKiBAcmV0dXJucyB7KiB8fCBvLkljb24gfHwgTC5Bd2Vzb21lTWFya2Vycy5JY29ufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNyZWF0ZUljb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHZhciBpY29uID0gTC5pY29uKCQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgIGljb25Vcmw6ICcuL2ltYWdlcy9tYXJrZXItaWNvbi5wbmcnLFxyXG4gICAgICAgICAgICAgICAgaWNvblNpemU6IFszOCwgOTVdLFxyXG4gICAgICAgICAgICAgICAgaWNvbkFuY2hvcjogWzIyLCA5NF0sXHJcbiAgICAgICAgICAgICAgICBwb3B1cEFuY2hvcjogWy0zLCAtNzZdLFxyXG4gICAgICAgICAgICAgICAgc2hhZG93VXJsOiAnLi9pbWFnZXMvbWFya2VyLXNoYWRvdy5wbmcnLFxyXG4gICAgICAgICAgICAgICAgc2hhZG93U2l6ZTogWzY4LCA5NV0sXHJcbiAgICAgICAgICAgICAgICBzaGFkb3dBbmNob3I6IFsyMiwgOTRdXHJcbiAgICAgICAgICAgIH0sIG9wdGlvbnMpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGljb24gfHwgTC5JY29uLkRlZmF1bHQoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDliJvlu7roh6rlrprkuYnlm77moIfvvIhEaXZJY29u77yJXHJcbiAgICAgICAgICogQHBhcmFtIG9wdGlvbnMg5Zu+5qCH5qC35byP5Y+C5pWwXHJcbiAgICAgICAgICogPHByZT5cclxuICAgICAgICAgKiAgICAge1xyXG4gICAgICAgICAqICAgICAgICAgIGljb25Vcmw6ICcuL2ltYWdlcy9tYXJrZXItaWNvbi5wbmcnLCAvLyDlm77moIflm77niYflnLDlnYBcclxuICAgICAgICAgKiAgICAgICAgICBpY29uU2l6ZTogWzM4LCA5NV0sIC8vIOWbvuagh+Wkp+Wwj1t4LCB5XVxyXG4gICAgICAgICAqICAgICAgICAgIGljb25BbmNob3I6IFsyMiwgOTRdLCAvLyDlm77moIfmoIfor4bkuK3lv4PkvY3nva5beCwgeV1cclxuICAgICAgICAgKiAgICAgICAgICBwb3B1cEFuY2hvcjogWy0zLCAtNzZdLCAvLyDlvLnlh7rlsYLmjIflkJHlm77moIfkvY3nva5beCwgeV1cclxuICAgICAgICAgKiAgICAgICAgICBzaGFkb3dVcmw6ICcuL2ltYWdlcy9tYXJrZXItc2hhZG93LnBuZycsIC8vIOWbvuagh+mYtOW9seWbvuWxglxyXG4gICAgICAgICAqICAgICAgICAgIHNoYWRvd1NpemU6IFs2OCwgOTVdLCAvLyDpmLTlvbHlpKflsI9beCwgeV1cclxuICAgICAgICAgKiAgICAgICAgICBzaGFkb3dBbmNob3I6IFsyMiwgOTRdIC8vIOmYtOW9seagh+ivhuS4reW/g+S9jee9rlt4LCB5XVxyXG4gICAgICAgICAqICAgICB9XHJcbiAgICAgICAgICogPC9wcmU+XHJcbiAgICAgICAgICogQHJldHVybnMgeyogfHwgby5EaXZJY29ufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNyZWF0ZUN1c3RvbUljb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHZhciBpY29uID0gTC5kaXZJY29uKCQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgIGljb25Vcmw6ICcuL2ltYWdlcy9tYXJrZXItaWNvbi5wbmcnLFxyXG4gICAgICAgICAgICAgICAgaWNvblNpemU6IFszOCwgOTVdLFxyXG4gICAgICAgICAgICAgICAgaWNvbkFuY2hvcjogWzIyLCA5NF0sXHJcbiAgICAgICAgICAgICAgICBwb3B1cEFuY2hvcjogWy0zLCAtNzZdLFxyXG4gICAgICAgICAgICAgICAgc2hhZG93VXJsOiAnLi9pbWFnZXMvbWFya2VyLXNoYWRvdy5wbmcnLFxyXG4gICAgICAgICAgICAgICAgc2hhZG93U2l6ZTogWzY4LCA5NV0sXHJcbiAgICAgICAgICAgICAgICBzaGFkb3dBbmNob3I6IFsyMiwgOTRdXHJcbiAgICAgICAgICAgIH0sIG9wdGlvbnMpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGljb24gfHwgTC5JY29uLkRlZmF1bHQoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDliJvlu7rpooTlrprkuYnmoIfms6jngrnlm77moIfvvIhBd2Vzb21lTWFya2Vyc0ljb27vvIlcclxuICAgICAgICAgKiBAcGFyYW0gb3B0aW9ucyDlm77moIflj4LmlbBcclxuICAgICAgICAgKiA8cHJlPlxyXG4gICAgICAgICAqICAgICB7PGJyPlxyXG4gICAgICAgICAqICAgICAgICAgIGljb246ICdob21lJywgLy8g5Zu+5qCH5ZCN56ew77yM5aaC77ya77yIJ2hvbWUnLCAnZ2xhc3MnLCAnZmxhZycsICdzdGFyJywgJ2Jvb2ttYXJrJywgLi4uLu+8iSog5omA5pyJ5Zyo77yaaHR0cDovL2ZvcnRhd2Vzb21lLmdpdGh1Yi5pby9Gb250LUF3ZXNvbWUvaWNvbnMv77yMaHR0cDovL2dldGJvb3RzdHJhcC5jb20vY29tcG9uZW50cy8jZ2x5cGhpY29uc++8jGh0dHA6Ly9pb25pY29ucy5jb23kuK3nmoTlm77moIflj6/ku6Xnm7TmjqXkvb/nlKg8YnI+XHJcbiAgICAgICAgICogICAgICAgICAgcHJlZml4OiAnZ2x5cGhpY29uJywgLy8g5Zu+5qCH5YmN57yA77yM5Y+v6YCJ5Zu+5qCH5bqTJ2dseXBoaWNvbifvvIhib290c3RyYXAgM++8ieOAgSdmYScoRm9udEF3ZXNvbWUpPGJyPlxyXG4gICAgICAgICAqICAgICAgICAgIG1hcmtlckNvbG9yOiAnYmx1ZScsIC8vIOagh+azqOeCueminOiJsu+8iOWPr+mAieWAvO+8midyZWQnLCAnZGFya3JlZCcsICdvcmFuZ2UnLCAnZ3JlZW4nLCAnZGFya2dyZWVuJywgJ2JsdWUnLCAncHVycGxlJywgJ2RhcmtwdXBsZScsICdjYWRldGJsdWUn77yJPGJyPlxyXG4gICAgICAgICAqICAgICAgICAgIGljb25Db2xvcjogJ3doaXRlJywgLy8g5Zu+5qCH6aKc6Imy77yI5Y+v6YCJ5YC877yaJ3doaXRlJywgJ2JsYWNrJyDmiJbogIUg6aKc6Imy5YC8IChoZXgsIHJnYmEg562JKTxicj5cclxuICAgICAgICAgKiAgICAgICAgICBzcGluOiBmYWxzZSwgLy8g5piv5ZCm6L2s5Yqo77yMKiBGb250QXdlc29tZeWbvuagh+W/heWhq++8gTxicj5cclxuICAgICAgICAgKiAgICAgICAgICBleHRyYUNsYXNzZXM6ICcnIC8vIOS4ukljb27nlJ/miJDmoIfnrb7mt7vliqDmjIflrproh6rlrprkuYnnmoQgY2xhc3Mg5bGe5oCn77yM5aaC77yaJ2ZhLXJvdGF0ZTkwIG15Y2xhc3MnPGJyPlxyXG4gICAgICAgICAqICAgICB9PGJyPlxyXG4gICAgICAgICAqIDwvcHJlPlxyXG4gICAgICAgICAqIEByZXR1cm5zIHsqIHx8IEwuQXdlc29tZU1hcmtlcnMuSWNvbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBjcmVhdGVBd2Vzb21lTWFya2Vyc0ljb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHZhciBpY29uID0gTC5Bd2Vzb21lTWFya2Vycy5pY29uKCQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgIGljb246ICdob21lJyxcclxuICAgICAgICAgICAgICAgIHByZWZpeDogJ2dseXBoaWNvbicsXHJcbiAgICAgICAgICAgICAgICBtYXJrZXJDb2xvcjogJ2JsdWUnLFxyXG4gICAgICAgICAgICAgICAgaWNvbkNvbG9yOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgc3BpbjogdHJ1ZVxyXG4gICAgICAgICAgICB9LCBvcHRpb25zKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBpY29uIHx8IEwuSWNvbi5EZWZhdWx0KCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5Yib5bu65qCH5rOo54K5KE1hcmtlcilcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSBwb2ludCB7TC5wb2ludH0g54K55a+56LGhXHJcbiAgICAgICAgICogQHBhcmFtIG9wdGlvbnMgeyp9IOWPguaVsFxyXG4gICAgICAgICAqICA8cHJlPlxyXG4gICAgICAgICAqICAgICAgezxicj5cclxuICAgICAgICAgKiAgICAgICAgICBpY29uOiBMLkljb24uRGVmYXVsdCgpLCAvLyB7TC5JY29uIHx8IEwuQXdlc29tZU1hcmtlcnMuSWNvbn0g6buY6K6k5Zu+5qCHPGJyPlxyXG4gICAgICAgICAqICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZSwgLy8g5L2/5Zu+5qCH5Y+v5ouW5ou9PGJyPlxyXG4gICAgICAgICAqICAgICAgICAgIHRpdGxlOiAnVGl0bGUnLCAvLyDmt7vliqDkuIDkuKrmoIfpopg8YnI+XHJcbiAgICAgICAgICogICAgICAgICAgb3BhY2l0eTogMC41IC8vIOiuvue9rumAj+aYjuW6pjxicj5cclxuICAgICAgICAgKiAgICAgIH08YnI+XHJcbiAgICAgICAgICogIDwvcHJlPlxyXG4gICAgICAgICAqIEByZXR1cm4ge01hcmtlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBjcmVhdGVNYXJrZXI6IGZ1bmN0aW9uIChwb2ludCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVhZHkpIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDFcclxuICAgICAgICAgICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFya2VyID0gTC5tYXJrZXIocG9pbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBvcHRpb25zLnBvcHVwICYmIG1hcmtlci5iaW5kUG9wdXAob3B0aW9ucy5wb3B1cCwge1xyXG4gICAgICAgICAgICAgICAgYXV0b1BhbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGtlZXBJblZpZXc6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBtYXhXaWR0aDogOTUwXHJcbiAgICAgICAgICAgIH0pLm9wZW5Qb3B1cCgpO1xyXG4gICAgICAgICAgICBvcHRpb25zLnRvb2x0aXAgJiYgbWFya2VyLmJpbmRUb29sdGlwKG9wdGlvbnMudG9vbHRpcCwge1xyXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAncmlnaHQnLFxyXG4gICAgICAgICAgICAgICAgcGVybWFuZW50OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMC43LFxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiBbMTQsIC0xOF1cclxuICAgICAgICAgICAgfSkub3BlblRvb2x0aXAoKTtcclxuICAgICAgICAgICAgLy8g5re75Yqg5LqL5Lu2XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZXZlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBldmVudCBpbiBvcHRpb25zLmV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXZlbnRzLmhhc093blByb3BlcnR5KGV2ZW50KVxyXG4gICAgICAgICAgICAgICAgICAgICYmIG9wdGlvbnMuZXZlbnRzW2V2ZW50XVxyXG4gICAgICAgICAgICAgICAgICAgICYmICh0eXBlb2Ygb3B0aW9ucy5ldmVudHNbZXZlbnRdID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgbWFya2VyLm9uKGV2ZW50LCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmV2ZW50c1tlLnR5cGVdKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtYXJrZXI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5Yib5bu65Z+f5qCH5rOo54K5XHJcbiAgICAgICAgICogQHBhcmFtIG1hcFxyXG4gICAgICAgICAqIEBwYXJhbSBjZW50ZXJcclxuICAgICAgICAgKiBAcGFyYW0gcmFkaXVzXHJcbiAgICAgICAgICogQHBhcmFtIG9wdGlvbnNcclxuICAgICAgICAgKiBAcmV0dXJucyB7TC5tYXJrZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY3JlYXRlRG9tYWluTWFya2VyOiBmdW5jdGlvbiAobWFwLCBjZW50ZXIsIHJhZGl1cywgb3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVhZHkpIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgY3NzSWNvbiA9IEwuZGl2SWNvbih7XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdkb21haW4taWNvbicsXHJcbiAgICAgICAgICAgICAgICBodG1sOiAnPGRpdiBjbGFzcz1cImRvbWFpbi13cmFwcGVyXCI+IDxkaXYgY2xhc3M9XCJnbG93XCI+PC9kaXY+IDxkaXYgY2xhc3M9XCJ0aXRsZVwiPjxzcGFuPicgKyBvcHRpb25zLnRpdGxlICsgJzwvc3Bhbj48L2Rpdj4gPC9kaXY+JyxcclxuICAgICAgICAgICAgICAgIGljb25TaXplOiBbNjAsIDYwXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdmFyIG1hcmtlciA9IEwubWFya2VyKGNlbnRlciwge1xyXG4gICAgICAgICAgICAgICAgaWNvbjogY3NzSWNvbixcclxuICAgICAgICAgICAgICAgIGRvbWFpbklkOiBvcHRpb25zLmRvbWFpbklkXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgZXZlbnQgaW4gb3B0aW9ucy5ldmVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmV2ZW50cy5oYXNPd25Qcm9wZXJ0eShldmVudClcclxuICAgICAgICAgICAgICAgICAgICAmJiBvcHRpb25zLmV2ZW50c1tldmVudF1cclxuICAgICAgICAgICAgICAgICAgICAmJiAodHlwZW9mIG9wdGlvbnMuZXZlbnRzW2V2ZW50XSA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICYmIG1hcmtlci5vbihldmVudCwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5ldmVudHNbZS50eXBlXShlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbWFya2VyO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOa3u+WKoOS4gOS4quagh+azqOeCueWIsOWcsOWbvlxyXG4gICAgICAgICAqIEBwYXJhbSBtYXAge0wubWFwfSDlnLDlm75cclxuICAgICAgICAgKiBAcGFyYW0gbWFya2VyIHtNYXJrZXJ9IOagh+azqOeCueWvueixoVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGFkZE1hcmtlcjogZnVuY3Rpb24gKG1hcCwgbWFya2VyKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIGlmIChtYXAgJiYgbWFwLmFkZExheWVyKSB7XHJcbiAgICAgICAgICAgICAgICBtYXJrZXIgJiYgbWFya2VyLmFkZFRvKG1hcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5re75Yqg6Iul5bmy5Liq5rOo54K55Yiw5Zyw5Zu+77yM5bm26L+U5Zue54K56IGa5ZCI5a+56LGhXHJcbiAgICAgICAgICogQHBhcmFtIG1hcCB7TWFwfSDlnLDlm77lr7nosaFcclxuICAgICAgICAgKiBAcGFyYW0gY2x1c3RlciB7TC5tYXJrZXJDbHVzdGVyR3JvdXB9IOeCueiBmuWQiOWvueixoe+8jOWmguaenOS4jeWtmOWcqO+8jOS8muiHquWKqOWIm+W7uuS4gOS4quiBmuWQiOWvueixoVxyXG4gICAgICAgICAqIEBwYXJhbSBtYXJrZXJzIHtBcnJheTxNYXJrZXI+fSDmoIfms6jngrnmlbDnu4RcclxuICAgICAgICAgKiBAcmV0dXJuIHsqIHx8IEwubWFya2VyQ2x1c3Rlckdyb3VwfSDov5Tlm57mt7vliqDngrnogZrlkIjlr7nosaFcclxuICAgICAgICAgKi9cclxuICAgICAgICBhZGRDbHVzdGVyOiBmdW5jdGlvbiAobWFwLCBjbHVzdGVyLCBtYXJrZXJzKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIHt9O1xyXG4gICAgICAgICAgICBpZiAobWFya2VycyAmJiBtYXJrZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghY2x1c3Rlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsdXN0ZXIgPSBMLm1hcmtlckNsdXN0ZXJHcm91cCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwaWRlcmZ5T25NYXhab29tOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93Q292ZXJhZ2VPbkhvdmVyOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbVRvQm91bmRzT25DbGljazogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3BpZGVyTGVnUG9seWxpbmVPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHQ6IDEuNSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzIyMicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFya2Vycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsdXN0ZXIuYWRkTGF5ZXIobWFya2Vyc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1hcCAmJiBtYXAuYWRkTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXAuYWRkTGF5ZXIoY2x1c3Rlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGNsdXN0ZXI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5re75Yqg5Zyw5Zu+5pCc57Si5o6n5Lu2XHJcbiAgICAgICAgICogQHBhcmFtIG1hcFxyXG4gICAgICAgICAqIEBwYXJhbSBsYXllckdyb3VwIHtMLmxheWVyR3JvdXB9XHJcbiAgICAgICAgICogQHBhcmFtIG9wdGlvbnNcclxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBhZGRTZWFyY2hDb250cm9sOiBmdW5jdGlvbiAobWFwLCBsYXllckdyb3VwLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIHt9O1xyXG4gICAgICAgICAgICB2YXIgc2VhcmNoQ29udHJvbCA9IG5ldyBMLkNvbnRyb2wuU2VhcmNoKCQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAndG9wbGVmdCcsXHJcbiAgICAgICAgICAgICAgICBsYXllcjogbGF5ZXJHcm91cCxcclxuICAgICAgICAgICAgICAgIGluaXRpYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgem9vbTogMTIsXHJcbiAgICAgICAgICAgICAgICBtYXJrZXI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiAndG9vbHRpcCcsXHJcbiAgICAgICAgICAgICAgICBjb2xsYXBzZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdGV4dEVycjogJ+aXoOazleaJvuWIsOivpeeUteermScsXHQvL2Vycm9yIG1lc3NhZ2VcclxuICAgICAgICAgICAgICAgIHRleHRDYW5jZWw6ICflj5bmtognLFx0XHQgICAgLy90aXRsZSBpbiBjYW5jZWwgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0ZXh0UGxhY2Vob2xkZXI6ICfor7fovpPlhaXnlLXnq5nlkI0uLi4nICAgLy9wbGFjZWhvbGRlciB2YWx1ZVxyXG4gICAgICAgICAgICB9LCBvcHRpb25zKSk7XHJcbiAgICAgICAgICAgIG1hcCAmJiBtYXAuYWRkQ29udHJvbCAmJiBtYXAuYWRkQ29udHJvbChzZWFyY2hDb250cm9sKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzZWFyY2hDb250cm9sO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOS9v+WcsOWbvuiHqumAguW6lOaYvuekuuWIsOWQiOmAgueahOiMg+WbtFxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIG1hcFxyXG4gICAgICAgICAqIEBwYXJhbSBib3VuZHMge0xhdExuZ0JvdW5kc30g57uZ5a6a55qE5Zyw55CG6L6555WM6KeG5Zu+XHJcbiAgICAgICAgICogQHBhcmFtIG9wdGlvbnMgZml0Qm91bmRzIG9wdGlvbnNcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm4ge0xhdExuZ30g5paw55qE5Lit5b+D54K5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZml0VmlldzogZnVuY3Rpb24gKG1hcCwgYm91bmRzLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICghKG1hcCAmJiBtYXAuZ2V0Q2VudGVyKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG1hcC5nZXRDZW50ZXIoKTtcclxuICAgICAgICAgICAgaWYgKCFib3VuZHMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBiID0gbmV3IEwuTGF0TG5nQm91bmRzKCk7XHJcbiAgICAgICAgICAgICAgICBtYXAuZWFjaExheWVyKGZ1bmN0aW9uICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZih0LmdldEJvdW5kcykgPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmdldEJvdW5kcygpICYmIGIuZXh0ZW5kKHQuZ2V0Qm91bmRzKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZih0LmdldExhdExuZykgPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmdldExhdExuZygpICYmIGIuZXh0ZW5kKHQuZ2V0TGF0TG5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy/lvZPlnLDlm77kuIrml6Dku7vkvZXln5/miJbogIXnlLXnq5nmmL7npLrml7YsIOS4jeWBmmZpdEJvdW5kc+aTjeS9nFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGIuaXNWYWxpZCgpICYmIG1hcC5maXRCb3VuZHMoYiwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXAuZml0Qm91bmRzKGJvdW5kcywgb3B0aW9ucyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5a6a5L2N5Yiw5oyH5a6a54K5XHJcbiAgICAgICAgICogQHBhcmFtIG1hcFxyXG4gICAgICAgICAqIEBwYXJhbSBsbmcg57uP5bqmXHJcbiAgICAgICAgICogQHBhcmFtIGxhdCDnuqzluqZcclxuICAgICAgICAgKiBAcGFyYW0gem9vbUxldmVsIOWumuS9jee8qeaUvue6p+WIq++8iOm7mOiupOacgOWkp++8iVxyXG4gICAgICAgICAqIEBwYXJhbSBzdWNjZXNzIOWumuS9jeaIkOWKn+Wbnuiwg+aWueazlVxyXG4gICAgICAgICAqIEBwYXJhbSBlcnJvciDlrprkvY3lpLHotKXlm57osIPmlrnms5VcclxuICAgICAgICAgKi9cclxuICAgICAgICBwYW5Ub1BvaW50OiBmdW5jdGlvbiAobWFwLCBsbmcsIGxhdCwgem9vbUxldmVsLCBzdWNjZXNzLCBlcnJvcikge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVhZHkpIGVycm9yICYmIGVycm9yIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgZXJyb3IoKTtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1hcC5mbHlUbyhzZWxmLmNyZWF0ZVBvaW50KGxuZywgbGF0KSwgem9vbUxldmVsKTtcclxuICAgICAgICAgICAgfSwgMjAwKTtcclxuICAgICAgICAgICAgc3VjY2VzcyAmJiBzdWNjZXNzIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgc3VjY2VzcygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOa4hemZpOWcsOWbvlxyXG4gICAgICAgICAqIEBwYXJhbSBtYXBcclxuICAgICAgICAgKiBAcmV0dXJuIHtNYXBVdGlsfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNsZWFyTWFwOiBmdW5jdGlvbiAobWFwKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIGlmIChtYXApIHtcclxuICAgICAgICAgICAgICAgIG1hcC5vZmYoKTtcclxuICAgICAgICAgICAgICAgIG1hcC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDliJvlu7psYXllckdyb3VwLCDnlKjkuo7kv53lrZjnlLXlrZDlm7TmoI8sIOeUteermeWfnywg55S156uZ562J55qE5qCH5rOo5L+h5oGvLCDph43nu5jliY3lj6/ku6Xmlrnkvr/nmoTnm7TmjqXliKDpmaTmlbTkuKpsYXllckdyb3VwXHJcbiAgICAgICAgICogQHBhcmFtIG1hcFxyXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNyZWF0ZU1hcmtlckdyb3VwOiBmdW5jdGlvbiAobWFwKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGlmIChtYXAgJiYgbWFwLmFkZExheWVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTC5sYXllckdyb3VwKCkuYWRkVG8obWFwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDnu5jliLbmipjnur9cclxuICAgICAgICAgKiBAcGFyYW0gbWFwXHJcbiAgICAgICAgICogQHBhcmFtIGxpbmVBcnIge0FycmF5LjxMYXRMbmc+fSDmipjnur/lkITnq6/ngrnlnZDmoIdcclxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydGllcyB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHBvbHlsaW5lOiBmdW5jdGlvbiAobWFwLCBsaW5lQXJyLCBwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHZhciBwID0gTC5wb2x5bGluZShsaW5lQXJyLCB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogKHByb3BlcnRpZXMgJiYgcHJvcGVydGllcy5jb2xvcikgfHwgJ3JlZCcsICAgICAgICAgICAgLy8g57q/6aKc6ImyXHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAocHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzLm9wYWNpdHkpIHx8IDEsICAgICAgICAgICAgLy8g57q/6YCP5piO5bqmXHJcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IChwcm9wZXJ0aWVzICYmIHByb3BlcnRpZXMud2VpZ2h0KSB8fCAyICAgICAgICAgICAgICAvLyDnur/lrr1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChtYXAgJiYgbWFwLmFkZExheWVyKSB7XHJcbiAgICAgICAgICAgICAgICBwLmFkZFRvKG1hcCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBwO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOe7mOWItuWkmui+ueW9olxyXG4gICAgICAgICAqIEBwYXJhbSBtYXBcclxuICAgICAgICAgKiBAcGFyYW0gZ29uQXJyIHtBcnJheS48TGF0TG5nPn0g5aSa6L655b2i5ZCE6aG254K55Z2Q5qCHXHJcbiAgICAgICAgICogQHBhcmFtIHByb3BlcnRpZXMge09iamVjdH1cclxuICAgICAgICAgKi9cclxuICAgICAgICBwb2x5Z29uOiBmdW5jdGlvbiAobWFwLCBnb25BcnIsIHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlYWR5KSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgdmFyIHAgPSBMLnBvbHlnb24oZ29uQXJyLCB7XHJcbiAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogKHByb3BlcnRpZXMgJiYgcHJvcGVydGllcy5zdHJva2VDb2xvcikgfHwgXCIjMDAwMGZmXCIsXHJcbiAgICAgICAgICAgICAgICBzdHJva2VPcGFjaXR5OiAocHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzLnN0cm9rZU9wYWNpdHkpIHx8IDEsXHJcbiAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IChwcm9wZXJ0aWVzICYmIHByb3BlcnRpZXMuc3Ryb2tlV2VpZ2h0KSB8fCAyLFxyXG4gICAgICAgICAgICAgICAgZmlsbENvbG9yOiAocHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzLmZpbGxDb2xvcikgfHwgXCIjZjVkZWIzXCIsXHJcbiAgICAgICAgICAgICAgICBmaWxsT3BhY2l0eTogKHByb3BlcnRpZXMgJiYgcHJvcGVydGllcy5maWxsT3BhY2l0eSkgfHwgMC4zNVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKG1hcCAmJiBtYXAuYWRkTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIHAuYWRkVG8obWFwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHA7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog57uY5Yi255+p5b2iXHJcbiAgICAgICAgICogQHBhcmFtIG1hcFxyXG4gICAgICAgICAqIEBwYXJhbSBnb25BcnIge0FycmF5LjxMYXRMbmc+fSDnn6nlvaLlt6bkuIrop5Llkozlj7PkuIvop5LpobbngrnlnZDmoIdcclxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydGllcyB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHJlY3RhbmdsZTogZnVuY3Rpb24gKG1hcCwgZ29uQXJyLCBwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHZhciByZWN0ID0gTC5yZWN0YW5nbGUoZ29uQXJyLCB7XHJcbiAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogKHByb3BlcnRpZXMgJiYgcHJvcGVydGllcy5zdHJva2VDb2xvcikgfHwgXCIjMDAwMGZmXCIsXHJcbiAgICAgICAgICAgICAgICBzdHJva2VPcGFjaXR5OiAocHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzLnN0cm9rZU9wYWNpdHkpIHx8IDEsXHJcbiAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IChwcm9wZXJ0aWVzICYmIHByb3BlcnRpZXMuc3Ryb2tlV2VpZ2h0KSB8fCAyLFxyXG4gICAgICAgICAgICAgICAgZmlsbENvbG9yOiAocHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzLmZpbGxDb2xvcikgfHwgXCIjZjVkZWIzXCIsXHJcbiAgICAgICAgICAgICAgICBmaWxsT3BhY2l0eTogKHByb3BlcnRpZXMgJiYgcHJvcGVydGllcy5maWxsT3BhY2l0eSkgfHwgMC4zNVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKG1hcCAmJiBtYXAuYWRkTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlY3QuYWRkVG8obWFwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlY3Q7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog57uY5Yi25ZyGXHJcbiAgICAgICAgICogQHBhcmFtIG1hcFxyXG4gICAgICAgICAqIEBwYXJhbSBjZW50ZXIge0xhdExuZ30g5ZyG5b+D57uP57qs5bqm5Z2Q5qCHXHJcbiAgICAgICAgICogQHBhcmFtIHJhZGl1cyB7TnVtYmVyfSDljYrlvoRcclxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydGllcyB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNpcmNsZTogZnVuY3Rpb24gKG1hcCwgY2VudGVyLCByYWRpdXMsIHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlYWR5KSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgdmFyIGMgPSBMLmNpcmNsZShjZW50ZXIsIHtcclxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IChwcm9wZXJ0aWVzICYmIHByb3BlcnRpZXMub3BhY2l0eSkgfHwgMC4yLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6IChwcm9wZXJ0aWVzICYmIHByb3BlcnRpZXMuY29sb3IpIHx8IFwib3JhbmdlXCIsIC8v57q/6aKc6ImyXHJcbiAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IChwcm9wZXJ0aWVzICYmIHByb3BlcnRpZXMuZmlsbENvbG9yKSB8fCBcIiNmZjBcIiwgLy/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGZpbGxPcGFjaXR5OiAocHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzLmZpbGxPcGFjaXR5KSB8fCAwLjYsLy/loavlhYXpgI/mmI7luqZcclxuICAgICAgICAgICAgICAgIHJhZGl1czogcmFkaXVzXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAobWFwICYmIG1hcC5hZGRMYXllcikge1xyXG4gICAgICAgICAgICAgICAgYy5hZGRUbyhtYXApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYztcclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB3aW5kb3cuTWFwVXRpbCA9IE1hcFV0aWw7XHJcbiAgICByZXR1cm4gTWFwVXRpbDtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL0xlYWZsZXQvTWFwVXRpbC5qcyJ9
