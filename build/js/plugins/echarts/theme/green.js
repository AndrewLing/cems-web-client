define(function() {

var theme = {
    // 默认色板
    color: [
        '#408829','#68a54a','#a9cba2','#86b379',
        '#397b29','#8abb6f','#759c6a','#bfd3b7'
    ],

    // 图表标题
    title: {
        itemGap: 8,
        textStyle: {
            fontWeight: 'normal',
            color: '#408829'
        }
    },
    
    // 值域
    dataRange: {
        color:['#1f610a','#97b58d']
    },

    // 工具箱
    toolbox: {
        color : ['#408829','#408829','#408829','#408829']
    },

    // 提示框
    tooltip: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'line',         // 默认为直线，可选为：'line' | 'shadow'
            lineStyle : {          // 直线指示器样式设置
                color: '#408829',
                type: 'dashed'
            },
            crossStyle: {
                color: '#408829'
            },
            shadowStyle : {                     // 阴影指示器样式设置
                color: 'rgba(200,200,200,0.3)'
            }
        }
    },

    // 区域缩放控制器
    dataZoom: {
        dataBackgroundColor: '#eee',            // 数据背景颜色
        fillerColor: 'rgba(64,136,41,0.2)',   // 填充颜色
        handleColor: '#408829'     // 手柄颜色
    },
    
    grid: {
        borderWidth: 0
    },

    // 类目轴
    categoryAxis: {
        axisLine: {            // 坐标轴线
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#408829'
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
                color: '#408829'
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
            color : '#408829'
        },
        controlStyle : {
            normal : { color : '#408829'},
            emphasis : { color : '#408829'}
        }
    },

    // K线图默认参数
    k: {
        itemStyle: {
            normal: {
                color: '#68a54a',          // 阳线填充颜色
                color0: '#a9cba2',      // 阴线填充颜色
                lineStyle: {
                    width: 1,
                    color: '#408829',   // 阳线边框颜色
                    color0: '#86b379'   // 阴线边框颜色
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
                    strokeColor : '#408829'
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
                color: [[0.2, '#86b379'],[0.8, '#68a54a'],[1, '#408829']], 
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvdGhlbWUvZ3JlZW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKGZ1bmN0aW9uKCkge1xyXG5cclxudmFyIHRoZW1lID0ge1xyXG4gICAgLy8g6buY6K6k6Imy5p2/XHJcbiAgICBjb2xvcjogW1xyXG4gICAgICAgICcjNDA4ODI5JywnIzY4YTU0YScsJyNhOWNiYTInLCcjODZiMzc5JyxcclxuICAgICAgICAnIzM5N2IyOScsJyM4YWJiNmYnLCcjNzU5YzZhJywnI2JmZDNiNydcclxuICAgIF0sXHJcblxyXG4gICAgLy8g5Zu+6KGo5qCH6aKYXHJcbiAgICB0aXRsZToge1xyXG4gICAgICAgIGl0ZW1HYXA6IDgsXHJcbiAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgICAgICAgICBjb2xvcjogJyM0MDg4MjknXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8g5YC85Z+fXHJcbiAgICBkYXRhUmFuZ2U6IHtcclxuICAgICAgICBjb2xvcjpbJyMxZjYxMGEnLCcjOTdiNThkJ11cclxuICAgIH0sXHJcblxyXG4gICAgLy8g5bel5YW3566xXHJcbiAgICB0b29sYm94OiB7XHJcbiAgICAgICAgY29sb3IgOiBbJyM0MDg4MjknLCcjNDA4ODI5JywnIzQwODgyOScsJyM0MDg4MjknXVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmj5DnpLrmoYZcclxuICAgIHRvb2x0aXA6IHtcclxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDAsMCwwLDAuNSknLFxyXG4gICAgICAgIGF4aXNQb2ludGVyIDogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOaMh+ekuuWZqO+8jOWdkOagh+i9tOinpuWPkeacieaViFxyXG4gICAgICAgICAgICB0eXBlIDogJ2xpbmUnLCAgICAgICAgIC8vIOm7mOiupOS4uuebtOe6v++8jOWPr+mAieS4uu+8midsaW5lJyB8ICdzaGFkb3cnXHJcbiAgICAgICAgICAgIGxpbmVTdHlsZSA6IHsgICAgICAgICAgLy8g55u057q/5oyH56S65Zmo5qC35byP6K6+572uXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyM0MDg4MjknLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Rhc2hlZCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY3Jvc3NTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjNDA4ODI5J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTdHlsZSA6IHsgICAgICAgICAgICAgICAgICAgICAvLyDpmLTlvbHmjIfnpLrlmajmoLflvI/orr7nva5cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAncmdiYSgyMDAsMjAwLDIwMCwwLjMpJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDljLrln5/nvKnmlL7mjqfliLblmahcclxuICAgIGRhdGFab29tOiB7XHJcbiAgICAgICAgZGF0YUJhY2tncm91bmRDb2xvcjogJyNlZWUnLCAgICAgICAgICAgIC8vIOaVsOaNruiDjOaZr+minOiJslxyXG4gICAgICAgIGZpbGxlckNvbG9yOiAncmdiYSg2NCwxMzYsNDEsMC4yKScsICAgLy8g5aGr5YWF6aKc6ImyXHJcbiAgICAgICAgaGFuZGxlQ29sb3I6ICcjNDA4ODI5JyAgICAgLy8g5omL5p+E6aKc6ImyXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBncmlkOiB7XHJcbiAgICAgICAgYm9yZGVyV2lkdGg6IDBcclxuICAgIH0sXHJcblxyXG4gICAgLy8g57G755uu6L20XHJcbiAgICBjYXRlZ29yeUF4aXM6IHtcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyM0MDg4MjknXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXvvIjor6bop4FsaW5lU3R5bGXvvInmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJyNlZWUnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmlbDlgLzlnovlnZDmoIfovbTpu5jorqTlj4LmlbBcclxuICAgIHZhbHVlQXhpczoge1xyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzQwODgyOSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRBcmVhIDoge1xyXG4gICAgICAgICAgICBzaG93IDogdHJ1ZSxcclxuICAgICAgICAgICAgYXJlYVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsncmdiYSgyNTAsMjUwLDI1MCwwLjEpJywncmdiYSgyMDAsMjAwLDIwMCwwLjEpJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZe+8iOivpuingWxpbmVTdHlsZe+8ieaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsnI2VlZSddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRpbWVsaW5lIDoge1xyXG4gICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgY29sb3IgOiAnIzQwODgyOSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbnRyb2xTdHlsZSA6IHtcclxuICAgICAgICAgICAgbm9ybWFsIDogeyBjb2xvciA6ICcjNDA4ODI5J30sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzIDogeyBjb2xvciA6ICcjNDA4ODI5J31cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEvnur/lm77pu5jorqTlj4LmlbBcclxuICAgIGs6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyM2OGE1NGEnLCAgICAgICAgICAvLyDpmLPnur/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGNvbG9yMDogJyNhOWNiYTInLCAgICAgIC8vIOmYtOe6v+Whq+WFheminOiJslxyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjNDA4ODI5JywgICAvLyDpmLPnur/ovrnmoYbpopzoibJcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjA6ICcjODZiMzc5JyAgIC8vIOmYtOe6v+i+ueahhuminOiJslxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbWFwOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgYXJlYVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZGRkJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGxhYmVsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2MxMmUzNCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzOiB7ICAgICAgICAgICAgICAgICAvLyDkuZ/mmK/pgInkuK3moLflvI9cclxuICAgICAgICAgICAgICAgIGFyZWFTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzk5ZDJkZCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjMTJlMzQnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZm9yY2UgOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgbGlua1N0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yIDogJyM0MDg4MjknXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBjaG9yZCA6IHtcclxuICAgICAgICBwYWRkaW5nIDogNCxcclxuICAgICAgICBpdGVtU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbCA6IHtcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNob3JkU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzIDoge1xyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuNSknXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2hvcmRTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIGdhdWdlIDoge1xyXG4gICAgICAgIHN0YXJ0QW5nbGU6IDIyNSxcclxuICAgICAgICBlbmRBbmdsZSA6IC00NSxcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBzaG93OiB0cnVlLCAgICAgICAgLy8g6buY6K6k5pi+56S677yM5bGe5oCnc2hvd+aOp+WItuaYvuekuuS4juWQplxyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogW1swLjIsICcjODZiMzc5J10sWzAuOCwgJyM2OGE1NGEnXSxbMSwgJyM0MDg4MjknXV0sIFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDhcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXhpc1RpY2s6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTlsI/moIforrBcclxuICAgICAgICAgICAgc3BsaXROdW1iZXI6IDEwLCAgIC8vIOavj+S7vXNwbGl057uG5YiG5aSa5bCR5q61XHJcbiAgICAgICAgICAgIGxlbmd0aCA6MTIsICAgICAgICAvLyDlsZ7mgKdsZW5ndGjmjqfliLbnur/plb9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZeaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBheGlzTGFiZWw6IHsgICAgICAgICAgIC8vIOWdkOagh+i9tOaWh+acrOagh+etvu+8jOivpuingWF4aXMuYXhpc0xhYmVsXHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgbGVuZ3RoIDogMTgsICAgICAgICAgLy8g5bGe5oCnbGVuZ3Ro5o6n5Yi257q/6ZW/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXvvIjor6bop4FsaW5lU3R5bGXvvInmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcG9pbnRlciA6IHtcclxuICAgICAgICAgICAgbGVuZ3RoIDogJzkwJScsXHJcbiAgICAgICAgICAgIGNvbG9yIDogJ2F1dG8nXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aXRsZSA6IHtcclxuICAgICAgICAgICAgdGV4dFN0eWxlOiB7ICAgICAgIC8vIOWFtuS9meWxnuaAp+m7mOiupOS9v+eUqOWFqOWxgOaWh+acrOagt+W8j++8jOivpuingVRFWFRTVFlMRVxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjMzMzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXRhaWwgOiB7XHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgIGZvbnRGYW1pbHk6ICflvq7ova/pm4Xpu5EsIEFyaWFsLCBWZXJkYW5hLCBzYW5zLXNlcmlmJ1xyXG4gICAgfVxyXG59XHJcblxyXG4gICAgcmV0dXJuIHRoZW1lO1xyXG59KTsiXSwiZmlsZSI6InBsdWdpbnMvZWNoYXJ0cy90aGVtZS9ncmVlbi5qcyJ9
