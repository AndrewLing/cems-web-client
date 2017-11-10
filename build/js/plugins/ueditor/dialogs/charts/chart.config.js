/*
 * 图表配置文件
 * */


//不同类型的配置
var typeConfig = [
    {
        chart: {
            type: 'line'
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: false
                },
                enableMouseTracking: true
            }
        }
    }, {
        chart: {
            type: 'line'
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true
                },
                enableMouseTracking: false
            }
        }
    }, {
        chart: {
            type: 'area'
        }
    }, {
        chart: {
            type: 'bar'
        }
    }, {
        chart: {
            type: 'column'
        }
    }, {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: '#000000',
                    connectorColor: '#000000',
                    formatter: function() {
                        return '<b>'+ this.point.name +'</b>: '+ ( Math.round( this.point.percentage*100 ) / 100 ) +' %';
                    }
                }
            }
        }
    }
];

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9jaGFydHMvY2hhcnQuY29uZmlnLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiDlm77ooajphY3nva7mlofku7ZcbiAqICovXG5cblxuLy/kuI3lkIznsbvlnovnmoTphY3nva5cbnZhciB0eXBlQ29uZmlnID0gW1xuICAgIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdsaW5lJ1xuICAgICAgICB9LFxuICAgICAgICBwbG90T3B0aW9uczoge1xuICAgICAgICAgICAgbGluZToge1xuICAgICAgICAgICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVuYWJsZU1vdXNlVHJhY2tpbmc6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdsaW5lJ1xuICAgICAgICB9LFxuICAgICAgICBwbG90T3B0aW9uczoge1xuICAgICAgICAgICAgbGluZToge1xuICAgICAgICAgICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW5hYmxlTW91c2VUcmFja2luZzogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcmVhJ1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgdHlwZTogJ2JhcidcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdjb2x1bW4nXG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICBwbG90QmFja2dyb3VuZENvbG9yOiBudWxsLFxuICAgICAgICAgICAgcGxvdEJvcmRlcldpZHRoOiBudWxsLFxuICAgICAgICAgICAgcGxvdFNoYWRvdzogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgcGxvdE9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBpZToge1xuICAgICAgICAgICAgICAgIGFsbG93UG9pbnRTZWxlY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgZGF0YUxhYmVsczoge1xuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyMwMDAwMDAnLFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0b3JDb2xvcjogJyMwMDAwMDAnLFxuICAgICAgICAgICAgICAgICAgICBmb3JtYXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8Yj4nKyB0aGlzLnBvaW50Lm5hbWUgKyc8L2I+OiAnKyAoIE1hdGgucm91bmQoIHRoaXMucG9pbnQucGVyY2VudGFnZSoxMDAgKSAvIDEwMCApICsnICUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL2RpYWxvZ3MvY2hhcnRzL2NoYXJ0LmNvbmZpZy5qcyJ9
