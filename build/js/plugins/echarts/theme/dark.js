define(function() {

var theme = {
    // 全图默认背景
    backgroundColor: '#1b1b1b',
    
    // 默认色板
    color: [
        '#FE8463','#9BCA63','#FAD860','#60C0DD','#0084C6',
        '#D7504B','#C6E579','#26C0C0','#F0805A','#F4E001',
        '#B5C334'
    ],

    // 图表标题
    title: {
        itemGap: 8,
        textStyle: {
            fontWeight: 'normal',
            color: '#fff'          // 主标题文字颜色
        }
    },
    
    // 图例
    legend: {
        itemGap: 8,
        textStyle: {
            color: '#ccc'          // 图例文字颜色
        }
    },
    
    // 值域
    dataRange: {
        itemWidth: 15,
        color: ['#FFF808','#21BCF9'],
        textStyle: {
            color: '#ccc'          // 值域文字颜色
        }
    },

    toolbox: {
        color : ['#fff', '#fff', '#fff', '#fff'],
        effectiveColor : '#FE8463',
        disableColor: '#666',
        itemGap: 8
    },

    // 提示框
    tooltip: {
        backgroundColor: 'rgba(250,250,250,0.8)',     // 提示背景颜色，默认为透明度为0.7的黑色
        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'line',         // 默认为直线，可选为：'line' | 'shadow'
            lineStyle : {          // 直线指示器样式设置
                color: '#aaa'
            },
            crossStyle: {
                color: '#aaa'
            },
            shadowStyle : {                     // 阴影指示器样式设置
                color: 'rgba(200,200,200,0.2)'
            }
        },
        textStyle: {
            color: '#333'
        }
    },

    // 区域缩放控制器
    dataZoom: {
        dataBackgroundColor: '#555',            // 数据背景颜色
        fillerColor: 'rgba(200,200,200,0.2)',   // 填充颜色
        handleColor: '#eee'     // 手柄颜色
    },

    // 网格
    grid: {
        borderWidth: 0
    },

    // 类目轴
    categoryAxis: {
        axisLine: {            // 坐标轴线
            show: false
        },
        axisTick: {            // 坐标轴小标记
            show: false
        },
        axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: '#ccc'
            }
        },
        splitLine: {           // 分隔线
            show: false
        }
    },

    // 数值型坐标轴默认参数
    valueAxis: {
        axisLine: {            // 坐标轴线
            show: false
        },
        axisTick: {            // 坐标轴小标记
            show: false
        },
        axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: '#ccc'
            }
        },
        splitLine: {           // 分隔线
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: ['#aaa'],
                type: 'dashed'
            }
        },
        splitArea: {           // 分隔区域
            show: false
        }
    },
    
    polar : {
        name : {
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: '#ccc'
            }
        },
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
        label: {
            textStyle:{
                color: '#ccc'
            }
        },
        lineStyle : {
            color : '#aaa'
        },
        controlStyle : {
            normal : { color : '#fff'},
            emphasis : { color : '#FE8463'}
        },
        symbolSize : 3
    },

    // 折线图默认参数
    line: {
        smooth : true
    },
    
    // K线图默认参数
    k: {
        itemStyle: {
            normal: {
                color: '#FE8463',       // 阳线填充颜色
                color0: '#9BCA63',      // 阴线填充颜色
                lineStyle: {
                    width: 1,
                    color: '#FE8463',   // 阳线边框颜色
                    color0: '#9BCA63'   // 阴线边框颜色
                }
            }
        }
    },
    
    // 雷达图默认参数
    radar : {
        symbol: 'emptyCircle',    // 图形类型
        symbolSize:3
        //symbol: null,         // 拐点图形类型
        //symbolRotate : null,  // 图形旋转控制
    },

    pie: {
        itemStyle: {
            normal: {
                borderWidth: 1,
                borderColor : 'rgba(255, 255, 255, 0.5)'
            },
            emphasis: {
                borderWidth: 1,
                borderColor : 'rgba(255, 255, 255, 1)'
            }
        }
    },
    
    map: {
        itemStyle: {
            normal: {
                borderColor:'rgba(255, 255, 255, 0.5)',
                areaStyle: {
                    color: '#ddd'
                },
                label: {
                    textStyle: {
                        color: '#ccc'
                    }
                }
            },
            emphasis: {                 // 也是选中样式
                areaStyle: {
                    color: '#FE8463'
                },
                label: {
                    textStyle: {
                        color: 'ccc'
                    }
                }
            }
        }
    },
    
    force : {
        itemStyle: {
            normal: {
                linkStyle : {
                    strokeColor : '#fff'
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
                    color : 'rgba(228, 228, 228, 0.2)'
                },
                chordStyle : {
                    lineStyle : {
                        width : 1,
                        color : 'rgba(228, 228, 228, 0.2)'
                    }
                }
            },
            emphasis : {
                lineStyle : {
                    width : 1,
                    color : 'rgba(228, 228, 228, 0.9)'
                },
                chordStyle : {
                    lineStyle : {
                        width : 1,
                        color : 'rgba(228, 228, 228, 0.9)'
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
                color: [[0.2, '#9BCA63'],[0.8, '#60C0DD'],[1, '#D7504B']], 
                width: 3,
                shadowColor : '#fff', //默认透明
                shadowBlur: 10
            }
        },
        axisTick: {            // 坐标轴小标记
            length :15,        // 属性length控制线长
            lineStyle: {       // 属性lineStyle控制线条样式
                color: 'auto',
                shadowColor : '#fff', //默认透明
                shadowBlur: 10
            }
        },
        axisLabel: {            // 坐标轴小标记
            textStyle: {       // 属性lineStyle控制线条样式
                fontWeight: 'bolder',
                color: '#fff',
                shadowColor : '#fff', //默认透明
                shadowBlur: 10
            }
        },
        splitLine: {           // 分隔线
            length :25,         // 属性length控制线长
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                width:3,
                color: '#fff',
                shadowColor : '#fff', //默认透明
                shadowBlur: 10
            }
        },
        pointer: {           // 分隔线
            shadowColor : '#fff', //默认透明
            shadowBlur: 5
        },
        title : {
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                fontWeight: 'bolder',
                fontSize: 20,
                fontStyle: 'italic',
                color: '#fff',
                shadowColor : '#fff', //默认透明
                shadowBlur: 10
            }
        },
        detail : {
            shadowColor : '#fff', //默认透明
            shadowBlur: 5,
            offsetCenter: [0, '50%'],       // x, y，单位px
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                fontWeight: 'bolder',
                color: '#fff'
            }
        },
    },
    
    funnel : {
        itemStyle: {
            normal: {
                borderColor : 'rgba(255, 255, 255, 0.5)',
                borderWidth: 1
            },
            emphasis: {
                borderColor : 'rgba(255, 255, 255, 1)',
                borderWidth: 1
            }
        }
    },
    
    textStyle: {
        fontFamily: '微软雅黑, Arial, Verdana, sans-serif'
    }
}

    return theme;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvdGhlbWUvZGFyay5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJkZWZpbmUoZnVuY3Rpb24oKSB7XHJcblxyXG52YXIgdGhlbWUgPSB7XHJcbiAgICAvLyDlhajlm77pu5jorqTog4zmma9cclxuICAgIGJhY2tncm91bmRDb2xvcjogJyMxYjFiMWInLFxyXG4gICAgXHJcbiAgICAvLyDpu5jorqToibLmnb9cclxuICAgIGNvbG9yOiBbXHJcbiAgICAgICAgJyNGRTg0NjMnLCcjOUJDQTYzJywnI0ZBRDg2MCcsJyM2MEMwREQnLCcjMDA4NEM2JyxcclxuICAgICAgICAnI0Q3NTA0QicsJyNDNkU1NzknLCcjMjZDMEMwJywnI0YwODA1QScsJyNGNEUwMDEnLFxyXG4gICAgICAgICcjQjVDMzM0J1xyXG4gICAgXSxcclxuXHJcbiAgICAvLyDlm77ooajmoIfpophcclxuICAgIHRpdGxlOiB7XHJcbiAgICAgICAgaXRlbUdhcDogOCxcclxuICAgICAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICAgICAgZm9udFdlaWdodDogJ25vcm1hbCcsXHJcbiAgICAgICAgICAgIGNvbG9yOiAnI2ZmZicgICAgICAgICAgLy8g5Li75qCH6aKY5paH5a2X6aKc6ImyXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8g5Zu+5L6LXHJcbiAgICBsZWdlbmQ6IHtcclxuICAgICAgICBpdGVtR2FwOiA4LFxyXG4gICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICBjb2xvcjogJyNjY2MnICAgICAgICAgIC8vIOWbvuS+i+aWh+Wtl+minOiJslxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIOWAvOWfn1xyXG4gICAgZGF0YVJhbmdlOiB7XHJcbiAgICAgICAgaXRlbVdpZHRoOiAxNSxcclxuICAgICAgICBjb2xvcjogWycjRkZGODA4JywnIzIxQkNGOSddLFxyXG4gICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICBjb2xvcjogJyNjY2MnICAgICAgICAgIC8vIOWAvOWfn+aWh+Wtl+minOiJslxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdG9vbGJveDoge1xyXG4gICAgICAgIGNvbG9yIDogWycjZmZmJywgJyNmZmYnLCAnI2ZmZicsICcjZmZmJ10sXHJcbiAgICAgICAgZWZmZWN0aXZlQ29sb3IgOiAnI0ZFODQ2MycsXHJcbiAgICAgICAgZGlzYWJsZUNvbG9yOiAnIzY2NicsXHJcbiAgICAgICAgaXRlbUdhcDogOFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmj5DnpLrmoYZcclxuICAgIHRvb2x0aXA6IHtcclxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI1MCwyNTAsMjUwLDAuOCknLCAgICAgLy8g5o+Q56S66IOM5pmv6aKc6Imy77yM6buY6K6k5Li66YCP5piO5bqm5Li6MC4355qE6buR6ImyXHJcbiAgICAgICAgYXhpc1BvaW50ZXIgOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L205oyH56S65Zmo77yM5Z2Q5qCH6L206Kem5Y+R5pyJ5pWIXHJcbiAgICAgICAgICAgIHR5cGUgOiAnbGluZScsICAgICAgICAgLy8g6buY6K6k5Li655u057q/77yM5Y+v6YCJ5Li677yaJ2xpbmUnIHwgJ3NoYWRvdydcclxuICAgICAgICAgICAgbGluZVN0eWxlIDogeyAgICAgICAgICAvLyDnm7Tnur/mjIfnpLrlmajmoLflvI/orr7nva5cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2FhYSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY3Jvc3NTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjYWFhJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTdHlsZSA6IHsgICAgICAgICAgICAgICAgICAgICAvLyDpmLTlvbHmjIfnpLrlmajmoLflvI/orr7nva5cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAncmdiYSgyMDAsMjAwLDIwMCwwLjIpJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICAgICAgY29sb3I6ICcjMzMzJ1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8g5Yy65Z+f57yp5pS+5o6n5Yi25ZmoXHJcbiAgICBkYXRhWm9vbToge1xyXG4gICAgICAgIGRhdGFCYWNrZ3JvdW5kQ29sb3I6ICcjNTU1JywgICAgICAgICAgICAvLyDmlbDmja7og4zmma/popzoibJcclxuICAgICAgICBmaWxsZXJDb2xvcjogJ3JnYmEoMjAwLDIwMCwyMDAsMC4yKScsICAgLy8g5aGr5YWF6aKc6ImyXHJcbiAgICAgICAgaGFuZGxlQ29sb3I6ICcjZWVlJyAgICAgLy8g5omL5p+E6aKc6ImyXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOe9keagvFxyXG4gICAgZ3JpZDoge1xyXG4gICAgICAgIGJvcmRlcldpZHRoOiAwXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOexu+ebrui9tFxyXG4gICAgY2F0ZWdvcnlBeGlzOiB7XHJcbiAgICAgICAgYXhpc0xpbmU6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTnur9cclxuICAgICAgICAgICAgc2hvdzogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNUaWNrOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L205bCP5qCH6K6wXHJcbiAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBheGlzTGFiZWw6IHsgICAgICAgICAgIC8vIOWdkOagh+i9tOaWh+acrOagh+etvu+8jOivpuingWF4aXMuYXhpc0xhYmVsXHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2NjYydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgc2hvdzogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOaVsOWAvOWei+WdkOagh+i9tOm7mOiupOWPguaVsFxyXG4gICAgdmFsdWVBeGlzOiB7XHJcbiAgICAgICAgYXhpc0xpbmU6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTnur9cclxuICAgICAgICAgICAgc2hvdzogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNUaWNrOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L205bCP5qCH6K6wXHJcbiAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBheGlzTGFiZWw6IHsgICAgICAgICAgIC8vIOWdkOagh+i9tOaWh+acrOagh+etvu+8jOivpuingWF4aXMuYXhpc0xhYmVsXHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2NjYydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZe+8iOivpuingWxpbmVTdHlsZe+8ieaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsnI2FhYSddLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Rhc2hlZCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRBcmVhOiB7ICAgICAgICAgICAvLyDliIbpmpTljLrln59cclxuICAgICAgICAgICAgc2hvdzogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBwb2xhciA6IHtcclxuICAgICAgICBuYW1lIDoge1xyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNjY2MnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2RkZCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRBcmVhIDoge1xyXG4gICAgICAgICAgICBzaG93IDogdHJ1ZSxcclxuICAgICAgICAgICAgYXJlYVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsncmdiYSgyNTAsMjUwLDI1MCwwLjIpJywncmdiYSgyMDAsMjAwLDIwMCwwLjIpJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lIDoge1xyXG4gICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvciA6ICcjZGRkJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0aW1lbGluZSA6IHtcclxuICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6e1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjY2NjJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIGNvbG9yIDogJyNhYWEnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb250cm9sU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbCA6IHsgY29sb3IgOiAnI2ZmZid9LFxyXG4gICAgICAgICAgICBlbXBoYXNpcyA6IHsgY29sb3IgOiAnI0ZFODQ2Myd9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeW1ib2xTaXplIDogM1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmipjnur/lm77pu5jorqTlj4LmlbBcclxuICAgIGxpbmU6IHtcclxuICAgICAgICBzbW9vdGggOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvLyBL57q/5Zu+6buY6K6k5Y+C5pWwXHJcbiAgICBrOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjRkU4NDYzJywgICAgICAgLy8g6Ziz57q/5aGr5YWF6aKc6ImyXHJcbiAgICAgICAgICAgICAgICBjb2xvcjA6ICcjOUJDQTYzJywgICAgICAvLyDpmLTnur/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI0ZFODQ2MycsICAgLy8g6Ziz57q/6L655qGG6aKc6ImyXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IwOiAnIzlCQ0E2MycgICAvLyDpmLTnur/ovrnmoYbpopzoibJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIOmbt+i+vuWbvum7mOiupOWPguaVsFxyXG4gICAgcmFkYXIgOiB7XHJcbiAgICAgICAgc3ltYm9sOiAnZW1wdHlDaXJjbGUnLCAgICAvLyDlm77lvaLnsbvlnotcclxuICAgICAgICBzeW1ib2xTaXplOjNcclxuICAgICAgICAvL3N5bWJvbDogbnVsbCwgICAgICAgICAvLyDmi5Dngrnlm77lvaLnsbvlnotcclxuICAgICAgICAvL3N5bWJvbFJvdGF0ZSA6IG51bGwsICAvLyDlm77lvaLml4vovazmjqfliLZcclxuICAgIH0sXHJcblxyXG4gICAgcGllOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvciA6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSknXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzOiB7XHJcbiAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogMSxcclxuICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yIDogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMSknXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtYXA6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjoncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjUpJyxcclxuICAgICAgICAgICAgICAgIGFyZWFTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2RkZCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjY2MnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpczogeyAgICAgICAgICAgICAgICAgLy8g5Lmf5piv6YCJ5Lit5qC35byPXHJcbiAgICAgICAgICAgICAgICBhcmVhU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNGRTg0NjMnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICdjY2MnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZm9yY2UgOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgbGlua1N0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yIDogJyNmZmYnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNob3JkIDoge1xyXG4gICAgICAgIHBhZGRpbmcgOiA0LFxyXG4gICAgICAgIGl0ZW1TdHlsZSA6IHtcclxuICAgICAgICAgICAgbm9ybWFsIDoge1xyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDIyOCwgMjI4LCAyMjgsIDAuMiknXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2hvcmRTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgyMjgsIDIyOCwgMjI4LCAwLjIpJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZW1waGFzaXMgOiB7XHJcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMjI4LCAyMjgsIDIyOCwgMC45KSdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjaG9yZFN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDIyOCwgMjI4LCAyMjgsIDAuOSknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnYXVnZSA6IHtcclxuICAgICAgICBzdGFydEFuZ2xlOiAyMjUsXHJcbiAgICAgICAgZW5kQW5nbGUgOiAtNDUsXHJcbiAgICAgICAgYXhpc0xpbmU6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTnur9cclxuICAgICAgICAgICAgc2hvdzogdHJ1ZSwgICAgICAgIC8vIOm7mOiupOaYvuekuu+8jOWxnuaAp3Nob3fmjqfliLbmmL7npLrkuI7lkKZcclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZeaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFtbMC4yLCAnIzlCQ0E2MyddLFswLjgsICcjNjBDMEREJ10sWzEsICcjRDc1MDRCJ11dLCBcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAzLFxyXG4gICAgICAgICAgICAgICAgc2hhZG93Q29sb3IgOiAnI2ZmZicsIC8v6buY6K6k6YCP5piOXHJcbiAgICAgICAgICAgICAgICBzaGFkb3dCbHVyOiAxMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBheGlzVGljazogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOWwj+agh+iusFxyXG4gICAgICAgICAgICBsZW5ndGggOjE1LCAgICAgICAgLy8g5bGe5oCnbGVuZ3Ro5o6n5Yi257q/6ZW/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bycsXHJcbiAgICAgICAgICAgICAgICBzaGFkb3dDb2xvciA6ICcjZmZmJywgLy/pu5jorqTpgI/mmI5cclxuICAgICAgICAgICAgICAgIHNoYWRvd0JsdXI6IDEwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNMYWJlbDogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOWwj+agh+iusFxyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiAnYm9sZGVyJyxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2ZmZicsXHJcbiAgICAgICAgICAgICAgICBzaGFkb3dDb2xvciA6ICcjZmZmJywgLy/pu5jorqTpgI/mmI5cclxuICAgICAgICAgICAgICAgIHNoYWRvd0JsdXI6IDEwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIGxlbmd0aCA6MjUsICAgICAgICAgLy8g5bGe5oCnbGVuZ3Ro5o6n5Yi257q/6ZW/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXvvIjor6bop4FsaW5lU3R5bGXvvInmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIHdpZHRoOjMsXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnLFxyXG4gICAgICAgICAgICAgICAgc2hhZG93Q29sb3IgOiAnI2ZmZicsIC8v6buY6K6k6YCP5piOXHJcbiAgICAgICAgICAgICAgICBzaGFkb3dCbHVyOiAxMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwb2ludGVyOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgc2hhZG93Q29sb3IgOiAnI2ZmZicsIC8v6buY6K6k6YCP5piOXHJcbiAgICAgICAgICAgIHNoYWRvd0JsdXI6IDVcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRpdGxlIDoge1xyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiAnYm9sZGVyJyxcclxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAyMCxcclxuICAgICAgICAgICAgICAgIGZvbnRTdHlsZTogJ2l0YWxpYycsXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnLFxyXG4gICAgICAgICAgICAgICAgc2hhZG93Q29sb3IgOiAnI2ZmZicsIC8v6buY6K6k6YCP5piOXHJcbiAgICAgICAgICAgICAgICBzaGFkb3dCbHVyOiAxMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXRhaWwgOiB7XHJcbiAgICAgICAgICAgIHNoYWRvd0NvbG9yIDogJyNmZmYnLCAvL+m7mOiupOmAj+aYjlxyXG4gICAgICAgICAgICBzaGFkb3dCbHVyOiA1LFxyXG4gICAgICAgICAgICBvZmZzZXRDZW50ZXI6IFswLCAnNTAlJ10sICAgICAgIC8vIHgsIHnvvIzljZXkvY1weFxyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBmb250V2VpZ2h0OiAnYm9sZGVyJyxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2ZmZidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmdW5uZWwgOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3IgOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjUpJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzOiB7XHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvciA6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDEpJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAxXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICBmb250RmFtaWx5OiAn5b6u6L2v6ZuF6buRLCBBcmlhbCwgVmVyZGFuYSwgc2Fucy1zZXJpZidcclxuICAgIH1cclxufVxyXG5cclxuICAgIHJldHVybiB0aGVtZTtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL2VjaGFydHMvdGhlbWUvZGFyay5qcyJ9
