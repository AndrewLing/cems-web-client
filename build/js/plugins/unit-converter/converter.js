var measures = {
    // 功率
    power: {
        zh_CN:{
            'KW': {
                name: 'kW',
                to_anchor: 1
            },
            'MW': {
                name: 'MW',
                to_anchor: 1000
            },
            'GW': {
                name: 'GW',
                to_anchor: 1000 * 1000
            }
        },
        en_US:{
            'KW': {
                name: 'kW',
                to_anchor: 1
            },
            'MW': {
                name: 'MW',
                to_anchor: 1000
            },
            'GW': {
                name: 'GW',
                to_anchor: 1000 * 1000
            }
        },
        en_UK:{
            'KW': {
                name: 'kW',
                to_anchor: 1
            },
            'MW': {
                name: 'MW',
                to_anchor: 1000
            },
            'GW': {
                name: 'GW',
                to_anchor: 1000 * 1000
            }
        },
        ja_JP:{
            'KW': {
                name: 'kW',
                to_anchor: 1
            },
            'MW': {
                name: 'MW',
                to_anchor: 1000
            },
            'GW': {
                name: 'GW',
                to_anchor: 1000 * 1000
            }
        },
        _anchors: {
            zh_CN: {
                unit: 'KW',
                ratio: 1
            },
            en_US: {
                unit: 'KW',
                ratio: 1
            },
            en_UK: {
                unit: 'KW',
                ratio: 1
            },
            ja_JP: {
                unit: 'KW',
                ratio: 1
            }
        }
    },
    // 电量
    energy: {
        zh_CN: {
            'KWh': {
                name: 'kWh',
                to_anchor: 1
            },
            'WKWh': {
                name: '万kWh',
                to_anchor: 10 * 1000
            },
            'GWh': {
                name: 'GWh',
                to_anchor: 1000 * 1000
            }
        },
        en_US: {
            'KWh': {
                name: 'kWh',
                to_anchor: 1
            },
            'MWh': {
                name: 'MWh',
                to_anchor: 1000
            },
            'GWh': {
                name: 'GWh',
                to_anchor: 1000 * 1000
            }
        },
        en_UK: {
            'KWh': {
                name: 'kWh',
                to_anchor: 1
            },
            'MWh': {
                name: 'MWh',
                to_anchor: 1000
            },
            'GWh': {
                name: 'GWh',
                to_anchor: 1000 * 1000
            }
        },
        ja_JP: {
            'KWh': {
                name: 'kWh',
                to_anchor: 1
            },
            'MWh': {
                name: 'MWh',
                to_anchor: 1000
            },
            'GWh': {
                name: 'GWh',
                to_anchor: 1000 * 1000
            }
        },
        _anchors: {
            zh_CN: {
                unit: 'KWh',
                ratio: 1
            },
            en_US: {
                unit: 'KWh',
                ratio: 1
            },
            en_UK: {
                unit: 'KWh',
                ratio: 1
            },
            ja_JP: {
                unit: 'KWh',
                ratio: 1
            }
        }
    },
    currency: {//货币按类型区分,不做语言区分
        CNY: {
            'CNY': {
                name: '¥',
                to_anchor: 1
            },
            'KCNY': {
                name: 'k ¥',
                to_anchor: 1000
            },
            'MCNY': {
                name: 'M ¥',
                to_anchor: 1000 * 1000
            },
            'GCNY': {
                name: 'G ¥',
                to_anchor: 1000 * 1000 * 1000
            }
        },
        USD: {
            'USD': {
                name: '$',
                to_anchor: 1
            },
            'KUSD': {
                name: 'k $',
                to_anchor: 1000
            },
            'MUSD': {
                name: 'M $',
                to_anchor: 1000 * 1000
            },
            'GUSD': {
                name: 'G $',
                to_anchor: 1000 * 1000 * 1000
            }
        },
        JPY: {
            'JPY': {
                name: '¥',
                to_anchor: 1
            },
            'KJPY': {
                name: 'k ¥',
                to_anchor: 1000
            },
            'MJPY': {
                name: 'M ¥',
                to_anchor: 1000 * 1000
            },
            'GJPY': {
                name: 'G ¥',
                to_anchor: 1000 * 1000 * 1000
            }
        },
        EUR: {
            'EUR': {
                name: '€',
                to_anchor: 1
            },
            'KEUR': {
                name: 'k €',
                to_anchor: 1000
            },
            'MEUR': {
                name: 'M €',
                to_anchor: 1000 * 1000
            },
            'GEUR': {
                name: 'G €',
                to_anchor: 1000 * 1000 * 1000
            }
        },
        GBP: {
            'GBP': {
                name: '£',
                to_anchor: 1
            },
            'KGBP': {
                name: 'k £',
                to_anchor: 1000
            },
            'MGBP': {
                name: 'M £',
                to_anchor: 1000 * 1000
            },
            'GGBP': {
                name: 'G £',
                to_anchor: 1000 * 1000 * 1000
            }
        },
        _anchors: {
            CNY: {
                unit: '¥',
                ratio: 1
            },
            USD: {
                unit: '$',
                ratio: 1
            },
            JPY: {
                unit: '¥',
                ratio: 1
            },
            EUR: {
                unit: '€',
                ratio: 1
            },
            GBP: {
                unit: '£',
                ratio: 1
            }
        }
    }
};



