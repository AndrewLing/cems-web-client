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

    L.TileLayer.Provider = L.TileLayer.extend({
        initialize: function (arg, options) {
            var providers = L.TileLayer.Provider.providers;

            var parts = arg.split('.');

            var providerName = parts[0];
            var variantName = parts[1];

            if (!providers[providerName]) {
                throw 'No such provider (' + providerName + ')';
            }

            var provider = {
                url: providers[providerName].url,
                options: providers[providerName].options
            };

            // overwrite values in provider from variant.
            if (variantName && 'variants' in providers[providerName]) {
                if (!(variantName in providers[providerName].variants)) {
                    throw 'No such variant of ' + providerName + ' (' + variantName + ')';
                }
                var variant = providers[providerName].variants[variantName];
                var variantOptions;
                if (typeof variant === 'string') {
                    variantOptions = {
                        variant: variant
                    };
                } else {
                    variantOptions = variant.options;
                }
                provider = {
                    url: variant.url || provider.url,
                    options: L.Util.extend({}, provider.options, variantOptions)
                };
            }

            var forceHTTP = window.location.protocol === 'file:' || provider.options.forceHTTP;
            if (provider.url.indexOf('//') === 0 && forceHTTP) {
                provider.url = 'http:' + provider.url;
            }

            // If retina option is set
            if (provider.options.retina) {
                // Check retina screen
                if (options.detectRetina && L.Browser.retina) {
                    // The retina option will be active now
                    // But we need to prevent Leaflet retina mode
                    options.detectRetina = false;
                } else {
                    // No retina, remove option
                    provider.options.retina = '';
                }
            }

            // replace attribution placeholders with their values from toplevel provider attribution,
            // recursively
            var attributionReplacer = function (attr) {
                if (attr.indexOf('{attribution.') === -1) {
                    return attr;
                }
                return attr.replace(/\{attribution.(\w*)\}/,
                    function (match, attributionName) {
                        return attributionReplacer(providers[attributionName].options.attribution);
                    }
                );
            };
            provider.options.attribution = attributionReplacer(provider.options.attribution);

            // Compute final options combining provider options with any user overrides
            var layerOpts = L.Util.extend({}, provider.options, options);
            L.TileLayer.prototype.initialize.call(this, provider.url, layerOpts);
        }
    });

    /**
     * Definition of providers.
     * see http://leafletjs.com/reference.html#tilelayer for options in the options map.
     */

    L.TileLayer.Provider.providers = {
        OpenStreetMap: {
            url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            options: {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            },
            variants: {
                Mapnik: {},
                BlackAndWhite: {
                    url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
                    options: {
                        maxZoom: 18
                    }
                },
                DE: {
                    url: 'http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
                    options: {
                        maxZoom: 18
                    }
                },
                France: {
                    url: '//{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                    options: {
                        maxZoom: 20,
                        attribution: '&copy; Openstreetmap France | {attribution.OpenStreetMap}'
                    }
                },
                HOT: {
                    url: '//{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                    options: {
                        attribution: '{attribution.OpenStreetMap}, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
                    }
                }
            }
        },
        OpenSeaMap: {
            url: 'http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
            options: {
                attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
            }
        },
        OpenTopoMap: {
            url: '//{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            options: {
                maxZoom: 17,
                attribution: 'Map data: {attribution.OpenStreetMap}, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            }
        },
        Thunderforest: {
            url: '//{s}.tile.thunderforest.com/{variant}/{z}/{x}/{y}.png?apikey={apikey}',
            options: {
                attribution:
                    '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, {attribution.OpenStreetMap}',
                variant: 'cycle'
            },
            variants: {
                OpenCycleMap: 'cycle',
                Transport: {
                    options: {
                        variant: 'transport',
                        maxZoom: 19
                    }
                },
                TransportDark: {
                    options: {
                        variant: 'transport-dark',
                        maxZoom: 19
                    }
                },
                SpinalMap: {
                    options: {
                        variant: 'spinal-map',
                        maxZoom: 11
                    }
                },
                Landscape: 'landscape',
                Outdoors: 'outdoors',
                Pioneer: 'pioneer'
            }
        },
        OpenMapSurfer: {
            url: 'http://korona.geog.uni-heidelberg.de/tiles/{variant}/x={x}&y={y}&z={z}',
            options: {
                maxZoom: 20,
                variant: 'roads',
                attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data {attribution.OpenStreetMap}'
            },
            variants: {
                Roads: 'roads',
                AdminBounds: {
                    options: {
                        variant: 'adminb',
                        maxZoom: 19
                    }
                },
                Grayscale: {
                    options: {
                        variant: 'roadsg',
                        maxZoom: 19
                    }
                }
            }
        },
        Hydda: {
            url: '//{s}.tile.openstreetmap.se/hydda/{variant}/{z}/{x}/{y}.png',
            options: {
                variant: 'full',
                attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data {attribution.OpenStreetMap}'
            },
            variants: {
                Full: 'full',
                Base: 'base',
                RoadsAndLabels: 'roads_and_labels'
            }
        },
        MapBox: {
            url: 'https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}',
            //url: '//api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
            options: {
                attribution:
                'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; ' +
                'Map data {attribution.OpenStreetMap}',
                subdomains: 'abcd'
            }
        },
        Stamen: {
            url: '//stamen-tiles-{s}.a.ssl.fastly.net/{variant}/{z}/{x}/{y}.{ext}',
            options: {
                attribution:
                'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
                '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
                'Map data {attribution.OpenStreetMap}',
                subdomains: 'abcd',
                minZoom: 0,
                maxZoom: 20,
                variant: 'toner',
                ext: 'png'
            },
            variants: {
                Toner: 'toner',
                TonerBackground: 'toner-background',
                TonerHybrid: 'toner-hybrid',
                TonerLines: 'toner-lines',
                TonerLabels: 'toner-labels',
                TonerLite: 'toner-lite',
                Watercolor: {
                    options: {
                        variant: 'watercolor',
                        minZoom: 1,
                        maxZoom: 16
                    }
                },
                Terrain: {
                    options: {
                        variant: 'terrain',
                        minZoom: 0,
                        maxZoom: 18
                    }
                },
                TerrainBackground: {
                    options: {
                        variant: 'terrain-background',
                        minZoom: 0,
                        maxZoom: 18
                    }
                },
                TopOSMRelief: {
                    options: {
                        variant: 'toposm-color-relief',
                        ext: 'jpg',
                        bounds: [[22, -132], [51, -56]]
                    }
                },
                TopOSMFeatures: {
                    options: {
                        variant: 'toposm-features',
                        bounds: [[22, -132], [51, -56]],
                        opacity: 0.9
                    }
                }
            }
        },
        Esri: {
            url: '//server.arcgisonline.com/ArcGIS/rest/services/{variant}/MapServer/tile/{z}/{y}/{x}',
            options: {
                variant: 'World_Street_Map',
                attribution: 'Tiles &copy; Esri'
            },
            variants: {
                WorldStreetMap: {
                    options: {
                        attribution:
                        '{attribution.Esri} &mdash; ' +
                        'Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                    }
                },
                DeLorme: {
                    options: {
                        variant: 'Specialty/DeLorme_World_Base_Map',
                        minZoom: 1,
                        maxZoom: 11,
                        attribution: '{attribution.Esri} &mdash; Copyright: &copy;2012 DeLorme'
                    }
                },
                WorldTopoMap: {
                    options: {
                        variant: 'World_Topo_Map',
                        attribution:
                        '{attribution.Esri} &mdash; ' +
                        'Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                    }
                },
                WorldImagery: {
                    options: {
                        variant: 'World_Imagery',
                        attribution:
                        '{attribution.Esri} &mdash; ' +
                        'Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    }
                },
                WorldTerrain: {
                    options: {
                        variant: 'World_Terrain_Base',
                        maxZoom: 13,
                        attribution:
                        '{attribution.Esri} &mdash; ' +
                        'Source: USGS, Esri, TANA, DeLorme, and NPS'
                    }
                },
                WorldShadedRelief: {
                    options: {
                        variant: 'World_Shaded_Relief',
                        maxZoom: 13,
                        attribution: '{attribution.Esri} &mdash; Source: Esri'
                    }
                },
                WorldPhysical: {
                    options: {
                        variant: 'World_Physical_Map',
                        maxZoom: 8,
                        attribution: '{attribution.Esri} &mdash; Source: US National Park Service'
                    }
                },
                OceanBasemap: {
                    options: {
                        variant: 'Ocean_Basemap',
                        maxZoom: 13,
                        attribution: '{attribution.Esri} &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
                    }
                },
                NatGeoWorldMap: {
                    options: {
                        variant: 'NatGeo_World_Map',
                        maxZoom: 16,
                        attribution: '{attribution.Esri} &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
                    }
                },
                WorldGrayCanvas: {
                    options: {
                        variant: 'Canvas/World_Light_Gray_Base',
                        maxZoom: 16,
                        attribution: '{attribution.Esri} &mdash; Esri, DeLorme, NAVTEQ'
                    }
                }
            }
        },
        OpenWeatherMap: {
            url: 'http://{s}.tile.openweathermap.org/map/{variant}/{z}/{x}/{y}.png',
            options: {
                maxZoom: 19,
                attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
                opacity: 0.5
            },
            variants: {
                Clouds: 'clouds',
                CloudsClassic: 'clouds_cls',
                Precipitation: 'precipitation',
                PrecipitationClassic: 'precipitation_cls',
                Rain: 'rain',
                RainClassic: 'rain_cls',
                Pressure: 'pressure',
                PressureContour: 'pressure_cntr',
                Wind: 'wind',
                Temperature: 'temp',
                Snow: 'snow'
            }
        },
        HERE: {
            /*
             * HERE maps, formerly Nokia maps.
             * These basemaps are free, but you need an API key. Please sign up at
             * http://developer.here.com/getting-started
             *
             * Note that the base urls contain '.cit' whichs is HERE's
             * 'Customer Integration Testing' environment. Please remove for production
             * envirionments.
             */
            url:
            '//{s}.{base}.maps.cit.api.here.com/maptile/2.1/' +
            '{type}/{mapID}/{variant}/{z}/{x}/{y}/{size}/{format}?' +
            'app_id={app_id}&app_code={app_code}&lg={language}',
            options: {
                attribution:
                    'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
                subdomains: '1234',
                mapID: 'newest',
                'app_id': '<insert your app_id here>',
                'app_code': '<insert your app_code here>',
                base: 'base',
                variant: 'normal.day',
                maxZoom: 20,
                type: 'maptile',
                language: 'eng',
                format: 'png8',
                size: '256'
            },
            variants: {
                normalDay: 'normal.day',
                normalDayCustom: 'normal.day.custom',
                normalDayGrey: 'normal.day.grey',
                normalDayMobile: 'normal.day.mobile',
                normalDayGreyMobile: 'normal.day.grey.mobile',
                normalDayTransit: 'normal.day.transit',
                normalDayTransitMobile: 'normal.day.transit.mobile',
                normalNight: 'normal.night',
                normalNightMobile: 'normal.night.mobile',
                normalNightGrey: 'normal.night.grey',
                normalNightGreyMobile: 'normal.night.grey.mobile',

                basicMap: {
                    options: {
                        type: 'basetile'
                    }
                },
                mapLabels: {
                    options: {
                        type: 'labeltile',
                        format: 'png'
                    }
                },
                trafficFlow: {
                    options: {
                        base: 'traffic',
                        type: 'flowtile'
                    }
                },
                carnavDayGrey: 'carnav.day.grey',
                hybridDay: {
                    options: {
                        base: 'aerial',
                        variant: 'hybrid.day'
                    }
                },
                hybridDayMobile: {
                    options: {
                        base: 'aerial',
                        variant: 'hybrid.day.mobile'
                    }
                },
                pedestrianDay: 'pedestrian.day',
                pedestrianNight: 'pedestrian.night',
                satelliteDay: {
                    options: {
                        base: 'aerial',
                        variant: 'satellite.day'
                    }
                },
                terrainDay: {
                    options: {
                        base: 'aerial',
                        variant: 'terrain.day'
                    }
                },
                terrainDayMobile: {
                    options: {
                        base: 'aerial',
                        variant: 'terrain.day.mobile'
                    }
                }
            }
        },
        FreeMapSK: {
            url: 'http://t{s}.freemap.sk/T/{z}/{x}/{y}.jpeg',
            options: {
                minZoom: 8,
                maxZoom: 16,
                subdomains: '1234',
                bounds: [[47.204642, 15.996093], [49.830896, 22.576904]],
                attribution:
                    '{attribution.OpenStreetMap}, vizualization CC-By-SA 2.0 <a href="http://freemap.sk">Freemap.sk</a>'
            }
        },
        MtbMap: {
            url: 'http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png',
            options: {
                attribution:
                    '{attribution.OpenStreetMap} &amp; USGS'
            }
        },
        CartoDB: {
            url: 'http://{s}.basemaps.cartocdn.com/{variant}/{z}/{x}/{y}.png',
            options: {
                attribution: '{attribution.OpenStreetMap} &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19,
                variant: 'light_all'
            },
            variants: {
                Positron: 'light_all',
                PositronNoLabels: 'light_nolabels',
                PositronOnlyLabels: 'light_only_labels',
                DarkMatter: 'dark_all',
                DarkMatterNoLabels: 'dark_nolabels',
                DarkMatterOnlyLabels: 'dark_only_labels'
            }
        },
        HikeBike: {
            url: 'http://{s}.tiles.wmflabs.org/{variant}/{z}/{x}/{y}.png',
            options: {
                maxZoom: 19,
                attribution: '{attribution.OpenStreetMap}',
                variant: 'hikebike'
            },
            variants: {
                HikeBike: {},
                HillShading: {
                    options: {
                        maxZoom: 15,
                        variant: 'hillshading'
                    }
                }
            }
        },
        BasemapAT: {
            url: 'https://maps{s}.wien.gv.at/basemap/{variant}/normal/google3857/{z}/{y}/{x}.{format}',
            options: {
                maxZoom: 19,
                attribution: 'Datenquelle: <a href="www.basemap.at">basemap.at</a>',
                subdomains: ['', '1', '2', '3', '4'],
                format: 'png',
                bounds: [[46.358770, 8.782379], [49.037872, 17.189532]],
                variant: 'geolandbasemap'
            },
            variants: {
                basemap: {
                    options: {
                        maxZoom: 20, // currently only in Vienna
                        variant: 'geolandbasemap'
                    }
                },
                grau: 'bmapgrau',
                overlay: 'bmapoverlay',
                highdpi: {
                    options: {
                        variant: 'bmaphidpi',
                        format: 'jpeg'
                    }
                },
                orthofoto: {
                    options: {
                        maxZoom: 20, // currently only in Vienna
                        variant: 'bmaporthofoto30cm',
                        format: 'jpeg'
                    }
                }
            }
        },
        NASAGIBS: {
            url: '//map1.vis.earthdata.nasa.gov/wmts-webmerc/{variant}/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
            options: {
                attribution:
                'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
                '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
                bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
                minZoom: 1,
                maxZoom: 9,
                format: 'jpg',
                time: '',
                tilematrixset: 'GoogleMapsCompatible_Level'
            },
            variants: {
                ModisTerraTrueColorCR: 'MODIS_Terra_CorrectedReflectance_TrueColor',
                ModisTerraBands367CR: 'MODIS_Terra_CorrectedReflectance_Bands367',
                ViirsEarthAtNight2012: {
                    options: {
                        variant: 'VIIRS_CityLights_2012',
                        maxZoom: 8
                    }
                },
                ModisTerraLSTDay: {
                    options: {
                        variant: 'MODIS_Terra_Land_Surface_Temp_Day',
                        format: 'png',
                        maxZoom: 7,
                        opacity: 0.75
                    }
                },
                ModisTerraSnowCover: {
                    options: {
                        variant: 'MODIS_Terra_Snow_Cover',
                        format: 'png',
                        maxZoom: 8,
                        opacity: 0.75
                    }
                },
                ModisTerraAOD: {
                    options: {
                        variant: 'MODIS_Terra_Aerosol',
                        format: 'png',
                        maxZoom: 6,
                        opacity: 0.75
                    }
                },
                ModisTerraChlorophyll: {
                    options: {
                        variant: 'MODIS_Terra_Chlorophyll_A',
                        format: 'png',
                        maxZoom: 7,
                        opacity: 0.75
                    }
                }
            }
        },
        NLS: {
            // NLS maps are copyright National library of Scotland.
            // http://maps.nls.uk/projects/api/index.html
            // Please contact NLS for anything other than non-commercial low volume usage
            //
            // Map sources: Ordnance Survey 1:1m to 1:63K, 1920s-1940s
            //   z0-9  - 1:1m
            //  z10-11 - quarter inch (1:253440)
            //  z12-18 - one inch (1:63360)
            url: '//nls-{s}.tileserver.com/nls/{z}/{x}/{y}.jpg',
            options: {
                attribution: '<a href="http://geo.nls.uk/maps/">National Library of Scotland Historic Maps</a>',
                bounds: [[49.6, -12], [61.7, 3]],
                minZoom: 1,
                maxZoom: 18,
                subdomains: '0123'
            }
        },
        JusticeMap: {
            // Justice Map (http://www.justicemap.org/)
            // Visualize race and income data for your community, county and country.
            // Includes tools for data journalists, bloggers and community activists.
            url: 'http://www.justicemap.org/tile/{size}/{variant}/{z}/{x}/{y}.png',
            options: {
                attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
                // one of 'county', 'tract', 'block'
                size: 'county',
                // Bounds for USA, including Alaska and Hawaii
                bounds: [[14, -180], [72, -56]]
            },
            variants: {
                income: 'income',
                americanIndian: 'indian',
                asian: 'asian',
                black: 'black',
                hispanic: 'hispanic',
                multi: 'multi',
                nonWhite: 'nonwhite',
                white: 'white',
                plurality: 'plural'
            }
        },

        GaoDe: {
            url: 'http://webrd0{s}.is.autonavi.com/appmaptile?lang={language}&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            options: {
                attribution: '',
                subdomains: '1234',
                language: 'zh_cn'
            },
            variants: {
                Normal: {},
                Satellite: {
                    url: 'http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
                },
                SatelliteAnnotion: {
                    url: 'http://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
                }
            }
        },

        Google: {
            url: 'http://www.google.cn/maps/vt?lyrs={lyrs}&hl={language}&x={x}&y={y}&z={z}',
            options: {
                attribution: '',
                lyrs: 'm',
                language: 'zh'
            },
            variants: {
                Normal: {
                    options: {
                        lyrs: 'p,m'
                    }
                },
                Satellite: {
                    options: {
                        lyrs: 's,m'
                    }
                }
            }
        },

        PinnetMap: {
            //url: 'http://www.pinnet.com/getMapData?lyrs={lyrs}&hl={language}&x={x}&y={y}&z={z}',
            url: './images/tiles/{language}/{z}/{x}/{y}.png',
            options: {
                attribution: '<a href="http://www.pinnet.com/getMapData">Pinnet离线地图</a>',
                language: 'zh'
            }
        }

    };

    L.tileLayer.provider = function (provider, options) {
        return new L.TileLayer.Provider(provider, options);
    };

    return L;
}));
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5wcm92aWRlcnMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XHJcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxyXG4gICAgICAgIGRlZmluZShbJ2xlYWZsZXQnXSwgZmFjdG9yeSk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGVzID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIC8vIGRlZmluZSBhIENvbW1vbiBKUyBtb2R1bGUgdGhhdCByZWxpZXMgb24gJ2xlYWZsZXQnXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xlYWZsZXQnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEFzc3VtZSBMZWFmbGV0IGlzIGxvYWRlZCBpbnRvIGdsb2JhbCBvYmplY3QgTCBhbHJlYWR5XHJcbiAgICAgICAgZmFjdG9yeShMKTtcclxuICAgIH1cclxufSh0aGlzLCBmdW5jdGlvbiAoTCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIEwuVGlsZUxheWVyLlByb3ZpZGVyID0gTC5UaWxlTGF5ZXIuZXh0ZW5kKHtcclxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXJnLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm92aWRlcnMgPSBMLlRpbGVMYXllci5Qcm92aWRlci5wcm92aWRlcnM7XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFydHMgPSBhcmcuc3BsaXQoJy4nKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwcm92aWRlck5hbWUgPSBwYXJ0c1swXTtcclxuICAgICAgICAgICAgdmFyIHZhcmlhbnROYW1lID0gcGFydHNbMV07XHJcblxyXG4gICAgICAgICAgICBpZiAoIXByb3ZpZGVyc1twcm92aWRlck5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnTm8gc3VjaCBwcm92aWRlciAoJyArIHByb3ZpZGVyTmFtZSArICcpJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHByb3ZpZGVyID0ge1xyXG4gICAgICAgICAgICAgICAgdXJsOiBwcm92aWRlcnNbcHJvdmlkZXJOYW1lXS51cmwsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBwcm92aWRlcnNbcHJvdmlkZXJOYW1lXS5vcHRpb25zXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBvdmVyd3JpdGUgdmFsdWVzIGluIHByb3ZpZGVyIGZyb20gdmFyaWFudC5cclxuICAgICAgICAgICAgaWYgKHZhcmlhbnROYW1lICYmICd2YXJpYW50cycgaW4gcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV0pIHtcclxuICAgICAgICAgICAgICAgIGlmICghKHZhcmlhbnROYW1lIGluIHByb3ZpZGVyc1twcm92aWRlck5hbWVdLnZhcmlhbnRzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdObyBzdWNoIHZhcmlhbnQgb2YgJyArIHByb3ZpZGVyTmFtZSArICcgKCcgKyB2YXJpYW50TmFtZSArICcpJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciB2YXJpYW50ID0gcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV0udmFyaWFudHNbdmFyaWFudE5hbWVdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhcmlhbnRPcHRpb25zO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YXJpYW50ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhbnRPcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiB2YXJpYW50XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFudE9wdGlvbnMgPSB2YXJpYW50Lm9wdGlvbnM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcm92aWRlciA9IHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHZhcmlhbnQudXJsIHx8IHByb3ZpZGVyLnVybCxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBMLlV0aWwuZXh0ZW5kKHt9LCBwcm92aWRlci5vcHRpb25zLCB2YXJpYW50T3B0aW9ucylcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmb3JjZUhUVFAgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdmaWxlOicgfHwgcHJvdmlkZXIub3B0aW9ucy5mb3JjZUhUVFA7XHJcbiAgICAgICAgICAgIGlmIChwcm92aWRlci51cmwuaW5kZXhPZignLy8nKSA9PT0gMCAmJiBmb3JjZUhUVFApIHtcclxuICAgICAgICAgICAgICAgIHByb3ZpZGVyLnVybCA9ICdodHRwOicgKyBwcm92aWRlci51cmw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIHJldGluYSBvcHRpb24gaXMgc2V0XHJcbiAgICAgICAgICAgIGlmIChwcm92aWRlci5vcHRpb25zLnJldGluYSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgcmV0aW5hIHNjcmVlblxyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGV0ZWN0UmV0aW5hICYmIEwuQnJvd3Nlci5yZXRpbmEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgcmV0aW5hIG9wdGlvbiB3aWxsIGJlIGFjdGl2ZSBub3dcclxuICAgICAgICAgICAgICAgICAgICAvLyBCdXQgd2UgbmVlZCB0byBwcmV2ZW50IExlYWZsZXQgcmV0aW5hIG1vZGVcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmRldGVjdFJldGluYSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBObyByZXRpbmEsIHJlbW92ZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICBwcm92aWRlci5vcHRpb25zLnJldGluYSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyByZXBsYWNlIGF0dHJpYnV0aW9uIHBsYWNlaG9sZGVycyB3aXRoIHRoZWlyIHZhbHVlcyBmcm9tIHRvcGxldmVsIHByb3ZpZGVyIGF0dHJpYnV0aW9uLFxyXG4gICAgICAgICAgICAvLyByZWN1cnNpdmVseVxyXG4gICAgICAgICAgICB2YXIgYXR0cmlidXRpb25SZXBsYWNlciA9IGZ1bmN0aW9uIChhdHRyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0ci5pbmRleE9mKCd7YXR0cmlidXRpb24uJykgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF0dHI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXR0ci5yZXBsYWNlKC9cXHthdHRyaWJ1dGlvbi4oXFx3KilcXH0vLFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChtYXRjaCwgYXR0cmlidXRpb25OYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGlvblJlcGxhY2VyKHByb3ZpZGVyc1thdHRyaWJ1dGlvbk5hbWVdLm9wdGlvbnMuYXR0cmlidXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHByb3ZpZGVyLm9wdGlvbnMuYXR0cmlidXRpb24gPSBhdHRyaWJ1dGlvblJlcGxhY2VyKHByb3ZpZGVyLm9wdGlvbnMuYXR0cmlidXRpb24pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29tcHV0ZSBmaW5hbCBvcHRpb25zIGNvbWJpbmluZyBwcm92aWRlciBvcHRpb25zIHdpdGggYW55IHVzZXIgb3ZlcnJpZGVzXHJcbiAgICAgICAgICAgIHZhciBsYXllck9wdHMgPSBMLlV0aWwuZXh0ZW5kKHt9LCBwcm92aWRlci5vcHRpb25zLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgTC5UaWxlTGF5ZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBwcm92aWRlci51cmwsIGxheWVyT3B0cyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbml0aW9uIG9mIHByb3ZpZGVycy5cclxuICAgICAqIHNlZSBodHRwOi8vbGVhZmxldGpzLmNvbS9yZWZlcmVuY2UuaHRtbCN0aWxlbGF5ZXIgZm9yIG9wdGlvbnMgaW4gdGhlIG9wdGlvbnMgbWFwLlxyXG4gICAgICovXHJcblxyXG4gICAgTC5UaWxlTGF5ZXIuUHJvdmlkZXIucHJvdmlkZXJzID0ge1xyXG4gICAgICAgIE9wZW5TdHJlZXRNYXA6IHtcclxuICAgICAgICAgICAgdXJsOiAnLy97c30udGlsZS5vcGVuc3RyZWV0bWFwLm9yZy97en0ve3h9L3t5fS5wbmcnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhab29tOiAxOSxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgICcmY29weTsgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvY29weXJpZ2h0XCI+T3BlblN0cmVldE1hcDwvYT4nXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhcmlhbnRzOiB7XHJcbiAgICAgICAgICAgICAgICBNYXBuaWs6IHt9LFxyXG4gICAgICAgICAgICAgICAgQmxhY2tBbmRXaGl0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybDogJ2h0dHA6Ly97c30udGlsZXMud21mbGFicy5vcmcvYnctbWFwbmlrL3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiAxOFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBERToge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybDogJ2h0dHA6Ly97c30udGlsZS5vcGVuc3RyZWV0bWFwLmRlL3RpbGVzL29zbWRlL3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiAxOFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBGcmFuY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvL3tzfS50aWxlLm9wZW5zdHJlZXRtYXAuZnIvb3NtZnIve3p9L3t4fS97eX0ucG5nJyxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDIwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjogJyZjb3B5OyBPcGVuc3RyZWV0bWFwIEZyYW5jZSB8IHthdHRyaWJ1dGlvbi5PcGVuU3RyZWV0TWFwfSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgSE9UOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnLy97c30udGlsZS5vcGVuc3RyZWV0bWFwLmZyL2hvdC97en0ve3h9L3t5fS5wbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICd7YXR0cmlidXRpb24uT3BlblN0cmVldE1hcH0sIFRpbGVzIGNvdXJ0ZXN5IG9mIDxhIGhyZWY9XCJodHRwOi8vaG90Lm9wZW5zdHJlZXRtYXAub3JnL1wiIHRhcmdldD1cIl9ibGFua1wiPkh1bWFuaXRhcmlhbiBPcGVuU3RyZWV0TWFwIFRlYW08L2E+J1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgT3BlblNlYU1hcDoge1xyXG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vdGlsZXMub3BlbnNlYW1hcC5vcmcvc2VhbWFyay97en0ve3h9L3t5fS5wbmcnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjogJ01hcCBkYXRhOiAmY29weTsgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnNlYW1hcC5vcmdcIj5PcGVuU2VhTWFwPC9hPiBjb250cmlidXRvcnMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIE9wZW5Ub3BvTWFwOiB7XHJcbiAgICAgICAgICAgIHVybDogJy8ve3N9LnRpbGUub3BlbnRvcG9tYXAub3JnL3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIG1heFpvb206IDE3LFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICdNYXAgZGF0YToge2F0dHJpYnV0aW9uLk9wZW5TdHJlZXRNYXB9LCA8YSBocmVmPVwiaHR0cDovL3ZpZXdmaW5kZXJwYW5vcmFtYXMub3JnXCI+U1JUTTwvYT4gfCBNYXAgc3R5bGU6ICZjb3B5OyA8YSBocmVmPVwiaHR0cHM6Ly9vcGVudG9wb21hcC5vcmdcIj5PcGVuVG9wb01hcDwvYT4gKDxhIGhyZWY9XCJodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL1wiPkNDLUJZLVNBPC9hPiknXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFRodW5kZXJmb3Jlc3Q6IHtcclxuICAgICAgICAgICAgdXJsOiAnLy97c30udGlsZS50aHVuZGVyZm9yZXN0LmNvbS97dmFyaWFudH0ve3p9L3t4fS97eX0ucG5nP2FwaWtleT17YXBpa2V5fScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgICcmY29weTsgPGEgaHJlZj1cImh0dHA6Ly93d3cudGh1bmRlcmZvcmVzdC5jb20vXCI+VGh1bmRlcmZvcmVzdDwvYT4sIHthdHRyaWJ1dGlvbi5PcGVuU3RyZWV0TWFwfScsXHJcbiAgICAgICAgICAgICAgICB2YXJpYW50OiAnY3ljbGUnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhcmlhbnRzOiB7XHJcbiAgICAgICAgICAgICAgICBPcGVuQ3ljbGVNYXA6ICdjeWNsZScsXHJcbiAgICAgICAgICAgICAgICBUcmFuc3BvcnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICd0cmFuc3BvcnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiAxOVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBUcmFuc3BvcnREYXJrOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAndHJhbnNwb3J0LWRhcmsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiAxOVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBTcGluYWxNYXA6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdzcGluYWwtbWFwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Wm9vbTogMTFcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgTGFuZHNjYXBlOiAnbGFuZHNjYXBlJyxcclxuICAgICAgICAgICAgICAgIE91dGRvb3JzOiAnb3V0ZG9vcnMnLFxyXG4gICAgICAgICAgICAgICAgUGlvbmVlcjogJ3Bpb25lZXInXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIE9wZW5NYXBTdXJmZXI6IHtcclxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL2tvcm9uYS5nZW9nLnVuaS1oZWlkZWxiZXJnLmRlL3RpbGVzL3t2YXJpYW50fS94PXt4fSZ5PXt5fSZ6PXt6fScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIG1heFpvb206IDIwLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDogJ3JvYWRzJyxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAnSW1hZ2VyeSBmcm9tIDxhIGhyZWY9XCJodHRwOi8vZ2lzY2llbmNlLnVuaS1oZC5kZS9cIj5HSVNjaWVuY2UgUmVzZWFyY2ggR3JvdXAgQCBVbml2ZXJzaXR5IG9mIEhlaWRlbGJlcmc8L2E+ICZtZGFzaDsgTWFwIGRhdGEge2F0dHJpYnV0aW9uLk9wZW5TdHJlZXRNYXB9J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB2YXJpYW50czoge1xyXG4gICAgICAgICAgICAgICAgUm9hZHM6ICdyb2FkcycsXHJcbiAgICAgICAgICAgICAgICBBZG1pbkJvdW5kczoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ2FkbWluYicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDE5XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIEdyYXlzY2FsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ3JvYWRzZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDE5XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBIeWRkYToge1xyXG4gICAgICAgICAgICB1cmw6ICcvL3tzfS50aWxlLm9wZW5zdHJlZXRtYXAuc2UvaHlkZGEve3ZhcmlhbnR9L3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdmdWxsJyxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVGlsZXMgY291cnRlc3kgb2YgPGEgaHJlZj1cImh0dHA6Ly9vcGVuc3RyZWV0bWFwLnNlL1wiIHRhcmdldD1cIl9ibGFua1wiPk9wZW5TdHJlZXRNYXAgU3dlZGVuPC9hPiAmbWRhc2g7IE1hcCBkYXRhIHthdHRyaWJ1dGlvbi5PcGVuU3RyZWV0TWFwfSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFyaWFudHM6IHtcclxuICAgICAgICAgICAgICAgIEZ1bGw6ICdmdWxsJyxcclxuICAgICAgICAgICAgICAgIEJhc2U6ICdiYXNlJyxcclxuICAgICAgICAgICAgICAgIFJvYWRzQW5kTGFiZWxzOiAncm9hZHNfYW5kX2xhYmVscydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgTWFwQm94OiB7XHJcbiAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vYXBpLm1hcGJveC5jb20vc3R5bGVzL3YxL21hcGJveC97aWR9L3RpbGVzLzI1Ni97en0ve3h9L3t5fT9hY2Nlc3NfdG9rZW49e2FjY2Vzc1Rva2VufScsXHJcbiAgICAgICAgICAgIC8vdXJsOiAnLy9hcGkudGlsZXMubWFwYm94LmNvbS92NC97aWR9L3t6fS97eH0ve3l9LnBuZz9hY2Nlc3NfdG9rZW49e2FjY2Vzc1Rva2VufScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOlxyXG4gICAgICAgICAgICAgICAgJ0ltYWdlcnkgZnJvbSA8YSBocmVmPVwiaHR0cDovL21hcGJveC5jb20vYWJvdXQvbWFwcy9cIj5NYXBCb3g8L2E+ICZtZGFzaDsgJyArXHJcbiAgICAgICAgICAgICAgICAnTWFwIGRhdGEge2F0dHJpYnV0aW9uLk9wZW5TdHJlZXRNYXB9JyxcclxuICAgICAgICAgICAgICAgIHN1YmRvbWFpbnM6ICdhYmNkJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTdGFtZW46IHtcclxuICAgICAgICAgICAgdXJsOiAnLy9zdGFtZW4tdGlsZXMte3N9LmEuc3NsLmZhc3RseS5uZXQve3ZhcmlhbnR9L3t6fS97eH0ve3l9LntleHR9JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246XHJcbiAgICAgICAgICAgICAgICAnTWFwIHRpbGVzIGJ5IDxhIGhyZWY9XCJodHRwOi8vc3RhbWVuLmNvbVwiPlN0YW1lbiBEZXNpZ248L2E+LCAnICtcclxuICAgICAgICAgICAgICAgICc8YSBocmVmPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnkvMy4wXCI+Q0MgQlkgMy4wPC9hPiAmbWRhc2g7ICcgK1xyXG4gICAgICAgICAgICAgICAgJ01hcCBkYXRhIHthdHRyaWJ1dGlvbi5PcGVuU3RyZWV0TWFwfScsXHJcbiAgICAgICAgICAgICAgICBzdWJkb21haW5zOiAnYWJjZCcsXHJcbiAgICAgICAgICAgICAgICBtaW5ab29tOiAwLFxyXG4gICAgICAgICAgICAgICAgbWF4Wm9vbTogMjAsXHJcbiAgICAgICAgICAgICAgICB2YXJpYW50OiAndG9uZXInLFxyXG4gICAgICAgICAgICAgICAgZXh0OiAncG5nJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB2YXJpYW50czoge1xyXG4gICAgICAgICAgICAgICAgVG9uZXI6ICd0b25lcicsXHJcbiAgICAgICAgICAgICAgICBUb25lckJhY2tncm91bmQ6ICd0b25lci1iYWNrZ3JvdW5kJyxcclxuICAgICAgICAgICAgICAgIFRvbmVySHlicmlkOiAndG9uZXItaHlicmlkJyxcclxuICAgICAgICAgICAgICAgIFRvbmVyTGluZXM6ICd0b25lci1saW5lcycsXHJcbiAgICAgICAgICAgICAgICBUb25lckxhYmVsczogJ3RvbmVyLWxhYmVscycsXHJcbiAgICAgICAgICAgICAgICBUb25lckxpdGU6ICd0b25lci1saXRlJyxcclxuICAgICAgICAgICAgICAgIFdhdGVyY29sb3I6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICd3YXRlcmNvbG9yJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Wm9vbTogMTZcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgVGVycmFpbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ3RlcnJhaW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5ab29tOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiAxOFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBUZXJyYWluQmFja2dyb3VuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ3RlcnJhaW4tYmFja2dyb3VuZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblpvb206IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDE4XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFRvcE9TTVJlbGllZjoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ3RvcG9zbS1jb2xvci1yZWxpZWYnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHQ6ICdqcGcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3VuZHM6IFtbMjIsIC0xMzJdLCBbNTEsIC01Nl1dXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFRvcE9TTUZlYXR1cmVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAndG9wb3NtLWZlYXR1cmVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzOiBbWzIyLCAtMTMyXSwgWzUxLCAtNTZdXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC45XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBFc3JpOiB7XHJcbiAgICAgICAgICAgIHVybDogJy8vc2VydmVyLmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMve3ZhcmlhbnR9L01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgdmFyaWFudDogJ1dvcmxkX1N0cmVldF9NYXAnLFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICdUaWxlcyAmY29weTsgRXNyaSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFyaWFudHM6IHtcclxuICAgICAgICAgICAgICAgIFdvcmxkU3RyZWV0TWFwOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3thdHRyaWJ1dGlvbi5Fc3JpfSAmbWRhc2g7ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnU291cmNlOiBFc3JpLCBEZUxvcm1lLCBOQVZURVEsIFVTR1MsIEludGVybWFwLCBpUEMsIE5SQ0FOLCBFc3JpIEphcGFuLCBNRVRJLCBFc3JpIENoaW5hIChIb25nIEtvbmcpLCBFc3JpIChUaGFpbGFuZCksIFRvbVRvbSwgMjAxMidcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgRGVMb3JtZToge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ1NwZWNpYWx0eS9EZUxvcm1lX1dvcmxkX0Jhc2VfTWFwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Wm9vbTogMTEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAne2F0dHJpYnV0aW9uLkVzcml9ICZtZGFzaDsgQ29weXJpZ2h0OiAmY29weTsyMDEyIERlTG9ybWUnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFdvcmxkVG9wb01hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ1dvcmxkX1RvcG9fTWFwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICd7YXR0cmlidXRpb24uRXNyaX0gJm1kYXNoOyAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0VzcmksIERlTG9ybWUsIE5BVlRFUSwgVG9tVG9tLCBJbnRlcm1hcCwgaVBDLCBVU0dTLCBGQU8sIE5QUywgTlJDQU4sIEdlb0Jhc2UsIEthZGFzdGVyIE5MLCBPcmRuYW5jZSBTdXJ2ZXksIEVzcmkgSmFwYW4sIE1FVEksIEVzcmkgQ2hpbmEgKEhvbmcgS29uZyksIGFuZCB0aGUgR0lTIFVzZXIgQ29tbXVuaXR5J1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBXb3JsZEltYWdlcnk6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdXb3JsZF9JbWFnZXJ5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICd7YXR0cmlidXRpb24uRXNyaX0gJm1kYXNoOyAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ1NvdXJjZTogRXNyaSwgaS1jdWJlZCwgVVNEQSwgVVNHUywgQUVYLCBHZW9FeWUsIEdldG1hcHBpbmcsIEFlcm9ncmlkLCBJR04sIElHUCwgVVBSLUVHUCwgYW5kIHRoZSBHSVMgVXNlciBDb21tdW5pdHknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFdvcmxkVGVycmFpbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ1dvcmxkX1RlcnJhaW5fQmFzZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDEzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3thdHRyaWJ1dGlvbi5Fc3JpfSAmbWRhc2g7ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnU291cmNlOiBVU0dTLCBFc3JpLCBUQU5BLCBEZUxvcm1lLCBhbmQgTlBTJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBXb3JsZFNoYWRlZFJlbGllZjoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ1dvcmxkX1NoYWRlZF9SZWxpZWYnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiAxMyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICd7YXR0cmlidXRpb24uRXNyaX0gJm1kYXNoOyBTb3VyY2U6IEVzcmknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFdvcmxkUGh5c2ljYWw6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdXb3JsZF9QaHlzaWNhbF9NYXAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiA4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjogJ3thdHRyaWJ1dGlvbi5Fc3JpfSAmbWRhc2g7IFNvdXJjZTogVVMgTmF0aW9uYWwgUGFyayBTZXJ2aWNlJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBPY2VhbkJhc2VtYXA6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdPY2Vhbl9CYXNlbWFwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Wm9vbTogMTMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAne2F0dHJpYnV0aW9uLkVzcml9ICZtZGFzaDsgU291cmNlczogR0VCQ08sIE5PQUEsIENIUywgT1NVLCBVTkgsIENTVU1CLCBOYXRpb25hbCBHZW9ncmFwaGljLCBEZUxvcm1lLCBOQVZURVEsIGFuZCBFc3JpJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBOYXRHZW9Xb3JsZE1hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ05hdEdlb19Xb3JsZF9NYXAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiAxNixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICd7YXR0cmlidXRpb24uRXNyaX0gJm1kYXNoOyBOYXRpb25hbCBHZW9ncmFwaGljLCBFc3JpLCBEZUxvcm1lLCBOQVZURVEsIFVORVAtV0NNQywgVVNHUywgTkFTQSwgRVNBLCBNRVRJLCBOUkNBTiwgR0VCQ08sIE5PQUEsIGlQQydcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgV29ybGRHcmF5Q2FudmFzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnQ2FudmFzL1dvcmxkX0xpZ2h0X0dyYXlfQmFzZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDE2LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjogJ3thdHRyaWJ1dGlvbi5Fc3JpfSAmbWRhc2g7IEVzcmksIERlTG9ybWUsIE5BVlRFUSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIE9wZW5XZWF0aGVyTWFwOiB7XHJcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly97c30udGlsZS5vcGVud2VhdGhlcm1hcC5vcmcvbWFwL3t2YXJpYW50fS97en0ve3h9L3t5fS5wbmcnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhab29tOiAxOSxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAnTWFwIGRhdGEgJmNvcHk7IDxhIGhyZWY9XCJodHRwOi8vb3BlbndlYXRoZXJtYXAub3JnXCI+T3BlbldlYXRoZXJNYXA8L2E+JyxcclxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuNVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB2YXJpYW50czoge1xyXG4gICAgICAgICAgICAgICAgQ2xvdWRzOiAnY2xvdWRzJyxcclxuICAgICAgICAgICAgICAgIENsb3Vkc0NsYXNzaWM6ICdjbG91ZHNfY2xzJyxcclxuICAgICAgICAgICAgICAgIFByZWNpcGl0YXRpb246ICdwcmVjaXBpdGF0aW9uJyxcclxuICAgICAgICAgICAgICAgIFByZWNpcGl0YXRpb25DbGFzc2ljOiAncHJlY2lwaXRhdGlvbl9jbHMnLFxyXG4gICAgICAgICAgICAgICAgUmFpbjogJ3JhaW4nLFxyXG4gICAgICAgICAgICAgICAgUmFpbkNsYXNzaWM6ICdyYWluX2NscycsXHJcbiAgICAgICAgICAgICAgICBQcmVzc3VyZTogJ3ByZXNzdXJlJyxcclxuICAgICAgICAgICAgICAgIFByZXNzdXJlQ29udG91cjogJ3ByZXNzdXJlX2NudHInLFxyXG4gICAgICAgICAgICAgICAgV2luZDogJ3dpbmQnLFxyXG4gICAgICAgICAgICAgICAgVGVtcGVyYXR1cmU6ICd0ZW1wJyxcclxuICAgICAgICAgICAgICAgIFNub3c6ICdzbm93J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBIRVJFOiB7XHJcbiAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAqIEhFUkUgbWFwcywgZm9ybWVybHkgTm9raWEgbWFwcy5cclxuICAgICAgICAgICAgICogVGhlc2UgYmFzZW1hcHMgYXJlIGZyZWUsIGJ1dCB5b3UgbmVlZCBhbiBBUEkga2V5LiBQbGVhc2Ugc2lnbiB1cCBhdFxyXG4gICAgICAgICAgICAgKiBodHRwOi8vZGV2ZWxvcGVyLmhlcmUuY29tL2dldHRpbmctc3RhcnRlZFxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBOb3RlIHRoYXQgdGhlIGJhc2UgdXJscyBjb250YWluICcuY2l0JyB3aGljaHMgaXMgSEVSRSdzXHJcbiAgICAgICAgICAgICAqICdDdXN0b21lciBJbnRlZ3JhdGlvbiBUZXN0aW5nJyBlbnZpcm9ubWVudC4gUGxlYXNlIHJlbW92ZSBmb3IgcHJvZHVjdGlvblxyXG4gICAgICAgICAgICAgKiBlbnZpcmlvbm1lbnRzLlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgdXJsOlxyXG4gICAgICAgICAgICAnLy97c30ue2Jhc2V9Lm1hcHMuY2l0LmFwaS5oZXJlLmNvbS9tYXB0aWxlLzIuMS8nICtcclxuICAgICAgICAgICAgJ3t0eXBlfS97bWFwSUR9L3t2YXJpYW50fS97en0ve3h9L3t5fS97c2l6ZX0ve2Zvcm1hdH0/JyArXHJcbiAgICAgICAgICAgICdhcHBfaWQ9e2FwcF9pZH0mYXBwX2NvZGU9e2FwcF9jb2RlfSZsZz17bGFuZ3VhZ2V9JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgJ01hcCAmY29weTsgMTk4Ny0yMDE0IDxhIGhyZWY9XCJodHRwOi8vZGV2ZWxvcGVyLmhlcmUuY29tXCI+SEVSRTwvYT4nLFxyXG4gICAgICAgICAgICAgICAgc3ViZG9tYWluczogJzEyMzQnLFxyXG4gICAgICAgICAgICAgICAgbWFwSUQ6ICduZXdlc3QnLFxyXG4gICAgICAgICAgICAgICAgJ2FwcF9pZCc6ICc8aW5zZXJ0IHlvdXIgYXBwX2lkIGhlcmU+JyxcclxuICAgICAgICAgICAgICAgICdhcHBfY29kZSc6ICc8aW5zZXJ0IHlvdXIgYXBwX2NvZGUgaGVyZT4nLFxyXG4gICAgICAgICAgICAgICAgYmFzZTogJ2Jhc2UnLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDogJ25vcm1hbC5kYXknLFxyXG4gICAgICAgICAgICAgICAgbWF4Wm9vbTogMjAsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWFwdGlsZScsXHJcbiAgICAgICAgICAgICAgICBsYW5ndWFnZTogJ2VuZycsXHJcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmc4JyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICcyNTYnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhcmlhbnRzOiB7XHJcbiAgICAgICAgICAgICAgICBub3JtYWxEYXk6ICdub3JtYWwuZGF5JyxcclxuICAgICAgICAgICAgICAgIG5vcm1hbERheUN1c3RvbTogJ25vcm1hbC5kYXkuY3VzdG9tJyxcclxuICAgICAgICAgICAgICAgIG5vcm1hbERheUdyZXk6ICdub3JtYWwuZGF5LmdyZXknLFxyXG4gICAgICAgICAgICAgICAgbm9ybWFsRGF5TW9iaWxlOiAnbm9ybWFsLmRheS5tb2JpbGUnLFxyXG4gICAgICAgICAgICAgICAgbm9ybWFsRGF5R3JleU1vYmlsZTogJ25vcm1hbC5kYXkuZ3JleS5tb2JpbGUnLFxyXG4gICAgICAgICAgICAgICAgbm9ybWFsRGF5VHJhbnNpdDogJ25vcm1hbC5kYXkudHJhbnNpdCcsXHJcbiAgICAgICAgICAgICAgICBub3JtYWxEYXlUcmFuc2l0TW9iaWxlOiAnbm9ybWFsLmRheS50cmFuc2l0Lm1vYmlsZScsXHJcbiAgICAgICAgICAgICAgICBub3JtYWxOaWdodDogJ25vcm1hbC5uaWdodCcsXHJcbiAgICAgICAgICAgICAgICBub3JtYWxOaWdodE1vYmlsZTogJ25vcm1hbC5uaWdodC5tb2JpbGUnLFxyXG4gICAgICAgICAgICAgICAgbm9ybWFsTmlnaHRHcmV5OiAnbm9ybWFsLm5pZ2h0LmdyZXknLFxyXG4gICAgICAgICAgICAgICAgbm9ybWFsTmlnaHRHcmV5TW9iaWxlOiAnbm9ybWFsLm5pZ2h0LmdyZXkubW9iaWxlJyxcclxuXHJcbiAgICAgICAgICAgICAgICBiYXNpY01hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jhc2V0aWxlJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBtYXBMYWJlbHM6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdsYWJlbHRpbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRyYWZmaWNGbG93OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlOiAndHJhZmZpYycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdmbG93dGlsZSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FybmF2RGF5R3JleTogJ2Nhcm5hdi5kYXkuZ3JleScsXHJcbiAgICAgICAgICAgICAgICBoeWJyaWREYXk6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhc2U6ICdhZXJpYWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnaHlicmlkLmRheSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaHlicmlkRGF5TW9iaWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlOiAnYWVyaWFsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ2h5YnJpZC5kYXkubW9iaWxlJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwZWRlc3RyaWFuRGF5OiAncGVkZXN0cmlhbi5kYXknLFxyXG4gICAgICAgICAgICAgICAgcGVkZXN0cmlhbk5pZ2h0OiAncGVkZXN0cmlhbi5uaWdodCcsXHJcbiAgICAgICAgICAgICAgICBzYXRlbGxpdGVEYXk6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhc2U6ICdhZXJpYWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnc2F0ZWxsaXRlLmRheSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgdGVycmFpbkRheToge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZTogJ2FlcmlhbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICd0ZXJyYWluLmRheSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgdGVycmFpbkRheU1vYmlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZTogJ2FlcmlhbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICd0ZXJyYWluLmRheS5tb2JpbGUnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBGcmVlTWFwU0s6IHtcclxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3R7c30uZnJlZW1hcC5zay9UL3t6fS97eH0ve3l9LmpwZWcnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBtaW5ab29tOiA4LFxyXG4gICAgICAgICAgICAgICAgbWF4Wm9vbTogMTYsXHJcbiAgICAgICAgICAgICAgICBzdWJkb21haW5zOiAnMTIzNCcsXHJcbiAgICAgICAgICAgICAgICBib3VuZHM6IFtbNDcuMjA0NjQyLCAxNS45OTYwOTNdLCBbNDkuODMwODk2LCAyMi41NzY5MDRdXSxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgICd7YXR0cmlidXRpb24uT3BlblN0cmVldE1hcH0sIHZpenVhbGl6YXRpb24gQ0MtQnktU0EgMi4wIDxhIGhyZWY9XCJodHRwOi8vZnJlZW1hcC5za1wiPkZyZWVtYXAuc2s8L2E+J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBNdGJNYXA6IHtcclxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3RpbGUubXRibWFwLmN6L210Ym1hcF90aWxlcy97en0ve3h9L3t5fS5wbmcnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjpcclxuICAgICAgICAgICAgICAgICAgICAne2F0dHJpYnV0aW9uLk9wZW5TdHJlZXRNYXB9ICZhbXA7IFVTR1MnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIENhcnRvREI6IHtcclxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3tzfS5iYXNlbWFwcy5jYXJ0b2Nkbi5jb20ve3ZhcmlhbnR9L3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAne2F0dHJpYnV0aW9uLk9wZW5TdHJlZXRNYXB9ICZjb3B5OyA8YSBocmVmPVwiaHR0cDovL2NhcnRvZGIuY29tL2F0dHJpYnV0aW9uc1wiPkNhcnRvREI8L2E+JyxcclxuICAgICAgICAgICAgICAgIHN1YmRvbWFpbnM6ICdhYmNkJyxcclxuICAgICAgICAgICAgICAgIG1heFpvb206IDE5LFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDogJ2xpZ2h0X2FsbCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFyaWFudHM6IHtcclxuICAgICAgICAgICAgICAgIFBvc2l0cm9uOiAnbGlnaHRfYWxsJyxcclxuICAgICAgICAgICAgICAgIFBvc2l0cm9uTm9MYWJlbHM6ICdsaWdodF9ub2xhYmVscycsXHJcbiAgICAgICAgICAgICAgICBQb3NpdHJvbk9ubHlMYWJlbHM6ICdsaWdodF9vbmx5X2xhYmVscycsXHJcbiAgICAgICAgICAgICAgICBEYXJrTWF0dGVyOiAnZGFya19hbGwnLFxyXG4gICAgICAgICAgICAgICAgRGFya01hdHRlck5vTGFiZWxzOiAnZGFya19ub2xhYmVscycsXHJcbiAgICAgICAgICAgICAgICBEYXJrTWF0dGVyT25seUxhYmVsczogJ2Rhcmtfb25seV9sYWJlbHMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIEhpa2VCaWtlOiB7XHJcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly97c30udGlsZXMud21mbGFicy5vcmcve3ZhcmlhbnR9L3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIG1heFpvb206IDE5LFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICd7YXR0cmlidXRpb24uT3BlblN0cmVldE1hcH0nLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDogJ2hpa2ViaWtlJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB2YXJpYW50czoge1xyXG4gICAgICAgICAgICAgICAgSGlrZUJpa2U6IHt9LFxyXG4gICAgICAgICAgICAgICAgSGlsbFNoYWRpbmc6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDE1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnaGlsbHNoYWRpbmcnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBCYXNlbWFwQVQ6IHtcclxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9tYXBze3N9LndpZW4uZ3YuYXQvYmFzZW1hcC97dmFyaWFudH0vbm9ybWFsL2dvb2dsZTM4NTcve3p9L3t5fS97eH0ue2Zvcm1hdH0nLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhab29tOiAxOSxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAnRGF0ZW5xdWVsbGU6IDxhIGhyZWY9XCJ3d3cuYmFzZW1hcC5hdFwiPmJhc2VtYXAuYXQ8L2E+JyxcclxuICAgICAgICAgICAgICAgIHN1YmRvbWFpbnM6IFsnJywgJzEnLCAnMicsICczJywgJzQnXSxcclxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXHJcbiAgICAgICAgICAgICAgICBib3VuZHM6IFtbNDYuMzU4NzcwLCA4Ljc4MjM3OV0sIFs0OS4wMzc4NzIsIDE3LjE4OTUzMl1dLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDogJ2dlb2xhbmRiYXNlbWFwJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB2YXJpYW50czoge1xyXG4gICAgICAgICAgICAgICAgYmFzZW1hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Wm9vbTogMjAsIC8vIGN1cnJlbnRseSBvbmx5IGluIFZpZW5uYVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnZ2VvbGFuZGJhc2VtYXAnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGdyYXU6ICdibWFwZ3JhdScsXHJcbiAgICAgICAgICAgICAgICBvdmVybGF5OiAnYm1hcG92ZXJsYXknLFxyXG4gICAgICAgICAgICAgICAgaGlnaGRwaToge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudDogJ2JtYXBoaWRwaScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogJ2pwZWcnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9ydGhvZm90bzoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Wm9vbTogMjAsIC8vIGN1cnJlbnRseSBvbmx5IGluIFZpZW5uYVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnYm1hcG9ydGhvZm90bzMwY20nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6ICdqcGVnJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgTkFTQUdJQlM6IHtcclxuICAgICAgICAgICAgdXJsOiAnLy9tYXAxLnZpcy5lYXJ0aGRhdGEubmFzYS5nb3Yvd210cy13ZWJtZXJjL3t2YXJpYW50fS9kZWZhdWx0L3t0aW1lfS97dGlsZW1hdHJpeHNldH17bWF4Wm9vbX0ve3p9L3t5fS97eH0ue2Zvcm1hdH0nLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbjpcclxuICAgICAgICAgICAgICAgICdJbWFnZXJ5IHByb3ZpZGVkIGJ5IHNlcnZpY2VzIGZyb20gdGhlIEdsb2JhbCBJbWFnZXJ5IEJyb3dzZSBTZXJ2aWNlcyAoR0lCUyksIG9wZXJhdGVkIGJ5IHRoZSBOQVNBL0dTRkMvRWFydGggU2NpZW5jZSBEYXRhIGFuZCBJbmZvcm1hdGlvbiBTeXN0ZW0gJyArXHJcbiAgICAgICAgICAgICAgICAnKDxhIGhyZWY9XCJodHRwczovL2VhcnRoZGF0YS5uYXNhLmdvdlwiPkVTRElTPC9hPikgd2l0aCBmdW5kaW5nIHByb3ZpZGVkIGJ5IE5BU0EvSFEuJyxcclxuICAgICAgICAgICAgICAgIGJvdW5kczogW1stODUuMDUxMTI4Nzc3NiwgLTE3OS45OTk5OTk5NzVdLCBbODUuMDUxMTI4Nzc3NiwgMTc5Ljk5OTk5OTk3NV1dLFxyXG4gICAgICAgICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgICAgICAgIG1heFpvb206IDksXHJcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdqcGcnLFxyXG4gICAgICAgICAgICAgICAgdGltZTogJycsXHJcbiAgICAgICAgICAgICAgICB0aWxlbWF0cml4c2V0OiAnR29vZ2xlTWFwc0NvbXBhdGlibGVfTGV2ZWwnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhcmlhbnRzOiB7XHJcbiAgICAgICAgICAgICAgICBNb2Rpc1RlcnJhVHJ1ZUNvbG9yQ1I6ICdNT0RJU19UZXJyYV9Db3JyZWN0ZWRSZWZsZWN0YW5jZV9UcnVlQ29sb3InLFxyXG4gICAgICAgICAgICAgICAgTW9kaXNUZXJyYUJhbmRzMzY3Q1I6ICdNT0RJU19UZXJyYV9Db3JyZWN0ZWRSZWZsZWN0YW5jZV9CYW5kczM2NycsXHJcbiAgICAgICAgICAgICAgICBWaWlyc0VhcnRoQXROaWdodDIwMTI6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdWSUlSU19DaXR5TGlnaHRzXzIwMTInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiA4XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIE1vZGlzVGVycmFMU1REYXk6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdNT0RJU19UZXJyYV9MYW5kX1N1cmZhY2VfVGVtcF9EYXknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhab29tOiA3LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjc1XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIE1vZGlzVGVycmFTbm93Q292ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6ICdNT0RJU19UZXJyYV9Tbm93X0NvdmVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiAncG5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Wm9vbTogOCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMC43NVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBNb2Rpc1RlcnJhQU9EOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnTU9ESVNfVGVycmFfQWVyb3NvbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuNzVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgTW9kaXNUZXJyYUNobG9yb3BoeWxsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50OiAnTU9ESVNfVGVycmFfQ2hsb3JvcGh5bGxfQScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFpvb206IDcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAuNzVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIE5MUzoge1xyXG4gICAgICAgICAgICAvLyBOTFMgbWFwcyBhcmUgY29weXJpZ2h0IE5hdGlvbmFsIGxpYnJhcnkgb2YgU2NvdGxhbmQuXHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9tYXBzLm5scy51ay9wcm9qZWN0cy9hcGkvaW5kZXguaHRtbFxyXG4gICAgICAgICAgICAvLyBQbGVhc2UgY29udGFjdCBOTFMgZm9yIGFueXRoaW5nIG90aGVyIHRoYW4gbm9uLWNvbW1lcmNpYWwgbG93IHZvbHVtZSB1c2FnZVxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBNYXAgc291cmNlczogT3JkbmFuY2UgU3VydmV5IDE6MW0gdG8gMTo2M0ssIDE5MjBzLTE5NDBzXHJcbiAgICAgICAgICAgIC8vICAgejAtOSAgLSAxOjFtXHJcbiAgICAgICAgICAgIC8vICB6MTAtMTEgLSBxdWFydGVyIGluY2ggKDE6MjUzNDQwKVxyXG4gICAgICAgICAgICAvLyAgejEyLTE4IC0gb25lIGluY2ggKDE6NjMzNjApXHJcbiAgICAgICAgICAgIHVybDogJy8vbmxzLXtzfS50aWxlc2VydmVyLmNvbS9ubHMve3p9L3t4fS97eX0uanBnJyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICc8YSBocmVmPVwiaHR0cDovL2dlby5ubHMudWsvbWFwcy9cIj5OYXRpb25hbCBMaWJyYXJ5IG9mIFNjb3RsYW5kIEhpc3RvcmljIE1hcHM8L2E+JyxcclxuICAgICAgICAgICAgICAgIGJvdW5kczogW1s0OS42LCAtMTJdLCBbNjEuNywgM11dLFxyXG4gICAgICAgICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgICAgICAgIG1heFpvb206IDE4LFxyXG4gICAgICAgICAgICAgICAgc3ViZG9tYWluczogJzAxMjMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIEp1c3RpY2VNYXA6IHtcclxuICAgICAgICAgICAgLy8gSnVzdGljZSBNYXAgKGh0dHA6Ly93d3cuanVzdGljZW1hcC5vcmcvKVxyXG4gICAgICAgICAgICAvLyBWaXN1YWxpemUgcmFjZSBhbmQgaW5jb21lIGRhdGEgZm9yIHlvdXIgY29tbXVuaXR5LCBjb3VudHkgYW5kIGNvdW50cnkuXHJcbiAgICAgICAgICAgIC8vIEluY2x1ZGVzIHRvb2xzIGZvciBkYXRhIGpvdXJuYWxpc3RzLCBibG9nZ2VycyBhbmQgY29tbXVuaXR5IGFjdGl2aXN0cy5cclxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3d3dy5qdXN0aWNlbWFwLm9yZy90aWxlL3tzaXplfS97dmFyaWFudH0ve3p9L3t4fS97eX0ucG5nJyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICc8YSBocmVmPVwiaHR0cDovL3d3dy5qdXN0aWNlbWFwLm9yZy90ZXJtcy5waHBcIj5KdXN0aWNlIE1hcDwvYT4nLFxyXG4gICAgICAgICAgICAgICAgLy8gb25lIG9mICdjb3VudHknLCAndHJhY3QnLCAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnY291bnR5JyxcclxuICAgICAgICAgICAgICAgIC8vIEJvdW5kcyBmb3IgVVNBLCBpbmNsdWRpbmcgQWxhc2thIGFuZCBIYXdhaWlcclxuICAgICAgICAgICAgICAgIGJvdW5kczogW1sxNCwgLTE4MF0sIFs3MiwgLTU2XV1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFyaWFudHM6IHtcclxuICAgICAgICAgICAgICAgIGluY29tZTogJ2luY29tZScsXHJcbiAgICAgICAgICAgICAgICBhbWVyaWNhbkluZGlhbjogJ2luZGlhbicsXHJcbiAgICAgICAgICAgICAgICBhc2lhbjogJ2FzaWFuJyxcclxuICAgICAgICAgICAgICAgIGJsYWNrOiAnYmxhY2snLFxyXG4gICAgICAgICAgICAgICAgaGlzcGFuaWM6ICdoaXNwYW5pYycsXHJcbiAgICAgICAgICAgICAgICBtdWx0aTogJ211bHRpJyxcclxuICAgICAgICAgICAgICAgIG5vbldoaXRlOiAnbm9ud2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgd2hpdGU6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICBwbHVyYWxpdHk6ICdwbHVyYWwnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBHYW9EZToge1xyXG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vd2VicmQwe3N9LmlzLmF1dG9uYXZpLmNvbS9hcHBtYXB0aWxlP2xhbmc9e2xhbmd1YWdlfSZzaXplPTEmc2NhbGU9MSZzdHlsZT04Jng9e3h9Jnk9e3l9Jno9e3p9JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICcnLFxyXG4gICAgICAgICAgICAgICAgc3ViZG9tYWluczogJzEyMzQnLFxyXG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2U6ICd6aF9jbidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFyaWFudHM6IHtcclxuICAgICAgICAgICAgICAgIE5vcm1hbDoge30sXHJcbiAgICAgICAgICAgICAgICBTYXRlbGxpdGU6IHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vd2Vic3Qwe3N9LmlzLmF1dG9uYXZpLmNvbS9hcHBtYXB0aWxlP3N0eWxlPTYmeD17eH0meT17eX0mej17en0nXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgU2F0ZWxsaXRlQW5ub3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vd2Vic3Qwe3N9LmlzLmF1dG9uYXZpLmNvbS9hcHBtYXB0aWxlP3N0eWxlPTgmeD17eH0meT17eX0mej17en0nXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBHb29nbGU6IHtcclxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3d3dy5nb29nbGUuY24vbWFwcy92dD9seXJzPXtseXJzfSZobD17bGFuZ3VhZ2V9Jng9e3h9Jnk9e3l9Jno9e3p9JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb246ICcnLFxyXG4gICAgICAgICAgICAgICAgbHlyczogJ20nLFxyXG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2U6ICd6aCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFyaWFudHM6IHtcclxuICAgICAgICAgICAgICAgIE5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbHlyczogJ3AsbSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgU2F0ZWxsaXRlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBseXJzOiAncyxtJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFBpbm5ldE1hcDoge1xyXG4gICAgICAgICAgICAvL3VybDogJ2h0dHA6Ly93d3cucGlubmV0LmNvbS9nZXRNYXBEYXRhP2x5cnM9e2x5cnN9JmhsPXtsYW5ndWFnZX0meD17eH0meT17eX0mej17en0nLFxyXG4gICAgICAgICAgICB1cmw6ICcuL2ltYWdlcy90aWxlcy97bGFuZ3VhZ2V9L3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAnPGEgaHJlZj1cImh0dHA6Ly93d3cucGlubmV0LmNvbS9nZXRNYXBEYXRhXCI+UGlubmV056a757q/5Zyw5Zu+PC9hPicsXHJcbiAgICAgICAgICAgICAgICBsYW5ndWFnZTogJ3poJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgTC50aWxlTGF5ZXIucHJvdmlkZXIgPSBmdW5jdGlvbiAocHJvdmlkZXIsIG9wdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEwuVGlsZUxheWVyLlByb3ZpZGVyKHByb3ZpZGVyLCBvcHRpb25zKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEw7XHJcbn0pKTsiXSwiZmlsZSI6InBsdWdpbnMvTGVhZmxldC9sZWFmbGV0LnByb3ZpZGVycy5qcyJ9
