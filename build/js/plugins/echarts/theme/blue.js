define(function() {

var theme = {
    // 默认色板
    color: [
        '#1790cf','#1bb2d8','#99d2dd','#88b0bb',
        '#1c7099','#038cc4','#75abd0','#afd6dd'
    ],

    // 图表标题
    title: {
        itemGap: 8,
        textStyle: {
            fontWeight: 'normal',
            color: '#1790cf'
        }
    },
    
    // 值域
    dataRange: {
        color:['#1178ad','#72bbd0']
    },

    // 工具箱
    toolbox: {
        color : ['#1790cf','#1790cf','#1790cf','#1790cf']
    },

    // 提示框
    tooltip: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'line',         // 默认为直线，可选为：'line' | 'shadow'
            lineStyle : {          // 直线指示器样式设置
                color: '#1790cf',
                type: 'dashed'
            },
            crossStyle: {
                color: '#1790cf'
            },
            shadowStyle : {                     // 阴影指示器样式设置
                color: 'rgba(200,200,200,0.3)'
            }
        }
    },

    // 区域缩放控制器
    dataZoom: {
        dataBackgroundColor: '#eee',            // 数据背景颜色
        fillerColor: 'rgba(144,197,237,0.2)',   // 填充颜色
        handleColor: '#1790cf'     // 手柄颜色
    },
    
    grid: {
        borderWidth: 0
    },

    // 类目轴
    categoryAxis: {
        axisLine: {            // 坐标轴线
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#1790cf'
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
                color: '#1790cf'
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

    timeline : {
        lineStyle : {
            color : '#1790cf'
        },
        controlStyle : {
            normal : { color : '#1790cf'},
            emphasis : { color : '#1790cf'}
        }
    },

    // K线图默认参数
    k: {
        itemStyle: {
            normal: {
                color: '#1bb2d8',          // 阳线填充颜色
                color0: '#99d2dd',      // 阴线填充颜色
                lineStyle: {
                    width: 1,
                    color: '#1c7099',   // 阳线边框颜色
                    color0: '#88b0bb'   // 阴线边框颜色
                }
            }
        }
    },
    
    map: {
        itemStyle: {
            normal: {
                areaStyle: {
                    color: '#ddd'
                },
                label: {
                    textStyle: {
                        color: '#c12e34'
                    }
                }
            },
            emphasis: {                 // 也是选中样式
                areaStyle: {
                    color: '#99d2dd'
                },
                label: {
                    textStyle: {
                        color: '#c12e34'
                    }
                }
            }
        }
    },
    
    force : {
        itemStyle: {
            normal: {
                linkStyle : {
                    strokeColor : '#1790cf'
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
                color: [[0.2, '#1bb2d8'],[0.8, '#1790cf'],[1, '#1c7099']], 
                width: 8
            }
        },
        axisTick: {            // 坐标轴小标记
            splitNumber: 10,   // 每份split细分多少段
            length :12,        // 属性length控制线长
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
            length : 18,         // 属性length控制线长
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: 'auto'
            }
        },
        pointer : {
            length : '90%',
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvdGhlbWUvYmx1ZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJkZWZpbmUoZnVuY3Rpb24oKSB7XHJcblxyXG52YXIgdGhlbWUgPSB7XHJcbiAgICAvLyDpu5jorqToibLmnb9cclxuICAgIGNvbG9yOiBbXHJcbiAgICAgICAgJyMxNzkwY2YnLCcjMWJiMmQ4JywnIzk5ZDJkZCcsJyM4OGIwYmInLFxyXG4gICAgICAgICcjMWM3MDk5JywnIzAzOGNjNCcsJyM3NWFiZDAnLCcjYWZkNmRkJ1xyXG4gICAgXSxcclxuXHJcbiAgICAvLyDlm77ooajmoIfpophcclxuICAgIHRpdGxlOiB7XHJcbiAgICAgICAgaXRlbUdhcDogOCxcclxuICAgICAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICAgICAgZm9udFdlaWdodDogJ25vcm1hbCcsXHJcbiAgICAgICAgICAgIGNvbG9yOiAnIzE3OTBjZidcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvLyDlgLzln59cclxuICAgIGRhdGFSYW5nZToge1xyXG4gICAgICAgIGNvbG9yOlsnIzExNzhhZCcsJyM3MmJiZDAnXVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDlt6XlhbfnrrFcclxuICAgIHRvb2xib3g6IHtcclxuICAgICAgICBjb2xvciA6IFsnIzE3OTBjZicsJyMxNzkwY2YnLCcjMTc5MGNmJywnIzE3OTBjZiddXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOaPkOekuuahhlxyXG4gICAgdG9vbHRpcDoge1xyXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwwLDAsMC41KScsXHJcbiAgICAgICAgYXhpc1BvaW50ZXIgOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L205oyH56S65Zmo77yM5Z2Q5qCH6L206Kem5Y+R5pyJ5pWIXHJcbiAgICAgICAgICAgIHR5cGUgOiAnbGluZScsICAgICAgICAgLy8g6buY6K6k5Li655u057q/77yM5Y+v6YCJ5Li677yaJ2xpbmUnIHwgJ3NoYWRvdydcclxuICAgICAgICAgICAgbGluZVN0eWxlIDogeyAgICAgICAgICAvLyDnm7Tnur/mjIfnpLrlmajmoLflvI/orr7nva5cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzE3OTBjZicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGFzaGVkJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjcm9zc1N0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyMxNzkwY2YnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNoYWRvd1N0eWxlIDogeyAgICAgICAgICAgICAgICAgICAgIC8vIOmYtOW9seaMh+ekuuWZqOagt+W8j+iuvue9rlxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICdyZ2JhKDIwMCwyMDAsMjAwLDAuMyknXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOWMuuWfn+e8qeaUvuaOp+WItuWZqFxyXG4gICAgZGF0YVpvb206IHtcclxuICAgICAgICBkYXRhQmFja2dyb3VuZENvbG9yOiAnI2VlZScsICAgICAgICAgICAgLy8g5pWw5o2u6IOM5pmv6aKc6ImyXHJcbiAgICAgICAgZmlsbGVyQ29sb3I6ICdyZ2JhKDE0NCwxOTcsMjM3LDAuMiknLCAgIC8vIOWhq+WFheminOiJslxyXG4gICAgICAgIGhhbmRsZUNvbG9yOiAnIzE3OTBjZicgICAgIC8vIOaJi+afhOminOiJslxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ3JpZDoge1xyXG4gICAgICAgIGJvcmRlcldpZHRoOiAwXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOexu+ebrui9tFxyXG4gICAgY2F0ZWdvcnlBeGlzOiB7XHJcbiAgICAgICAgYXhpc0xpbmU6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTnur9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZeaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjMTc5MGNmJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzcGxpdExpbmU6IHsgICAgICAgICAgIC8vIOWIhumalOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl77yI6K+m6KeBbGluZVN0eWxl77yJ5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogWycjZWVlJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8g5pWw5YC85Z6L5Z2Q5qCH6L206buY6K6k5Y+C5pWwXHJcbiAgICB2YWx1ZUF4aXM6IHtcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyMxNzkwY2YnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0QXJlYSA6IHtcclxuICAgICAgICAgICAgc2hvdyA6IHRydWUsXHJcbiAgICAgICAgICAgIGFyZWFTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJ3JnYmEoMjUwLDI1MCwyNTAsMC4xKScsJ3JnYmEoMjAwLDIwMCwyMDAsMC4xKSddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXvvIjor6bop4FsaW5lU3R5bGXvvInmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJyNlZWUnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0aW1lbGluZSA6IHtcclxuICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIGNvbG9yIDogJyMxNzkwY2YnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb250cm9sU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbCA6IHsgY29sb3IgOiAnIzE3OTBjZid9LFxyXG4gICAgICAgICAgICBlbXBoYXNpcyA6IHsgY29sb3IgOiAnIzE3OTBjZid9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBL57q/5Zu+6buY6K6k5Y+C5pWwXHJcbiAgICBrOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjMWJiMmQ4JywgICAgICAgICAgLy8g6Ziz57q/5aGr5YWF6aKc6ImyXHJcbiAgICAgICAgICAgICAgICBjb2xvcjA6ICcjOTlkMmRkJywgICAgICAvLyDpmLTnur/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzFjNzA5OScsICAgLy8g6Ziz57q/6L655qGG6aKc6ImyXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IwOiAnIzg4YjBiYicgICAvLyDpmLTnur/ovrnmoYbpopzoibJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1hcDoge1xyXG4gICAgICAgIGl0ZW1TdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGFyZWFTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2RkZCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjMTJlMzQnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpczogeyAgICAgICAgICAgICAgICAgLy8g5Lmf5piv6YCJ5Lit5qC35byPXHJcbiAgICAgICAgICAgICAgICBhcmVhU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyM5OWQyZGQnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjYzEyZTM0J1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZvcmNlIDoge1xyXG4gICAgICAgIGl0ZW1TdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGxpbmtTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvciA6ICcjMTc5MGNmJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgY2hvcmQgOiB7XHJcbiAgICAgICAgcGFkZGluZyA6IDQsXHJcbiAgICAgICAgaXRlbVN0eWxlIDoge1xyXG4gICAgICAgICAgICBub3JtYWwgOiB7XHJcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjaG9yZFN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuNSknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpcyA6IHtcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNob3JkU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBnYXVnZSA6IHtcclxuICAgICAgICBzdGFydEFuZ2xlOiAyMjUsXHJcbiAgICAgICAgZW5kQW5nbGUgOiAtNDUsXHJcbiAgICAgICAgYXhpc0xpbmU6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTnur9cclxuICAgICAgICAgICAgc2hvdzogdHJ1ZSwgICAgICAgIC8vIOm7mOiupOaYvuekuu+8jOWxnuaAp3Nob3fmjqfliLbmmL7npLrkuI7lkKZcclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZeaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFtbMC4yLCAnIzFiYjJkOCddLFswLjgsICcjMTc5MGNmJ10sWzEsICcjMWM3MDk5J11dLCBcclxuICAgICAgICAgICAgICAgIHdpZHRoOiA4XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNUaWNrOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L205bCP5qCH6K6wXHJcbiAgICAgICAgICAgIHNwbGl0TnVtYmVyOiAxMCwgICAvLyDmr4/ku71zcGxpdOe7huWIhuWkmuWwkeautVxyXG4gICAgICAgICAgICBsZW5ndGggOjEyLCAgICAgICAgLy8g5bGe5oCnbGVuZ3Ro5o6n5Yi257q/6ZW/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXhpc0xhYmVsOiB7ICAgICAgICAgICAvLyDlnZDmoIfovbTmlofmnKzmoIfnrb7vvIzor6bop4FheGlzLmF4aXNMYWJlbFxyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIGxlbmd0aCA6IDE4LCAgICAgICAgIC8vIOWxnuaAp2xlbmd0aOaOp+WItue6v+mVv1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl77yI6K+m6KeBbGluZVN0eWxl77yJ5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBvaW50ZXIgOiB7XHJcbiAgICAgICAgICAgIGxlbmd0aCA6ICc5MCUnLFxyXG4gICAgICAgICAgICBjb2xvciA6ICdhdXRvJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGl0bGUgOiB7XHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzMzMydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGV0YWlsIDoge1xyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICBmb250RmFtaWx5OiAn5b6u6L2v6ZuF6buRLCBBcmlhbCwgVmVyZGFuYSwgc2Fucy1zZXJpZidcclxuICAgIH1cclxufVxyXG5cclxuICAgIHJldHVybiB0aGVtZTtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL2VjaGFydHMvdGhlbWUvYmx1ZS5qcyJ9