var Converter = function(numerator, region) {
    this.val = numerator || 0.0;
    this.region = region;
};

/**
 * Lets the converter know the source unit abbreviation
 */
Converter.prototype.from = function(from) {
    if (this.destination) throw new Error('.from must be called before .to');

    this.origin = this.getUnit(from);

    if (!this.origin) {
        this.throwUnsupportedUnitError(from);
    }

    return this;
};

/**
 * Converts the unit and returns the value
 */
Converter.prototype.to = function(to) {
    if (!this.origin) throw new Error('.to must be called after .from');

    this.destination = this.getUnit(to);

    var result, transform;

    if (!this.destination) {
        this.throwUnsupportedUnitError(to);
    }

    // Don't change the value if origin and destination are the same
    if (this.origin.abbr === this.destination.abbr) {
        return this.val;
    }

    // You can't go from liquid to mass, for example
    if (this.destination.measure != this.origin.measure) {
        throw new Error('Cannot convert incompatible measures of ' + this.destination.measure + ' and ' + this.origin.measure);
    }

    /**
     * Convert from the source value to its anchor inside the system
     */
    result = this.val * this.origin.unit.to_anchor;

    /**
     * For some changes it's a simple shift (C to K)
     * So we'll add it when convering into the unit
     * and substract it when converting from the unit
     */
    if (this.destination.unit.anchor_shift) {
        result += this.destination.unit.anchor_shift;
    }

    if (this.origin.unit.anchor_shift) {
        result -= this.origin.unit.anchor_shift
    }

    /**
     * Convert from one system to another through the anchor ratio. Some conversions
     * aren't ratio based or require more than a simple shift. We can provide a custom
     * transform here to provide the direct result
     */
    if (this.origin.system != this.destination.system) {
        transform = measures[this.origin.measure]._anchors[this.origin.system].transform;
        if (typeof transform === 'function') {
            return result = transform(result)
        }
        result *= measures[this.origin.measure]._anchors[this.origin.system].ratio;
    }

    /**
     * Convert to another unit inside the destination system
     */
    return result / this.destination.unit.to_anchor;
};

/**
 * Converts the unit to the best available unit.
 */
Converter.prototype.toBest = function(options) {
    if (!this.origin) throw new Error('.toBest must be called after .from');

    if (options == null) {
        options = {
            exclude: []
        };
    }

    var best;
    var defaultLoading = Cookies.get("defaultLoading");
    if ($.trim(defaultLoading) == "iCleanScreen") { //大屏不做数据单位转换和进制转换
        var measure = this.origin.measure;
        var unit = $.trim(this.origin.abbr).replace("K", "k");
        if (measure == "currency") {//货币转换特殊处理
            unit = this.origin.unit.name;
        }
        best = {
            val: this.val,
            unit: unit
        }
        return best;
    }

    /**
     Looks through every possibility for the 'best' available unit.
     i.e. Where the value has the fewest numbers before the decimal point,
     but is still higher than 1.
     */
    _.each(this.possibilities(),
        function(possibility) {
            var unit = this.describe(possibility);
            var isIncluded = options.exclude.indexOf(possibility) === -1;

            if (isIncluded && unit.system === this.origin.system) {
                var result = this.to(possibility);
                if (!best || (result >= 1 && result < best.val)) {
                    best = {
                        val: result,
                        unit: unit.name
                    };
                }
            }
        }.bind(this));

    return best;
}

/**
 * Finds the unit
 */
Converter.prototype.getUnit = function(abbr) {
    var found;
    var _region = this.region;
    _.each(measures, function(systems, measure) {
        _.each(systems, function(units, system) {
            if (system != _region || "_anchors" == system) return true;
            _.each(units, function(unit, testAbbr) {
                if (testAbbr == abbr) {
                    found = {
                        abbr: abbr,
                        measure: measure,
                        system: system,
                        unit: unit
                    };
                    return false;
                }
            });
            if (found) return false;
        });
        if (found) return false;
    });

    return found;
};

var describe = function(resp) {
    return {
        abbr: resp.abbr,
        measure: resp.measure,
        system: resp.system,
        name: resp.unit.name
    };
}

/**
 * An alias for getUnit
 */
