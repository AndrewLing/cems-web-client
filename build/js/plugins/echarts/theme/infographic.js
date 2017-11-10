define(function() {

var theme = {
    // 默认色板
    color: [
        '#C1232B','#B5C334','#FCCE10','#E87C25','#27727B',
        '#FE8463','#9BCA63','#FAD860','#F3A43B','#60C0DD',
        '#D7504B','#C6E579','#F4E001','#F0805A','#26C0C0'
    ],

    // 图表标题
    title: {
        itemGap: 8,
        textStyle: {
            fontWeight: 'normal',
            color: '#27727B'          // 主标题文字颜色
        }
    },
    
    // 图例
    legend: {
        itemGap: 8
    },
    
    // 值域
    dataRange: {
        x:'right',
        y:'center',
        itemWidth: 5,
        itemHeight:25,
        color:['#C1232B','#FCCE10']
    },

    toolbox: {
        color : [
            '#C1232B','#B5C334','#FCCE10','#E87C25','#27727B',
            '#FE8463','#9BCA63','#FAD860','#F3A43B','#60C0DD',
        ],
        effectiveColor : '#ff4500',
        itemGap: 8
    },

    // 提示框
    tooltip: {
        backgroundColor: 'rgba(50,50,50,0.5)',     // 提示背景颜色，默认为透明度为0.7的黑色
        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'line',         // 默认为直线，可选为：'line' | 'shadow'
            lineStyle : {          // 直线指示器样式设置
                color: '#27727B',
                type: 'dashed'
            },
            crossStyle: {
                color: '#27727B'
            },
            shadowStyle : {                     // 阴影指示器样式设置
                color: 'rgba(200,200,200,0.3)'
            }
        }
    },

    // 区域缩放控制器
    dataZoom: {
        dataBackgroundColor: 'rgba(181,195,52,0.3)',            // 数据背景颜色
        fillerColor: 'rgba(181,195,52,0.2)',   // 填充颜色
        handleColor: '#27727B',    // 手柄颜色

    },

    // 网格
    grid: {
        borderWidth:0
    },

    // 类目轴
    categoryAxis: {
        axisLine: {            // 坐标轴线
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#27727B'
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
        splitArea : {
            show: false
        },
        splitLine: {           // 分隔线
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: ['#ccc'],
                type: 'dashed'
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
            color : '#27727B'
        },
        controlStyle : {
            normal : { color : '#27727B'},
            emphasis : { color : '#27727B'}
        },
        symbol : 'emptyCircle',
        symbolSize : 3
    },

    // 柱形图默认参数
    bar: {
        itemStyle: {
            normal: {
                borderRadius: 0
            },
            emphasis: {
                borderRadius: 0
            }
        }
    },

    // 折线图默认参数
    line: {
        itemStyle: {
            normal: {
                borderWidth:2,
                borderColor:'#fff',
                lineStyle: {
                    width: 3
                }
            },
            emphasis: {
                borderWidth:0
            }
        },
        symbol: 'circle',  // 拐点图形类型
        symbolSize: 3.5           // 拐点图形大小
    },
    
    // K线图默认参数
    k: {
        itemStyle: {
            normal: {
                color: '#C1232B',       // 阳线填充颜色
                color0: '#B5C334',      // 阴线填充颜色
                lineStyle: {
                    width: 1,
                    color: '#C1232B',   // 阳线边框颜色
                    color0: '#B5C334'   // 阴线边框颜色
                }
            }
        }
    },
    
    // 散点图默认参数
    scatter: {
        itemdStyle: {
            normal: {
                borderWidth:1,
                borderColor:'rgba(200,200,200,0.5)'
            },
            emphasis: {
                borderWidth:0
            }
        },
        symbol: 'star4',    // 图形类型
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
                        color: '#C1232B'
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
                    strokeColor : '#27727B'
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
        center:['50%','80%'],
        radius:'100%',
        startAngle: 180,
        endAngle : 0,
        axisLine: {            // 坐标轴线
            show: true,        // 默认显示，属性show控制显示与否
            lineStyle: {       // 属性lineStyle控制线条样式
                color: [[0.2, '#B5C334'],[0.8, '#27727B'],[1, '#C1232B']], 
                width: '40%'
            }
        },
        axisTick: {            // 坐标轴小标记
            splitNumber: 2,   // 每份split细分多少段
            length: 5,        // 属性length控制线长
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#fff'
            }
        },
        axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: '#fff',
                fontWeight:'bolder'
            }
        },
        splitLine: {           // 分隔线
            length: '5%',         // 属性length控制线长
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: '#fff'
            }
        },
        pointer : {
            width : '40%',
            length: '80%',
            color: '#fff'
        },
        title : {
          offsetCenter: [0, -20],       // x, y，单位px
          textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
            color: 'auto',
            fontSize: 20
          }
        },
        detail : {
            offsetCenter: [0, 00],       // x, y，单位px
            textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                color: 'auto',
                fontSize: 40
            }
        }
    },
    
    textStyle: {
        fontFamily: '微软雅黑, Arial, Verdana, sans-serif'
    }
}

    return theme;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvdGhlbWUvaW5mb2dyYXBoaWMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKGZ1bmN0aW9uKCkge1xyXG5cclxudmFyIHRoZW1lID0ge1xyXG4gICAgLy8g6buY6K6k6Imy5p2/XHJcbiAgICBjb2xvcjogW1xyXG4gICAgICAgICcjQzEyMzJCJywnI0I1QzMzNCcsJyNGQ0NFMTAnLCcjRTg3QzI1JywnIzI3NzI3QicsXHJcbiAgICAgICAgJyNGRTg0NjMnLCcjOUJDQTYzJywnI0ZBRDg2MCcsJyNGM0E0M0InLCcjNjBDMEREJyxcclxuICAgICAgICAnI0Q3NTA0QicsJyNDNkU1NzknLCcjRjRFMDAxJywnI0YwODA1QScsJyMyNkMwQzAnXHJcbiAgICBdLFxyXG5cclxuICAgIC8vIOWbvuihqOagh+mimFxyXG4gICAgdGl0bGU6IHtcclxuICAgICAgICBpdGVtR2FwOiA4LFxyXG4gICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICBmb250V2VpZ2h0OiAnbm9ybWFsJyxcclxuICAgICAgICAgICAgY29sb3I6ICcjMjc3MjdCJyAgICAgICAgICAvLyDkuLvmoIfpopjmloflrZfpopzoibJcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvLyDlm77kvotcclxuICAgIGxlZ2VuZDoge1xyXG4gICAgICAgIGl0ZW1HYXA6IDhcclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIOWAvOWfn1xyXG4gICAgZGF0YVJhbmdlOiB7XHJcbiAgICAgICAgeDoncmlnaHQnLFxyXG4gICAgICAgIHk6J2NlbnRlcicsXHJcbiAgICAgICAgaXRlbVdpZHRoOiA1LFxyXG4gICAgICAgIGl0ZW1IZWlnaHQ6MjUsXHJcbiAgICAgICAgY29sb3I6WycjQzEyMzJCJywnI0ZDQ0UxMCddXHJcbiAgICB9LFxyXG5cclxuICAgIHRvb2xib3g6IHtcclxuICAgICAgICBjb2xvciA6IFtcclxuICAgICAgICAgICAgJyNDMTIzMkInLCcjQjVDMzM0JywnI0ZDQ0UxMCcsJyNFODdDMjUnLCcjMjc3MjdCJyxcclxuICAgICAgICAgICAgJyNGRTg0NjMnLCcjOUJDQTYzJywnI0ZBRDg2MCcsJyNGM0E0M0InLCcjNjBDMEREJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIGVmZmVjdGl2ZUNvbG9yIDogJyNmZjQ1MDAnLFxyXG4gICAgICAgIGl0ZW1HYXA6IDhcclxuICAgIH0sXHJcblxyXG4gICAgLy8g5o+Q56S65qGGXHJcbiAgICB0b29sdGlwOiB7XHJcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSg1MCw1MCw1MCwwLjUpJywgICAgIC8vIOaPkOekuuiDjOaZr+minOiJsu+8jOm7mOiupOS4uumAj+aYjuW6puS4ujAuN+eahOm7keiJslxyXG4gICAgICAgIGF4aXNQb2ludGVyIDogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOaMh+ekuuWZqO+8jOWdkOagh+i9tOinpuWPkeacieaViFxyXG4gICAgICAgICAgICB0eXBlIDogJ2xpbmUnLCAgICAgICAgIC8vIOm7mOiupOS4uuebtOe6v++8jOWPr+mAieS4uu+8midsaW5lJyB8ICdzaGFkb3cnXHJcbiAgICAgICAgICAgIGxpbmVTdHlsZSA6IHsgICAgICAgICAgLy8g55u057q/5oyH56S65Zmo5qC35byP6K6+572uXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyMyNzcyN0InLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Rhc2hlZCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY3Jvc3NTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjMjc3MjdCJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTdHlsZSA6IHsgICAgICAgICAgICAgICAgICAgICAvLyDpmLTlvbHmjIfnpLrlmajmoLflvI/orr7nva5cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAncmdiYSgyMDAsMjAwLDIwMCwwLjMpJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDljLrln5/nvKnmlL7mjqfliLblmahcclxuICAgIGRhdGFab29tOiB7XHJcbiAgICAgICAgZGF0YUJhY2tncm91bmRDb2xvcjogJ3JnYmEoMTgxLDE5NSw1MiwwLjMpJywgICAgICAgICAgICAvLyDmlbDmja7og4zmma/popzoibJcclxuICAgICAgICBmaWxsZXJDb2xvcjogJ3JnYmEoMTgxLDE5NSw1MiwwLjIpJywgICAvLyDloavlhYXpopzoibJcclxuICAgICAgICBoYW5kbGVDb2xvcjogJyMyNzcyN0InLCAgICAvLyDmiYvmn4TpopzoibJcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOe9keagvFxyXG4gICAgZ3JpZDoge1xyXG4gICAgICAgIGJvcmRlcldpZHRoOjBcclxuICAgIH0sXHJcblxyXG4gICAgLy8g57G755uu6L20XHJcbiAgICBjYXRlZ29yeUF4aXM6IHtcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyMyNzcyN0InXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmlbDlgLzlnovlnZDmoIfovbTpu5jorqTlj4LmlbBcclxuICAgIHZhbHVlQXhpczoge1xyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzcGxpdEFyZWEgOiB7XHJcbiAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzcGxpdExpbmU6IHsgICAgICAgICAgIC8vIOWIhumalOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl77yI6K+m6KeBbGluZVN0eWxl77yJ5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogWycjY2NjJ10sXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGFzaGVkJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBwb2xhciA6IHtcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNkZGQnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0QXJlYSA6IHtcclxuICAgICAgICAgICAgc2hvdyA6IHRydWUsXHJcbiAgICAgICAgICAgIGFyZWFTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJ3JnYmEoMjUwLDI1MCwyNTAsMC4yKScsJ3JnYmEoMjAwLDIwMCwyMDAsMC4yKSddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZSA6IHtcclxuICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3IgOiAnI2RkZCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdGltZWxpbmUgOiB7XHJcbiAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICBjb2xvciA6ICcjMjc3MjdCJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29udHJvbFN0eWxlIDoge1xyXG4gICAgICAgICAgICBub3JtYWwgOiB7IGNvbG9yIDogJyMyNzcyN0InfSxcclxuICAgICAgICAgICAgZW1waGFzaXMgOiB7IGNvbG9yIDogJyMyNzcyN0InfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3ltYm9sIDogJ2VtcHR5Q2lyY2xlJyxcclxuICAgICAgICBzeW1ib2xTaXplIDogM1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmn7HlvaLlm77pu5jorqTlj4LmlbBcclxuICAgIGJhcjoge1xyXG4gICAgICAgIGl0ZW1TdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpczoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOaKmOe6v+Wbvum7mOiupOWPguaVsFxyXG4gICAgbGluZToge1xyXG4gICAgICAgIGl0ZW1TdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOjIsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjonI2ZmZicsXHJcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogM1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpczoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6MFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeW1ib2w6ICdjaXJjbGUnLCAgLy8g5ouQ54K55Zu+5b2i57G75Z6LXHJcbiAgICAgICAgc3ltYm9sU2l6ZTogMy41ICAgICAgICAgICAvLyDmi5Dngrnlm77lvaLlpKflsI9cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIEvnur/lm77pu5jorqTlj4LmlbBcclxuICAgIGs6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNDMTIzMkInLCAgICAgICAvLyDpmLPnur/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGNvbG9yMDogJyNCNUMzMzQnLCAgICAgIC8vIOmYtOe6v+Whq+WFheminOiJslxyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjQzEyMzJCJywgICAvLyDpmLPnur/ovrnmoYbpopzoibJcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjA6ICcjQjVDMzM0JyAgIC8vIOmYtOe6v+i+ueahhuminOiJslxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8g5pWj54K55Zu+6buY6K6k5Y+C5pWwXHJcbiAgICBzY2F0dGVyOiB7XHJcbiAgICAgICAgaXRlbWRTdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOjEsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjoncmdiYSgyMDAsMjAwLDIwMCwwLjUpJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpczoge1xyXG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6MFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeW1ib2w6ICdzdGFyNCcsICAgIC8vIOWbvuW9ouexu+Wei1xyXG4gICAgICAgIHN5bWJvbFNpemU6IDQgICAgICAgIC8vIOWbvuW9ouWkp+Wwj++8jOWNiuWuve+8iOWNiuW+hO+8ieWPguaVsO+8jOW9k+WbvuW9ouS4uuaWueWQkeaIluiPseW9ouWImeaAu+WuveW6puS4unN5bWJvbFNpemUgKiAyXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOmbt+i+vuWbvum7mOiupOWPguaVsFxyXG4gICAgcmFkYXIgOiB7XHJcbiAgICAgICAgc3ltYm9sOiAnZW1wdHlDaXJjbGUnLCAgICAvLyDlm77lvaLnsbvlnotcclxuICAgICAgICBzeW1ib2xTaXplOjNcclxuICAgICAgICAvL3N5bWJvbDogbnVsbCwgICAgICAgICAvLyDmi5Dngrnlm77lvaLnsbvlnotcclxuICAgICAgICAvL3N5bWJvbFJvdGF0ZSA6IG51bGwsICAvLyDlm77lvaLml4vovazmjqfliLZcclxuICAgIH0sXHJcblxyXG4gICAgbWFwOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgYXJlYVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZGRkJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGxhYmVsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI0MxMjMyQidcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzOiB7ICAgICAgICAgICAgICAgICAvLyDkuZ/mmK/pgInkuK3moLflvI9cclxuICAgICAgICAgICAgICAgIGFyZWFTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2ZlOTk0ZSdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3JnYigxMDAsMCwwKSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmb3JjZSA6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBsaW5rU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3IgOiAnIzI3NzI3QidcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY2hvcmQgOiB7XHJcbiAgICAgICAgcGFkZGluZyA6IDQsXHJcbiAgICAgICAgaXRlbVN0eWxlIDoge1xyXG4gICAgICAgICAgICBub3JtYWwgOiB7XHJcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjaG9yZFN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuNSknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpcyA6IHtcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNob3JkU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdhdWdlIDoge1xyXG4gICAgICAgIGNlbnRlcjpbJzUwJScsJzgwJSddLFxyXG4gICAgICAgIHJhZGl1czonMTAwJScsXHJcbiAgICAgICAgc3RhcnRBbmdsZTogMTgwLFxyXG4gICAgICAgIGVuZEFuZ2xlIDogMCxcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBzaG93OiB0cnVlLCAgICAgICAgLy8g6buY6K6k5pi+56S677yM5bGe5oCnc2hvd+aOp+WItuaYvuekuuS4juWQplxyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogW1swLjIsICcjQjVDMzM0J10sWzAuOCwgJyMyNzcyN0InXSxbMSwgJyNDMTIzMkInXV0sIFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6ICc0MCUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNUaWNrOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L205bCP5qCH6K6wXHJcbiAgICAgICAgICAgIHNwbGl0TnVtYmVyOiAyLCAgIC8vIOavj+S7vXNwbGl057uG5YiG5aSa5bCR5q61XHJcbiAgICAgICAgICAgIGxlbmd0aDogNSwgICAgICAgIC8vIOWxnuaAp2xlbmd0aOaOp+WItue6v+mVv1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNMYWJlbDogeyAgICAgICAgICAgLy8g5Z2Q5qCH6L205paH5pys5qCH562+77yM6K+m6KeBYXhpcy5heGlzTGFiZWxcclxuICAgICAgICAgICAgdGV4dFN0eWxlOiB7ICAgICAgIC8vIOWFtuS9meWxnuaAp+m7mOiupOS9v+eUqOWFqOWxgOaWh+acrOagt+W8j++8jOivpuingVRFWFRTVFlMRVxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjZmZmJyxcclxuICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6J2JvbGRlcidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgbGVuZ3RoOiAnNSUnLCAgICAgICAgIC8vIOWxnuaAp2xlbmd0aOaOp+WItue6v+mVv1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl77yI6K+m6KeBbGluZVN0eWxl77yJ5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBvaW50ZXIgOiB7XHJcbiAgICAgICAgICAgIHdpZHRoIDogJzQwJScsXHJcbiAgICAgICAgICAgIGxlbmd0aDogJzgwJScsXHJcbiAgICAgICAgICAgIGNvbG9yOiAnI2ZmZidcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRpdGxlIDoge1xyXG4gICAgICAgICAgb2Zmc2V0Q2VudGVyOiBbMCwgLTIwXSwgICAgICAgLy8geCwgee+8jOWNleS9jXB4XHJcbiAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgIGNvbG9yOiAnYXV0bycsXHJcbiAgICAgICAgICAgIGZvbnRTaXplOiAyMFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGV0YWlsIDoge1xyXG4gICAgICAgICAgICBvZmZzZXRDZW50ZXI6IFswLCAwMF0sICAgICAgIC8vIHgsIHnvvIzljZXkvY1weFxyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nLFxyXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IDQwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICBmb250RmFtaWx5OiAn5b6u6L2v6ZuF6buRLCBBcmlhbCwgVmVyZGFuYSwgc2Fucy1zZXJpZidcclxuICAgIH1cclxufVxyXG5cclxuICAgIHJldHVybiB0aGVtZTtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL2VjaGFydHMvdGhlbWUvaW5mb2dyYXBoaWMuanMifQ==
