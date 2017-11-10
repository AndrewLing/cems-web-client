define(function() {

var theme = {
    // 默认色板
    color: [
        '#d8361b','#f16b4c','#f7b4a9','#d26666',
        '#99311c','#c42703','#d07e75'
    ],

    // 图表标题
    title: {
        itemGap: 8,
        textStyle: {
            fontWeight: 'normal',
            color: '#d8361b'
        }
    },
    
    // 值域
    dataRange: {
        color:['#bd0707','#ffd2d2']
    },

    // 工具箱
    toolbox: {
        color : ['#d8361b','#d8361b','#d8361b','#d8361b']
    },

    // 提示框
    tooltip: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
            type : 'line',         // 默认为直线，可选为：'line' | 'shadow'
            lineStyle : {          // 直线指示器样式设置
                color: '#d8361b',
                type: 'dashed'
            },
            crossStyle: {
                color: '#d8361b'
            },
            shadowStyle : {                     // 阴影指示器样式设置
                color: 'rgba(200,200,200,0.3)'
            }
        }
    },

    // 区域缩放控制器
    dataZoom: {
        dataBackgroundColor: '#eee',            // 数据背景颜色
        fillerColor: 'rgba(216,54,27,0.2)',   // 填充颜色
        handleColor: '#d8361b'     // 手柄颜色
    },
    
    grid: {
        borderWidth: 0
    },

    // 类目轴
    categoryAxis: {
        axisLine: {            // 坐标轴线
            lineStyle: {       // 属性lineStyle控制线条样式
                color: '#d8361b'
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
                color: '#d8361b'
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
            color : '#d8361b'
        },
        controlStyle : {
            normal : { color : '#d8361b'},
            emphasis : { color : '#d8361b'}
        }
    },

    // K线图默认参数
    k: {
        itemStyle: {
            normal: {
                color: '#f16b4c',          // 阳线填充颜色
                color0: '#f7b4a9',      // 阴线填充颜色
                lineStyle: {
                    width: 1,
                    color: '#d8361b',   // 阳线边框颜色
                    color0: '#d26666'   // 阴线边框颜色
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
                    strokeColor : '#d8361b'
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
                color: [[0.2, '#f16b4c'],[0.8, '#d8361b'],[1, '#99311c']], 
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvdGhlbWUvcmVkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShmdW5jdGlvbigpIHtcclxuXHJcbnZhciB0aGVtZSA9IHtcclxuICAgIC8vIOm7mOiupOiJsuadv1xyXG4gICAgY29sb3I6IFtcclxuICAgICAgICAnI2Q4MzYxYicsJyNmMTZiNGMnLCcjZjdiNGE5JywnI2QyNjY2NicsXHJcbiAgICAgICAgJyM5OTMxMWMnLCcjYzQyNzAzJywnI2QwN2U3NSdcclxuICAgIF0sXHJcblxyXG4gICAgLy8g5Zu+6KGo5qCH6aKYXHJcbiAgICB0aXRsZToge1xyXG4gICAgICAgIGl0ZW1HYXA6IDgsXHJcbiAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdub3JtYWwnLFxyXG4gICAgICAgICAgICBjb2xvcjogJyNkODM2MWInXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8g5YC85Z+fXHJcbiAgICBkYXRhUmFuZ2U6IHtcclxuICAgICAgICBjb2xvcjpbJyNiZDA3MDcnLCcjZmZkMmQyJ11cclxuICAgIH0sXHJcblxyXG4gICAgLy8g5bel5YW3566xXHJcbiAgICB0b29sYm94OiB7XHJcbiAgICAgICAgY29sb3IgOiBbJyNkODM2MWInLCcjZDgzNjFiJywnI2Q4MzYxYicsJyNkODM2MWInXVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmj5DnpLrmoYZcclxuICAgIHRvb2x0aXA6IHtcclxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDAsMCwwLDAuNSknLFxyXG4gICAgICAgIGF4aXNQb2ludGVyIDogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOaMh+ekuuWZqO+8jOWdkOagh+i9tOinpuWPkeacieaViFxyXG4gICAgICAgICAgICB0eXBlIDogJ2xpbmUnLCAgICAgICAgIC8vIOm7mOiupOS4uuebtOe6v++8jOWPr+mAieS4uu+8midsaW5lJyB8ICdzaGFkb3cnXHJcbiAgICAgICAgICAgIGxpbmVTdHlsZSA6IHsgICAgICAgICAgLy8g55u057q/5oyH56S65Zmo5qC35byP6K6+572uXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNkODM2MWInLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Rhc2hlZCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY3Jvc3NTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICcjZDgzNjFiJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzaGFkb3dTdHlsZSA6IHsgICAgICAgICAgICAgICAgICAgICAvLyDpmLTlvbHmjIfnpLrlmajmoLflvI/orr7nva5cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAncmdiYSgyMDAsMjAwLDIwMCwwLjMpJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDljLrln5/nvKnmlL7mjqfliLblmahcclxuICAgIGRhdGFab29tOiB7XHJcbiAgICAgICAgZGF0YUJhY2tncm91bmRDb2xvcjogJyNlZWUnLCAgICAgICAgICAgIC8vIOaVsOaNruiDjOaZr+minOiJslxyXG4gICAgICAgIGZpbGxlckNvbG9yOiAncmdiYSgyMTYsNTQsMjcsMC4yKScsICAgLy8g5aGr5YWF6aKc6ImyXHJcbiAgICAgICAgaGFuZGxlQ29sb3I6ICcjZDgzNjFiJyAgICAgLy8g5omL5p+E6aKc6ImyXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBncmlkOiB7XHJcbiAgICAgICAgYm9yZGVyV2lkdGg6IDBcclxuICAgIH0sXHJcblxyXG4gICAgLy8g57G755uu6L20XHJcbiAgICBjYXRlZ29yeUF4aXM6IHtcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNkODM2MWInXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXvvIjor6bop4FsaW5lU3R5bGXvvInmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiBbJyNlZWUnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmlbDlgLzlnovlnZDmoIfovbTpu5jorqTlj4LmlbBcclxuICAgIHZhbHVlQXhpczoge1xyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnI2Q4MzYxYidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRBcmVhIDoge1xyXG4gICAgICAgICAgICBzaG93IDogdHJ1ZSxcclxuICAgICAgICAgICAgYXJlYVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsncmdiYSgyNTAsMjUwLDI1MCwwLjEpJywncmdiYSgyMDAsMjAwLDIwMCwwLjEpJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3BsaXRMaW5lOiB7ICAgICAgICAgICAvLyDliIbpmpTnur9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZe+8iOivpuingWxpbmVTdHlsZe+8ieaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsnI2VlZSddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRpbWVsaW5lIDoge1xyXG4gICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgY29sb3IgOiAnI2Q4MzYxYidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbnRyb2xTdHlsZSA6IHtcclxuICAgICAgICAgICAgbm9ybWFsIDogeyBjb2xvciA6ICcjZDgzNjFiJ30sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzIDogeyBjb2xvciA6ICcjZDgzNjFiJ31cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEvnur/lm77pu5jorqTlj4LmlbBcclxuICAgIGs6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNmMTZiNGMnLCAgICAgICAgICAvLyDpmLPnur/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGNvbG9yMDogJyNmN2I0YTknLCAgICAgIC8vIOmYtOe6v+Whq+WFheminOiJslxyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZDgzNjFiJywgICAvLyDpmLPnur/ovrnmoYbpopzoibJcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjA6ICcjZDI2NjY2JyAgIC8vIOmYtOe6v+i+ueahhuminOiJslxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1hcDoge1xyXG4gICAgICAgIGl0ZW1TdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGFyZWFTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2RkZCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjMTJlMzQnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpczogeyAgICAgICAgICAgICAgICAgLy8g5Lmf5piv6YCJ5Lit5qC35byPXHJcbiAgICAgICAgICAgICAgICBhcmVhU3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyM5OWQyZGQnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjYzEyZTM0J1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZvcmNlIDoge1xyXG4gICAgICAgIGl0ZW1TdHlsZToge1xyXG4gICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgIGxpbmtTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvciA6ICcjZDgzNjFiJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgY2hvcmQgOiB7XHJcbiAgICAgICAgcGFkZGluZyA6IDQsXHJcbiAgICAgICAgaXRlbVN0eWxlIDoge1xyXG4gICAgICAgICAgICBub3JtYWwgOiB7XHJcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjaG9yZFN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuNSknXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbXBoYXNpcyA6IHtcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNob3JkU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBnYXVnZSA6IHtcclxuICAgICAgICBzdGFydEFuZ2xlOiAyMjUsXHJcbiAgICAgICAgZW5kQW5nbGUgOiAtNDUsXHJcbiAgICAgICAgYXhpc0xpbmU6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTnur9cclxuICAgICAgICAgICAgc2hvdzogdHJ1ZSwgICAgICAgIC8vIOm7mOiupOaYvuekuu+8jOWxnuaAp3Nob3fmjqfliLbmmL7npLrkuI7lkKZcclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZeaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFtbMC4yLCAnI2YxNmI0YyddLFswLjgsICcjZDgzNjFiJ10sWzEsICcjOTkzMTFjJ11dLCBcclxuICAgICAgICAgICAgICAgIHdpZHRoOiA4XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNUaWNrOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L205bCP5qCH6K6wXHJcbiAgICAgICAgICAgIHNwbGl0TnVtYmVyOiAxMCwgICAvLyDmr4/ku71zcGxpdOe7huWIhuWkmuWwkeautVxyXG4gICAgICAgICAgICBsZW5ndGggOjEyLCAgICAgICAgLy8g5bGe5oCnbGVuZ3Ro5o6n5Yi257q/6ZW/XHJcbiAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXhpc0xhYmVsOiB7ICAgICAgICAgICAvLyDlnZDmoIfovbTmlofmnKzmoIfnrb7vvIzor6bop4FheGlzLmF4aXNMYWJlbFxyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0TGluZTogeyAgICAgICAgICAgLy8g5YiG6ZqU57q/XHJcbiAgICAgICAgICAgIGxlbmd0aCA6IDE4LCAgICAgICAgIC8vIOWxnuaAp2xlbmd0aOaOp+WItue6v+mVv1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl77yI6K+m6KeBbGluZVN0eWxl77yJ5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHBvaW50ZXIgOiB7XHJcbiAgICAgICAgICAgIGxlbmd0aCA6ICc5MCUnLFxyXG4gICAgICAgICAgICBjb2xvciA6ICdhdXRvJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGl0bGUgOiB7XHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzMzMydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGV0YWlsIDoge1xyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICBmb250RmFtaWx5OiAn5b6u6L2v6ZuF6buRLCBBcmlhbCwgVmVyZGFuYSwgc2Fucy1zZXJpZidcclxuICAgIH1cclxufVxyXG5cclxuICAgIHJldHVybiB0aGVtZTtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL2VjaGFydHMvdGhlbWUvcmVkLmpzIn0=
