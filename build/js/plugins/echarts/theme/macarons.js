define(function() {

var theme = {
    // 默认色板
    color: [
        '#2ec7c9','#b6a2de','#5ab1ef','#ffb980','#d87a80',
        '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
        '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
        '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089'
    ],

    // 图表标题
    title: {
        itemGap: 8,
        textStyle: {
            fontWeight: 'normal',
            color: '#008acd'          // 主标题文字颜色
        }
    },
    
    // 图例
    legend: {
        itemGap: 8
    },
    
    // 值域
    dataRange: {
        itemWidth: 15,
        //color:['#1e90ff','#afeeee']
        color: ['#2ec7c9','#b6a2de']
    },

    toolbox: {
        color : ['#1e90ff', '#1e90ff', '#1e90ff', '#1e90ff'],
        effectiveColor : '#ff4500',
        itemGap: 8
    },

    // 提示框
    tooltip: {
        backgroundColor: 'rgba(50,50,50,0.5)',     // 提示背景颜色，默认为透明度为0.7的黑色
        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'line',         // 默认为直线，可选为：'line' | 'shadow'
            lineStyle : {          // 直线指示器样式设置
                color: '#008acd'
            },
            crossStyle: {
                color: '#008acd'
            },
            shadowStyle : {                     // 阴影指示器样式设置
                color: 'rgba(200,200,200,0.2)'
            }
        }
    },

    // 区域缩放控制器
    dataZoom: {
        dataBackgroundColor: '#efefff',            // 数据背景颜色
        fillerColor: 'rgba(182,162,222,0.2)',   // 填充颜色
        handleColor: '#008acd'    // 手柄颜色
    },

    // 网格
    grid: {
        borderColor: '#eee'
    },

    // 类目轴
    categoryAxis: {
        axisLine: {            // 坐标轴线
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#008acd'
            }
        },
        splitLine: {           // 分隔线
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: ['#eee']
            }
        }
    },

    // 数值型坐标轴默认参数
    valueAxis: {
        axisLine: {            // 坐标轴线
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#008acd'
            }
        },
        splitArea : {
            show : true,
            areaStyle : {
                color: ['rgba(250,250,250,0.1)','rgba(200,200,200,0.1)']
            }
        },
        splitLine: {           // 分隔线
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: ['#eee']
            }
        }
    },

    polar : {
        axisLine: {            // 坐标轴线
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#ddd'
            }
        },
        splitArea : {
            show : true,
            areaStyle : {
                color: ['rgba(250,250,250,0.2)','rgba(200,200,200,0.2)']
            }
        },
        splitLine : {
            lineStyle : {
                color : '#ddd'
            }
        }
    },

    timeline : {
        lineStyle : {
            color : '#008acd'
        },
        controlStyle : {
            normal : { color : '#008acd'},
            emphasis : { color : '#008acd'}
        },
        symbol : 'emptyCircle',
        symbolSize : 3
    },

    // 柱形图默认参数
    bar: {
        itemStyle: {
            normal: {
                borderRadius: 5
            },
            emphasis: {
                borderRadius: 5
            }
        }
    },

    // 折线图默认参数
    line: {
        smooth : true,
        symbol: 'emptyCircle',  // 拐点图形类型
        symbolSize: 3           // 拐点图形大小
    },
    
    // K线图默认参数
    k: {
        itemStyle: {
            normal: {
                color: '#d87a80',       // 阳线填充颜色
                color0: '#2ec7c9',      // 阴线填充颜色
                lineStyle: {
                    width: 1,
                    color: '#d87a80',   // 阳线边框颜色
                    color0: '#2ec7c9'   // 阴线边框颜色
                }
            }
        }
    },
    
    // 散点图默认参数
    scatter: {
        symbol: 'circle',    // 图形类型
        symbolSize: 4        // 图形大小，半宽（半径）参数，当图形为方向或菱形则总宽度为symbolSize * 2
    },

    // 雷达图默认参数
    radar : {
        symbol: 'emptyCircle',    // 图形类型
        symbolSize:3
        //symbol: null,         // 拐点图形类型
        //symbolRotate : null,  // 图形旋转控制
    },

    map: {
        itemStyle: {
            normal: {
                areaStyle: {
                    color: '#ddd'
                },
                label: {
                    textStyle: {
                        color: '#d87a80'
                    }
                }
            },
            emphasis: {                 // 也是选中样式
                areaStyle: {
                    color: '#fe994e'
                },
                label: {
                    textStyle: {
                        color: 'rgb(100,0,0)'
                    }
                }
            }
        }
    },
    
    force : {
        itemStyle: {
            normal: {
                linkStyle : {
                    strokeColor : '#1e90ff'
                }
            }
        }
    },

    chord : {
        padding : 4,
        itemStyle : {
            normal : {
                lineStyle : {
                    width : 1,
                    color : 'rgba(128, 128, 128, 0.5)'
                },
                chordStyle : {
                    lineStyle : {
                        width : 1,
                        color : 'rgba(128, 128, 128, 0.5)'
                    }
                }
            },
            emphasis : {
                lineStyle : {
                    width : 1,
                    color : 'rgba(128, 128, 128, 0.5)'
                },
                chordStyle : {
                    lineStyle : {
                        width : 1,
                        color : 'rgba(128, 128, 128, 0.5)'
                    }
                }
            }
        }
    },

    gauge : {
        startAngle: 225,
        endAngle : -45,
        axisLine: {            // 坐标轴线
            show: true,        // 默认显示，属性show控制显示与否
            lineStyle: {       // 属性lineStyle控制线条样式
                color: [[0.2, '#2ec7c9'],[0.8, '#5ab1ef'],[1, '#d87a80']], 
                width: 10
            }
        },
        axisTick: {            // 坐标轴小标记
            splitNumber: 10,   // 每份split细分多少段
            length :15,        // 属性length控制线长
            lineStyle: {       // 属性lineStyle控制线条样式
                color: 'auto'
            }
        },
        axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: 'auto'
            }
        },
        splitLine: {           // 分隔线
            length :22,         // 属性length控制线长
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: 'auto'
            }
        },
        pointer : {
            width : 5,
            color : 'auto'
        },
        title : {
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: '#333'
            }
        },
        detail : {
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: 'auto'
            }
        }
    },
    
    textStyle: {
        fontFamily: '微软雅黑, Arial, Verdana, sans-serif'
    }
}

    return theme;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvdGhlbWUvbWFjYXJvbnMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKGZ1bmN0aW9uKCkge1xyXG5cclxudmFyIHRoZW1lID0ge1xyXG4gICAgLy8g6buY6K6k6Imy5p2/XHJcbiAgICBjb2xvcjogW1xyXG4gICAgICAgICcjMmVjN2M5JywnI2I2YTJkZScsJyM1YWIxZWYnLCcjZmZiOTgwJywnI2Q4N2E4MCcsXHJcbiAgICAgICAgJyM4ZDk4YjMnLCcjZTVjZjBkJywnIzk3YjU1MicsJyM5NTcwNmQnLCcjZGM2OWFhJyxcclxuICAgICAgICAnIzA3YTJhNCcsJyM5YTdmZDEnLCcjNTg4ZGQ1JywnI2Y1OTk0ZScsJyNjMDUwNTAnLFxyXG4gICAgICAgICcjNTk2NzhjJywnI2M5YWIwMCcsJyM3ZWIwMGEnLCcjNmY1NTUzJywnI2MxNDA4OSdcclxuICAgIF0sXHJcblxyXG4gICAgLy8g5Zu+6KGo5qCH6aKYXHJcbiAgICB0aXRsZToge1xyXG4gICAgICAgIGl0ZW1HYXA6IDgsXHJcbiAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgICAgICAgICBjb2xvcjogJyMwMDhhY2QnICAgICAgICAgIC8vIOS4u+agh+mimOaWh+Wtl+minOiJslxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIOWbvuS+i1xyXG4gICAgbGVnZW5kOiB7XHJcbiAgICAgICAgaXRlbUdhcDogOFxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8g5YC85Z+fXHJcbiAgICBkYXRhUmFuZ2U6IHtcclxuICAgICAgICBpdGVtV2lkdGg6IDE1LFxyXG4gICAgICAgIC8vY29sb3I6WycjMWU5MGZmJywnI2FmZWVlZSddXHJcbiAgICAgICAgY29sb3I6IFsnIzJlYzdjOScsJyNiNmEyZGUnXVxyXG4gICAgfSxcclxuXHJcbiAgICB0b29sYm94OiB7XHJcbiAgICAgICAgY29sb3IgOiBbJyMxZTkwZmYnLCAnIzFlOTBmZicsICcjMWU5MGZmJywgJyMxZTkwZmYnXSxcclxuICAgICAgICBlZmZlY3RpdmVDb2xvciA6ICcjZmY0NTAwJyxcclxuICAgICAgICBpdGVtR2FwOiA4XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOaPkOekuuahhlxyXG4gICAgdG9vbHRpcDoge1xyXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoNTAsNTAsNTAsMC41KScsICAgICAvLyDmj5DnpLrog4zmma/popzoibLvvIzpu5jorqTkuLrpgI/mmI7luqbkuLowLjfnmoTpu5HoibJcclxuICAgICAgICBheGlzUG9pbnRlciA6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTmjIfnpLrlmajvvIzlnZDmoIfovbTop6blj5HmnInmlYhcclxuICAgICAgICAgICAgdHlwZSA6ICdsaW5lJywgICAgICAgICAvLyDpu5jorqTkuLrnm7Tnur/vvIzlj6/pgInkuLrvvJonbGluZScgfCAnc2hhZG93J1xyXG4gICAgICAgICAgICBsaW5lU3R5bGUgOiB7ICAgICAgICAgIC8vIOebtOe6v+aMh+ekuuWZqOagt+W8j+iuvue9rlxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjMDA4YWNkJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjcm9zc1N0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyMwMDhhY2QnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNoYWRvd1N0eWxlIDogeyAgICAgICAgICAgICAgICAgICAgIC8vIOmYtOW9seaMh+ekuuWZqOagt+W8j+iuvue9rlxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICdyZ2JhKDIwMCwyMDAsMjAwLDAuMiknXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOWMuuWfn+e8qeaUvuaOp+WItuWZqFxyXG4gICAgZGF0YVpvb206IHtcclxuICAgICAgICBkYXRhQmFja2dyb3VuZENvbG9yOiAnI2VmZWZmZicsICAgICAgICAgICAgLy8g5pWw5o2u6IOM5pmv6aKc6ImyXHJcbiAgICAgICAgZmlsbGVyQ29sb3I6ICdyZ2JhKDE4MiwxNjIsMjIyLDAuMiknLCAgIC8vIOWhq+WFheminOiJslxyXG4gICAgICAgIGhhbmRsZUNvbG9yOiAnIzAwOGFjZCcgICAgLy8g5omL5p+E6aKc6ImyXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOe9keagvFxyXG4gICAgZ3JpZDoge1xyXG4gICAgICAgIGJvcmRlckNvbG9yOiAnI2VlZSdcclxuICAgIH0sXHJcblxyXG4gICAgLy8g57G755uu6L20XHJcbiAgICBjYXRlZ29yeUF4aXM6IHtcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyMwMDhhY2QnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXvvIjor6bop4FsaW5lU3R5bGXvvInmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJyNlZWUnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmlbDlgLzlnovlnZDmoIfovbTpu5jorqTlj4LmlbBcclxuICAgIHZhbHVlQXhpczoge1xyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzAwOGFjZCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRBcmVhIDoge1xyXG4gICAgICAgICAgICBzaG93IDogdHJ1ZSxcclxuICAgICAgICAgICAgYXJlYVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsncmdiYSgyNTAsMjUwLDI1MCwwLjEpJywncmdiYSgyMDAsMjAwLDIwMCwwLjEpJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZe+8iOivpuingWxpbmVTdHlsZe+8ieaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsnI2VlZSddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHBvbGFyIDoge1xyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2RkZCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRBcmVhIDoge1xyXG4gICAgICAgICAgICBzaG93IDogdHJ1ZSxcclxuICAgICAgICAgICAgYXJlYVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsncmdiYSgyNTAsMjUwLDI1MCwwLjIpJywncmdiYSgyMDAsMjAwLDIwMCwwLjIpJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lIDoge1xyXG4gICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvciA6ICcjZGRkJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0aW1lbGluZSA6IHtcclxuICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIGNvbG9yIDogJyMwMDhhY2QnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb250cm9sU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbCA6IHsgY29sb3IgOiAnIzAwOGFjZCd9LFxyXG4gICAgICAgICAgICBlbXBoYXNpcyA6IHsgY29sb3IgOiAnIzAwOGFjZCd9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeW1ib2wgOiAnZW1wdHlDaXJjbGUnLFxyXG4gICAgICAgIHN5bWJvbFNpemUgOiAzXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOafseW9ouWbvum7mOiupOWPguaVsFxyXG4gICAgYmFyOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiA1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzOiB7XHJcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IDVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8g5oqY57q/5Zu+6buY6K6k5Y+C5pWwXHJcbiAgICBsaW5lOiB7XHJcbiAgICAgICAgc21vb3RoIDogdHJ1ZSxcclxuICAgICAgICBzeW1ib2w6ICdlbXB0eUNpcmNsZScsICAvLyDmi5Dngrnlm77lvaLnsbvlnotcclxuICAgICAgICBzeW1ib2xTaXplOiAzICAgICAgICAgICAvLyDmi5Dngrnlm77lvaLlpKflsI9cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIEvnur/lm77pu5jorqTlj4LmlbBcclxuICAgIGs6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNkODdhODAnLCAgICAgICAvLyDpmLPnur/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGNvbG9yMDogJyMyZWM3YzknLCAgICAgIC8vIOmYtOe6v+Whq+WFheminOiJslxyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZDg3YTgwJywgICAvLyDpmLPnur/ovrnmoYbpopzoibJcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjA6ICcjMmVjN2M5JyAgIC8vIOmYtOe6v+i+ueahhuminOiJslxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8g5pWj54K55Zu+6buY6K6k5Y+C5pWwXHJcbiAgICBzY2F0dGVyOiB7XHJcbiAgICAgICAgc3ltYm9sOiAnY2lyY2xlJywgICAgLy8g5Zu+5b2i57G75Z6LXHJcbiAgICAgICAgc3ltYm9sU2l6ZTogNCAgICAgICAgLy8g5Zu+5b2i5aSn5bCP77yM5Y2K5a6977yI5Y2K5b6E77yJ5Y+C5pWw77yM5b2T5Zu+5b2i5Li65pa55ZCR5oiW6I+x5b2i5YiZ5oC75a695bqm5Li6c3ltYm9sU2l6ZSAqIDJcclxuICAgIH0sXHJcblxyXG4gICAgLy8g6Zu36L6+5Zu+6buY6K6k5Y+C5pWwXHJcbiAgICByYWRhciA6IHtcclxuICAgICAgICBzeW1ib2w6ICdlbXB0eUNpcmNsZScsICAgIC8vIOWbvuW9ouexu+Wei1xyXG4gICAgICAgIHN5bWJvbFNpemU6M1xyXG4gICAgICAgIC8vc3ltYm9sOiBudWxsLCAgICAgICAgIC8vIOaLkOeCueWbvuW9ouexu+Wei1xyXG4gICAgICAgIC8vc3ltYm9sUm90YXRlIDogbnVsbCwgIC8vIOWbvuW9ouaXi+i9rOaOp+WItlxyXG4gICAgfSxcclxuXHJcbiAgICBtYXA6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBhcmVhU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNkZGQnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZDg3YTgwJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZW1waGFzaXM6IHsgICAgICAgICAgICAgICAgIC8vIOS5n+aYr+mAieS4reagt+W8j1xyXG4gICAgICAgICAgICAgICAgYXJlYVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZmU5OTRlJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGxhYmVsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAncmdiKDEwMCwwLDApJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZvcmNlIDoge1xyXG4gICAgICAgIGl0ZW1TdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGxpbmtTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvciA6ICcjMWU5MGZmJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjaG9yZCA6IHtcclxuICAgICAgICBwYWRkaW5nIDogNCxcclxuICAgICAgICBpdGVtU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbCA6IHtcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNob3JkU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzIDoge1xyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuNSknXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2hvcmRTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2F1Z2UgOiB7XHJcbiAgICAgICAgc3RhcnRBbmdsZTogMjI1LFxyXG4gICAgICAgIGVuZEFuZ2xlIDogLTQ1LFxyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIHNob3c6IHRydWUsICAgICAgICAvLyDpu5jorqTmmL7npLrvvIzlsZ7mgKdzaG935o6n5Yi25pi+56S65LiO5ZCmXHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbWzAuMiwgJyMyZWM3YzknXSxbMC44LCAnIzVhYjFlZiddLFsxLCAnI2Q4N2E4MCddXSwgXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogMTBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXhpc1RpY2s6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTlsI/moIforrBcclxuICAgICAgICAgICAgc3BsaXROdW1iZXI6IDEwLCAgIC8vIOavj+S7vXNwbGl057uG5YiG5aSa5bCR5q61XHJcbiAgICAgICAgICAgIGxlbmd0aCA6MTUsICAgICAgICAvLyDlsZ7mgKdsZW5ndGjmjqfliLbnur/plb9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZeaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBheGlzTGFiZWw6IHsgICAgICAgICAgIC8vIOWdkOagh+i9tOaWh+acrOagh+etvu+8jOivpuingWF4aXMuYXhpc0xhYmVsXHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgbGVuZ3RoIDoyMiwgICAgICAgICAvLyDlsZ7mgKdsZW5ndGjmjqfliLbnur/plb9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZe+8iOivpuingWxpbmVTdHlsZe+8ieaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwb2ludGVyIDoge1xyXG4gICAgICAgICAgICB3aWR0aCA6IDUsXHJcbiAgICAgICAgICAgIGNvbG9yIDogJ2F1dG8nXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aXRsZSA6IHtcclxuICAgICAgICAgICAgdGV4dFN0eWxlOiB7ICAgICAgIC8vIOWFtuS9meWxnuaAp+m7mOiupOS9v+eUqOWFqOWxgOaWh+acrOagt+W8j++8jOivpuingVRFWFRTVFlMRVxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjMzMzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXRhaWwgOiB7XHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgIGZvbnRGYW1pbHk6ICflvq7ova/pm4Xpu5EsIEFyaWFsLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xyXG4gICAgfVxyXG59XHJcblxyXG4gICAgcmV0dXJuIHRoZW1lO1xyXG59KTsiXSwiZmlsZSI6InBsdWdpbnMvZWNoYXJ0cy90aGVtZS9tYWNhcm9ucy5qcyJ9