Converter.prototype.describe = function(abbr) {
    var resp = this.getUnit(abbr);

    return describe(resp);
};

/**
 * Detailed list of all supported units
 */
Converter.prototype.list = function(measure) {
    var list = [];
    var _region = this.region;
    _.each(measures, function(systems, testMeasure) {
        if (measure && measure !== testMeasure) return;
        _.each(systems, function(units, system) {
            if (system != _region || "_anchors" == system) return true;
            _.each(units, function(unit, abbr) {
                list = list.concat(describe({
                    abbr: abbr,
                    measure: testMeasure,
                    system: system,
                    unit: unit
                }));
            });
        });
    });

    return list;
};

Converter.prototype.throwUnsupportedUnitError = function(what) {
    var validUnits = [];
    var _region = this.region;
    _.each(measures, function(systems, measure) {
        _.each(systems, function(units, system) {
            if (system != _region || "_anchors" == system) return true;

            validUnits = validUnits.concat(_.keys(units));
        });
    });
    throw new Error('Unsupported unit ' + what + ', use one of: ' + validUnits.join(', '));
}

/**
 * Returns the abbreviated measures that the value can be
 * converted to.
 */
Converter.prototype.possibilities = function(measure) {
    var possibilities = [];
    var _region = this.region;
    if (!this.origin && !measure) {
        _.each(_.keys(measures), function(measure) {
            _.each(measures[measure], function(units, system) {
                if (system != _region || "_anchors" == system) return true;
                possibilities = possibilities.concat(_.keys(units));
            });
        });
    } else {
        measure = measure || this.origin.measure;
        _.each(measures[measure], function(units, system) {
            if (system != _region || "_anchors" == system) return true;
            possibilities = possibilities.concat(_.keys(units));
        });
    }

    return possibilities;
};

/**
 * Returns the abbreviated measures that the value can be
 * converted to.
 */
Converter.prototype.measures = function() {
    return _.keys(measures);
};

var convert = function(value, region) {
    return new Converter(value, region);
};

var convertArray = function (array, region, from) {
    if (!$.isArray(array))
        return {
            data: array,
            unit: from
        };
    var _max = Number.NEGATIVE_INFINITY;
    $.each(array, function(i, v) {
        if ($.isNumeric(v) && parseFloat(v) > _max) {
            _max = parseFloat(v);
        }
    });
    if (_max == Number.NEGATIVE_INFINITY)
        return {
            data: array,
            unit: from.replace("K", "k")
        };
    var _convert = new Converter(_max, region);
    var obj = _convert.from(from).toBest();
    var to_anchor = _max == 0 ? 1: obj.val / _max;

    var dataArray = [];
    $.each(array, function(i, v){
        if ($.isNumeric(v)) {
            dataArray.push(v * to_anchor);
        } else {
            dataArray.push(v);
        }
    });
    return {
        data: dataArray,
        unit: obj.unit
    };
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VuaXQtY29udmVydGVyL2NvbnZlcnRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbWVhc3VyZXMgPSB7XG4gICAgLy8g5Yqf546HXG4gICAgcG93ZXI6IHtcbiAgICAgICAgemhfQ046e1xuICAgICAgICAgICAgJ0tXJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdrVycsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ01XJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNVycsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0dXJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdHVycsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbl9VUzp7XG4gICAgICAgICAgICAnS1cnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2tXJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnTVcnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ01XJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDEwMDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnR1cnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0dXJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDEwMDAgKiAxMDAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVuX1VLOntcbiAgICAgICAgICAgICdLVyc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAna1cnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdNVyc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnTVcnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdHVyc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnR1cnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMCAqIDEwMDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgamFfSlA6e1xuICAgICAgICAgICAgJ0tXJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdrVycsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ01XJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNVycsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0dXJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdHVycsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfYW5jaG9yczoge1xuICAgICAgICAgICAgemhfQ046IHtcbiAgICAgICAgICAgICAgICB1bml0OiAnS1cnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5fVVM6IHtcbiAgICAgICAgICAgICAgICB1bml0OiAnS1cnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5fVUs6IHtcbiAgICAgICAgICAgICAgICB1bml0OiAnS1cnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgamFfSlA6IHtcbiAgICAgICAgICAgICAgICB1bml0OiAnS1cnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIOeUtemHj1xuICAgIGVuZXJneToge1xuICAgICAgICB6aF9DTjoge1xuICAgICAgICAgICAgJ0tXaCc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAna1doJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnV0tXaCc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAn5LiHa1doJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDEwICogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdHV2gnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0dXaCcsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbl9VUzoge1xuICAgICAgICAgICAgJ0tXaCc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAna1doJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnTVdoJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNV2gnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdHV2gnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0dXaCcsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbl9VSzoge1xuICAgICAgICAgICAgJ0tXaCc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAna1doJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnTVdoJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNV2gnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdHV2gnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0dXaCcsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBqYV9KUDoge1xuICAgICAgICAgICAgJ0tXaCc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAna1doJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnTVdoJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNV2gnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdHV2gnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0dXaCcsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfYW5jaG9yczoge1xuICAgICAgICAgICAgemhfQ046IHtcbiAgICAgICAgICAgICAgICB1bml0OiAnS1doJyxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuX1VTOiB7XG4gICAgICAgICAgICAgICAgdW5pdDogJ0tXaCcsXG4gICAgICAgICAgICAgICAgcmF0aW86IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbl9VSzoge1xuICAgICAgICAgICAgICAgIHVuaXQ6ICdLV2gnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgamFfSlA6IHtcbiAgICAgICAgICAgICAgICB1bml0OiAnS1doJyxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBjdXJyZW5jeTogey8v6LSn5biB5oyJ57G75Z6L5Yy65YiGLOS4jeWBmuivreiogOWMuuWIhlxuICAgICAgICBDTlk6IHtcbiAgICAgICAgICAgICdDTlknOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ8KlJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnS0NOWSc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnayDCpScsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ01DTlknOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ00gwqUnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMCAqIDEwMDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnR0NOWSc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnRyDCpScsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMCAqIDEwMDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgVVNEOiB7XG4gICAgICAgICAgICAnVVNEJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICckJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnS1VTRCc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnayAkJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDEwMDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnTVVTRCc6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnTSAkJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDEwMDAgKiAxMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0dVU0QnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0cgJCcsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMCAqIDEwMDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgSlBZOiB7XG4gICAgICAgICAgICAnSlBZJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICfCpScsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0tKUFknOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2sgwqUnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdNSlBZJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNIMKlJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDEwMDAgKiAxMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0dKUFknOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0cgwqUnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMCAqIDEwMDAgKiAxMDAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIEVVUjoge1xuICAgICAgICAgICAgJ0VVUic6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAn4oKsJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnS0VVUic6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnayDigqwnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdNRVVSJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNIOKCrCcsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdHRVVSJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdHIOKCrCcsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxMDAwICogMTAwMCAqIDEwMDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgR0JQOiB7XG4gICAgICAgICAgICAnR0JQJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICfCoycsXG4gICAgICAgICAgICAgICAgdG9fYW5jaG9yOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0tHQlAnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2sgwqMnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdNR0JQJzoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdNIMKjJyxcbiAgICAgICAgICAgICAgICB0b19hbmNob3I6IDEwMDAgKiAxMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0dHQlAnOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0cgwqMnLFxuICAgICAgICAgICAgICAgIHRvX2FuY2hvcjogMTAwMCAqIDEwMDAgKiAxMDAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIF9hbmNob3JzOiB7XG4gICAgICAgICAgICBDTlk6IHtcbiAgICAgICAgICAgICAgICB1bml0OiAnwqUnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgVVNEOiB7XG4gICAgICAgICAgICAgICAgdW5pdDogJyQnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgSlBZOiB7XG4gICAgICAgICAgICAgICAgdW5pdDogJ8KlJyxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEVVUjoge1xuICAgICAgICAgICAgICAgIHVuaXQ6ICfigqwnLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR0JQOiB7XG4gICAgICAgICAgICAgICAgdW5pdDogJ8KjJyxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuXG5cbnZhciBDb252ZXJ0ZXIgPSBmdW5jdGlvbihudW1lcmF0b3IsIHJlZ2lvbikge1xuICAgIHRoaXMudmFsID0gbnVtZXJhdG9yIHx8IDAuMDtcbiAgICB0aGlzLnJlZ2lvbiA9IHJlZ2lvbjtcbn07XG5cbi8qKlxuICogTGV0cyB0aGUgY29udmVydGVyIGtub3cgdGhlIHNvdXJjZSB1bml0IGFiYnJldmlhdGlvblxuICovXG5Db252ZXJ0ZXIucHJvdG90eXBlLmZyb20gPSBmdW5jdGlvbihmcm9tKSB7XG4gICAgaWYgKHRoaXMuZGVzdGluYXRpb24pIHRocm93IG5ldyBFcnJvcignLmZyb20gbXVzdCBiZSBjYWxsZWQgYmVmb3JlIC50bycpO1xuXG4gICAgdGhpcy5vcmlnaW4gPSB0aGlzLmdldFVuaXQoZnJvbSk7XG5cbiAgICBpZiAoIXRoaXMub3JpZ2luKSB7XG4gICAgICAgIHRoaXMudGhyb3dVbnN1cHBvcnRlZFVuaXRFcnJvcihmcm9tKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ29udmVydHMgdGhlIHVuaXQgYW5kIHJldHVybnMgdGhlIHZhbHVlXG4gKi9cbkNvbnZlcnRlci5wcm90b3R5cGUudG8gPSBmdW5jdGlvbih0bykge1xuICAgIGlmICghdGhpcy5vcmlnaW4pIHRocm93IG5ldyBFcnJvcignLnRvIG11c3QgYmUgY2FsbGVkIGFmdGVyIC5mcm9tJyk7XG5cbiAgICB0aGlzLmRlc3RpbmF0aW9uID0gdGhpcy5nZXRVbml0KHRvKTtcblxuICAgIHZhciByZXN1bHQsIHRyYW5zZm9ybTtcblxuICAgIGlmICghdGhpcy5kZXN0aW5hdGlvbikge1xuICAgICAgICB0aGlzLnRocm93VW5zdXBwb3J0ZWRVbml0RXJyb3IodG8pO1xuICAgIH1cblxuICAgIC8vIERvbid0IGNoYW5nZSB0aGUgdmFsdWUgaWYgb3JpZ2luIGFuZCBkZXN0aW5hdGlvbiBhcmUgdGhlIHNhbWVcbiAgICBpZiAodGhpcy5vcmlnaW4uYWJiciA9PT0gdGhpcy5kZXN0aW5hdGlvbi5hYmJyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbDtcbiAgICB9XG5cbiAgICAvLyBZb3UgY2FuJ3QgZ28gZnJvbSBsaXF1aWQgdG8gbWFzcywgZm9yIGV4YW1wbGVcbiAgICBpZiAodGhpcy5kZXN0aW5hdGlvbi5tZWFzdXJlICE9IHRoaXMub3JpZ2luLm1lYXN1cmUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY29udmVydCBpbmNvbXBhdGlibGUgbWVhc3VyZXMgb2YgJyArIHRoaXMuZGVzdGluYXRpb24ubWVhc3VyZSArICcgYW5kICcgKyB0aGlzLm9yaWdpbi5tZWFzdXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGZyb20gdGhlIHNvdXJjZSB2YWx1ZSB0byBpdHMgYW5jaG9yIGluc2lkZSB0aGUgc3lzdGVtXG4gICAgICovXG4gICAgcmVzdWx0ID0gdGhpcy52YWwgKiB0aGlzLm9yaWdpbi51bml0LnRvX2FuY2hvcjtcblxuICAgIC8qKlxuICAgICAqIEZvciBzb21lIGNoYW5nZXMgaXQncyBhIHNpbXBsZSBzaGlmdCAoQyB0byBLKVxuICAgICAqIFNvIHdlJ2xsIGFkZCBpdCB3aGVuIGNvbnZlcmluZyBpbnRvIHRoZSB1bml0XG4gICAgICogYW5kIHN1YnN0cmFjdCBpdCB3aGVuIGNvbnZlcnRpbmcgZnJvbSB0aGUgdW5pdFxuICAgICAqL1xuICAgIGlmICh0aGlzLmRlc3RpbmF0aW9uLnVuaXQuYW5jaG9yX3NoaWZ0KSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLmRlc3RpbmF0aW9uLnVuaXQuYW5jaG9yX3NoaWZ0O1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9yaWdpbi51bml0LmFuY2hvcl9zaGlmdCkge1xuICAgICAgICByZXN1bHQgLT0gdGhpcy5vcmlnaW4udW5pdC5hbmNob3Jfc2hpZnRcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGZyb20gb25lIHN5c3RlbSB0byBhbm90aGVyIHRocm91Z2ggdGhlIGFuY2hvciByYXRpby4gU29tZSBjb252ZXJzaW9uc1xuICAgICAqIGFyZW4ndCByYXRpbyBiYXNlZCBvciByZXF1aXJlIG1vcmUgdGhhbiBhIHNpbXBsZSBzaGlmdC4gV2UgY2FuIHByb3ZpZGUgYSBjdXN0b21cbiAgICAgKiB0cmFuc2Zvcm0gaGVyZSB0byBwcm92aWRlIHRoZSBkaXJlY3QgcmVzdWx0XG4gICAgICovXG4gICAgaWYgKHRoaXMub3JpZ2luLnN5c3RlbSAhPSB0aGlzLmRlc3RpbmF0aW9uLnN5c3RlbSkge1xuICAgICAgICB0cmFuc2Zvcm0gPSBtZWFzdXJlc1t0aGlzLm9yaWdpbi5tZWFzdXJlXS5fYW5jaG9yc1t0aGlzLm9yaWdpbi5zeXN0ZW1dLnRyYW5zZm9ybTtcbiAgICAgICAgaWYgKHR5cGVvZiB0cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQgPSB0cmFuc2Zvcm0ocmVzdWx0KVxuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCAqPSBtZWFzdXJlc1t0aGlzLm9yaWdpbi5tZWFzdXJlXS5fYW5jaG9yc1t0aGlzLm9yaWdpbi5zeXN0ZW1dLnJhdGlvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdG8gYW5vdGhlciB1bml0IGluc2lkZSB0aGUgZGVzdGluYXRpb24gc3lzdGVtXG4gICAgICovXG4gICAgcmV0dXJuIHJlc3VsdCAvIHRoaXMuZGVzdGluYXRpb24udW5pdC50b19hbmNob3I7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSB1bml0IHRvIHRoZSBiZXN0IGF2YWlsYWJsZSB1bml0LlxuICovXG5Db252ZXJ0ZXIucHJvdG90eXBlLnRvQmVzdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAoIXRoaXMub3JpZ2luKSB0aHJvdyBuZXcgRXJyb3IoJy50b0Jlc3QgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgLmZyb20nKTtcblxuICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGV4Y2x1ZGU6IFtdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGJlc3Q7XG4gICAgdmFyIGRlZmF1bHRMb2FkaW5nID0gQ29va2llcy5nZXQoXCJkZWZhdWx0TG9hZGluZ1wiKTtcbiAgICBpZiAoJC50cmltKGRlZmF1bHRMb2FkaW5nKSA9PSBcImlDbGVhblNjcmVlblwiKSB7IC8v5aSn5bGP5LiN5YGa5pWw5o2u5Y2V5L2N6L2s5o2i5ZKM6L+b5Yi26L2s5o2iXG4gICAgICAgIHZhciBtZWFzdXJlID0gdGhpcy5vcmlnaW4ubWVhc3VyZTtcbiAgICAgICAgdmFyIHVuaXQgPSAkLnRyaW0odGhpcy5vcmlnaW4uYWJicikucmVwbGFjZShcIktcIiwgXCJrXCIpO1xuICAgICAgICBpZiAobWVhc3VyZSA9PSBcImN1cnJlbmN5XCIpIHsvL+i0p+W4gei9rOaNoueJueauiuWkhOeQhlxuICAgICAgICAgICAgdW5pdCA9IHRoaXMub3JpZ2luLnVuaXQubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgICAgdmFsOiB0aGlzLnZhbCxcbiAgICAgICAgICAgIHVuaXQ6IHVuaXRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmVzdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgTG9va3MgdGhyb3VnaCBldmVyeSBwb3NzaWJpbGl0eSBmb3IgdGhlICdiZXN0JyBhdmFpbGFibGUgdW5pdC5cbiAgICAgaS5lLiBXaGVyZSB0aGUgdmFsdWUgaGFzIHRoZSBmZXdlc3QgbnVtYmVycyBiZWZvcmUgdGhlIGRlY2ltYWwgcG9pbnQsXG4gICAgIGJ1dCBpcyBzdGlsbCBoaWdoZXIgdGhhbiAxLlxuICAgICAqL1xuICAgIF8uZWFjaCh0aGlzLnBvc3NpYmlsaXRpZXMoKSxcbiAgICAgICAgZnVuY3Rpb24ocG9zc2liaWxpdHkpIHtcbiAgICAgICAgICAgIHZhciB1bml0ID0gdGhpcy5kZXNjcmliZShwb3NzaWJpbGl0eSk7XG4gICAgICAgICAgICB2YXIgaXNJbmNsdWRlZCA9IG9wdGlvbnMuZXhjbHVkZS5pbmRleE9mKHBvc3NpYmlsaXR5KSA9PT0gLTE7XG5cbiAgICAgICAgICAgIGlmIChpc0luY2x1ZGVkICYmIHVuaXQuc3lzdGVtID09PSB0aGlzLm9yaWdpbi5zeXN0ZW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy50byhwb3NzaWJpbGl0eSk7XG4gICAgICAgICAgICAgICAgaWYgKCFiZXN0IHx8IChyZXN1bHQgPj0gMSAmJiByZXN1bHQgPCBiZXN0LnZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbDogcmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdDogdW5pdC5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgcmV0dXJuIGJlc3Q7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIHVuaXRcbiAqL1xuQ29udmVydGVyLnByb3RvdHlwZS5nZXRVbml0ID0gZnVuY3Rpb24oYWJicikge1xuICAgIHZhciBmb3VuZDtcbiAgICB2YXIgX3JlZ2lvbiA9IHRoaXMucmVnaW9uO1xuICAgIF8uZWFjaChtZWFzdXJlcywgZnVuY3Rpb24oc3lzdGVtcywgbWVhc3VyZSkge1xuICAgICAgICBfLmVhY2goc3lzdGVtcywgZnVuY3Rpb24odW5pdHMsIHN5c3RlbSkge1xuICAgICAgICAgICAgaWYgKHN5c3RlbSAhPSBfcmVnaW9uIHx8IFwiX2FuY2hvcnNcIiA9PSBzeXN0ZW0pIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgXy5lYWNoKHVuaXRzLCBmdW5jdGlvbih1bml0LCB0ZXN0QWJicikge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0QWJiciA9PSBhYmJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJicjogYWJicixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lYXN1cmU6IG1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzeXN0ZW06IHN5c3RlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQ6IHVuaXRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmb3VuZDtcbn07XG5cbnZhciBkZXNjcmliZSA9IGZ1bmN0aW9uKHJlc3ApIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBhYmJyOiByZXNwLmFiYnIsXG4gICAgICAgIG1lYXN1cmU6IHJlc3AubWVhc3VyZSxcbiAgICAgICAgc3lzdGVtOiByZXNwLnN5c3RlbSxcbiAgICAgICAgbmFtZTogcmVzcC51bml0Lm5hbWVcbiAgICB9O1xufVxuXG4vKipcbiAqIEFuIGFsaWFzIGZvciBnZXRVbml0XG4gKi9cbkNvbnZlcnRlci5wcm90b3R5cGUuZGVzY3JpYmUgPSBmdW5jdGlvbihhYmJyKSB7XG4gICAgdmFyIHJlc3AgPSB0aGlzLmdldFVuaXQoYWJicik7XG5cbiAgICByZXR1cm4gZGVzY3JpYmUocmVzcCk7XG59O1xuXG4vKipcbiAqIERldGFpbGVkIGxpc3Qgb2YgYWxsIHN1cHBvcnRlZCB1bml0c1xuICovXG5Db252ZXJ0ZXIucHJvdG90eXBlLmxpc3QgPSBmdW5jdGlvbihtZWFzdXJlKSB7XG4gICAgdmFyIGxpc3QgPSBbXTtcbiAgICB2YXIgX3JlZ2lvbiA9IHRoaXMucmVnaW9uO1xuICAgIF8uZWFjaChtZWFzdXJlcywgZnVuY3Rpb24oc3lzdGVtcywgdGVzdE1lYXN1cmUpIHtcbiAgICAgICAgaWYgKG1lYXN1cmUgJiYgbWVhc3VyZSAhPT0gdGVzdE1lYXN1cmUpIHJldHVybjtcbiAgICAgICAgXy5lYWNoKHN5c3RlbXMsIGZ1bmN0aW9uKHVuaXRzLCBzeXN0ZW0pIHtcbiAgICAgICAgICAgIGlmIChzeXN0ZW0gIT0gX3JlZ2lvbiB8fCBcIl9hbmNob3JzXCIgPT0gc3lzdGVtKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIF8uZWFjaCh1bml0cywgZnVuY3Rpb24odW5pdCwgYWJicikge1xuICAgICAgICAgICAgICAgIGxpc3QgPSBsaXN0LmNvbmNhdChkZXNjcmliZSh7XG4gICAgICAgICAgICAgICAgICAgIGFiYnI6IGFiYnIsXG4gICAgICAgICAgICAgICAgICAgIG1lYXN1cmU6IHRlc3RNZWFzdXJlLFxuICAgICAgICAgICAgICAgICAgICBzeXN0ZW06IHN5c3RlbSxcbiAgICAgICAgICAgICAgICAgICAgdW5pdDogdW5pdFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsaXN0O1xufTtcblxuQ29udmVydGVyLnByb3RvdHlwZS50aHJvd1Vuc3VwcG9ydGVkVW5pdEVycm9yID0gZnVuY3Rpb24od2hhdCkge1xuICAgIHZhciB2YWxpZFVuaXRzID0gW107XG4gICAgdmFyIF9yZWdpb24gPSB0aGlzLnJlZ2lvbjtcbiAgICBfLmVhY2gobWVhc3VyZXMsIGZ1bmN0aW9uKHN5c3RlbXMsIG1lYXN1cmUpIHtcbiAgICAgICAgXy5lYWNoKHN5c3RlbXMsIGZ1bmN0aW9uKHVuaXRzLCBzeXN0ZW0pIHtcbiAgICAgICAgICAgIGlmIChzeXN0ZW0gIT0gX3JlZ2lvbiB8fCBcIl9hbmNob3JzXCIgPT0gc3lzdGVtKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgdmFsaWRVbml0cyA9IHZhbGlkVW5pdHMuY29uY2F0KF8ua2V5cyh1bml0cykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIHVuaXQgJyArIHdoYXQgKyAnLCB1c2Ugb25lIG9mOiAnICsgdmFsaWRVbml0cy5qb2luKCcsICcpKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhYmJyZXZpYXRlZCBtZWFzdXJlcyB0aGF0IHRoZSB2YWx1ZSBjYW4gYmVcbiAqIGNvbnZlcnRlZCB0by5cbiAqL1xuQ29udmVydGVyLnByb3RvdHlwZS5wb3NzaWJpbGl0aWVzID0gZnVuY3Rpb24obWVhc3VyZSkge1xuICAgIHZhciBwb3NzaWJpbGl0aWVzID0gW107XG4gICAgdmFyIF9yZWdpb24gPSB0aGlzLnJlZ2lvbjtcbiAgICBpZiAoIXRoaXMub3JpZ2luICYmICFtZWFzdXJlKSB7XG4gICAgICAgIF8uZWFjaChfLmtleXMobWVhc3VyZXMpLCBmdW5jdGlvbihtZWFzdXJlKSB7XG4gICAgICAgICAgICBfLmVhY2gobWVhc3VyZXNbbWVhc3VyZV0sIGZ1bmN0aW9uKHVuaXRzLCBzeXN0ZW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc3lzdGVtICE9IF9yZWdpb24gfHwgXCJfYW5jaG9yc1wiID09IHN5c3RlbSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgcG9zc2liaWxpdGllcyA9IHBvc3NpYmlsaXRpZXMuY29uY2F0KF8ua2V5cyh1bml0cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1lYXN1cmUgPSBtZWFzdXJlIHx8IHRoaXMub3JpZ2luLm1lYXN1cmU7XG4gICAgICAgIF8uZWFjaChtZWFzdXJlc1ttZWFzdXJlXSwgZnVuY3Rpb24odW5pdHMsIHN5c3RlbSkge1xuICAgICAgICAgICAgaWYgKHN5c3RlbSAhPSBfcmVnaW9uIHx8IFwiX2FuY2hvcnNcIiA9PSBzeXN0ZW0pIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgcG9zc2liaWxpdGllcyA9IHBvc3NpYmlsaXRpZXMuY29uY2F0KF8ua2V5cyh1bml0cykpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcG9zc2liaWxpdGllcztcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYWJicmV2aWF0ZWQgbWVhc3VyZXMgdGhhdCB0aGUgdmFsdWUgY2FuIGJlXG4gKiBjb252ZXJ0ZWQgdG8uXG4gKi9cbkNvbnZlcnRlci5wcm90b3R5cGUubWVhc3VyZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy5rZXlzKG1lYXN1cmVzKTtcbn07XG5cbnZhciBjb252ZXJ0ID0gZnVuY3Rpb24odmFsdWUsIHJlZ2lvbikge1xuICAgIHJldHVybiBuZXcgQ29udmVydGVyKHZhbHVlLCByZWdpb24pO1xufTtcblxudmFyIGNvbnZlcnRBcnJheSA9IGZ1bmN0aW9uIChhcnJheSwgcmVnaW9uLCBmcm9tKSB7XG4gICAgaWYgKCEkLmlzQXJyYXkoYXJyYXkpKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGF0YTogYXJyYXksXG4gICAgICAgICAgICB1bml0OiBmcm9tXG4gICAgICAgIH07XG4gICAgdmFyIF9tYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgJC5lYWNoKGFycmF5LCBmdW5jdGlvbihpLCB2KSB7XG4gICAgICAgIGlmICgkLmlzTnVtZXJpYyh2KSAmJiBwYXJzZUZsb2F0KHYpID4gX21heCkge1xuICAgICAgICAgICAgX21heCA9IHBhcnNlRmxvYXQodik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoX21heCA9PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRhOiBhcnJheSxcbiAgICAgICAgICAgIHVuaXQ6IGZyb20ucmVwbGFjZShcIktcIiwgXCJrXCIpXG4gICAgICAgIH07XG4gICAgdmFyIF9jb252ZXJ0ID0gbmV3IENvbnZlcnRlcihfbWF4LCByZWdpb24pO1xuICAgIHZhciBvYmogPSBfY29udmVydC5mcm9tKGZyb20pLnRvQmVzdCgpO1xuICAgIHZhciB0b19hbmNob3IgPSBfbWF4ID09IDAgPyAxOiBvYmoudmFsIC8gX21heDtcblxuICAgIHZhciBkYXRhQXJyYXkgPSBbXTtcbiAgICAkLmVhY2goYXJyYXksIGZ1bmN0aW9uKGksIHYpe1xuICAgICAgICBpZiAoJC5pc051bWVyaWModikpIHtcbiAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKHYgKiB0b19hbmNob3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YUFycmF5LnB1c2godik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBkYXRhOiBkYXRhQXJyYXksXG4gICAgICAgIHVuaXQ6IG9iai51bml0XG4gICAgfTtcbn0iXSwiZmlsZSI6InBsdWdpbnMvdW5pdC1jb252ZXJ0ZXIvY29udmVydGVyLmpzIn0=
