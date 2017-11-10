define(function() {

var theme = {
    // 默认色板
    color: [
        '#c12e34','#e6b600','#0098d9','#2b821d',
        '#005eaa','#339ca8','#cda819','#32a487'
    ],

    // 图表标题
    title: {
        itemGap: 8,
        textStyle: {
            fontWeight: 'normal'
        }
    },
    
    // 图例
    legend: {
        itemGap: 8
    },
    
    // 值域
    dataRange: {
        itemWidth: 15,             // 值域图形宽度，线性渐变水平布局宽度为该值 * 10
        color:['#1790cf','#a2d4e6']
    },

    // 工具箱
    toolbox: {
        color : ['#06467c','#00613c','#872d2f','#c47630'],
        itemGap: 8
    },

    // 提示框
    tooltip: {
        backgroundColor: 'rgba(0,0,0,0.6)'
    },

    // 区域缩放控制器
    dataZoom: {
        dataBackgroundColor: '#dedede',            // 数据背景颜色
        fillerColor: 'rgba(154,217,247,0.2)',   // 填充颜色
        handleColor: '#005eaa'     // 手柄颜色
    },
    
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
        splitArea: {           // 分隔区域
            show: true,       // 默认不显示，属性show控制显示与否
            areaStyle: {       // 属性areaStyle（详见areaStyle）控制区域样式
                color: ['rgba(250,250,250,0.2)','rgba(200,200,200,0.2)']
            }
        }
    },
    
    timeline : {
        lineStyle : {
            color : '#005eaa'
        },
        controlStyle : {
            normal : { color : '#005eaa'},
            emphasis : { color : '#005eaa'}
        }
    },

    // K线图默认参数
    k: {
        itemStyle: {
            normal: {
                color: '#c12e34',          // 阳线填充颜色
                color0: '#2b821d',      // 阴线填充颜色
                lineStyle: {
                    width: 1,
                    color: '#c12e34',   // 阳线边框颜色
                    color0: '#2b821d'   // 阴线边框颜色
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
                    color: '#e6b600'
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
                    strokeColor : '#005eaa'
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
                color: [[0.2, '#2b821d'],[0.8, '#005eaa'],[1, '#c12e34']], 
                width: 5
            }
        },
        axisTick: {            // 坐标轴小标记
            splitNumber: 10,   // 每份split细分多少段
            length :8,        // 属性length控制线长
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
            length : 12,         // 属性length控制线长
            lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                color: 'auto'
            }
        },
        pointer : {
            length : '90%',
            width : 3,
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2VjaGFydHMvdGhlbWUvc2hpbmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKGZ1bmN0aW9uKCkge1xyXG5cclxudmFyIHRoZW1lID0ge1xyXG4gICAgLy8g6buY6K6k6Imy5p2/XHJcbiAgICBjb2xvcjogW1xyXG4gICAgICAgICcjYzEyZTM0JywnI2U2YjYwMCcsJyMwMDk4ZDknLCcjMmI4MjFkJyxcclxuICAgICAgICAnIzAwNWVhYScsJyMzMzljYTgnLCcjY2RhODE5JywnIzMyYTQ4NydcclxuICAgIF0sXHJcblxyXG4gICAgLy8g5Zu+6KGo5qCH6aKYXHJcbiAgICB0aXRsZToge1xyXG4gICAgICAgIGl0ZW1HYXA6IDgsXHJcbiAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdub3JtYWwnXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8g5Zu+5L6LXHJcbiAgICBsZWdlbmQ6IHtcclxuICAgICAgICBpdGVtR2FwOiA4XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvLyDlgLzln59cclxuICAgIGRhdGFSYW5nZToge1xyXG4gICAgICAgIGl0ZW1XaWR0aDogMTUsICAgICAgICAgICAgIC8vIOWAvOWfn+WbvuW9ouWuveW6pu+8jOe6v+aAp+a4kOWPmOawtOW5s+W4g+WxgOWuveW6puS4uuivpeWAvCAqIDEwXHJcbiAgICAgICAgY29sb3I6WycjMTc5MGNmJywnI2EyZDRlNiddXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOW3peWFt+eusVxyXG4gICAgdG9vbGJveDoge1xyXG4gICAgICAgIGNvbG9yIDogWycjMDY0NjdjJywnIzAwNjEzYycsJyM4NzJkMmYnLCcjYzQ3NjMwJ10sXHJcbiAgICAgICAgaXRlbUdhcDogOFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyDmj5DnpLrmoYZcclxuICAgIHRvb2x0aXA6IHtcclxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDAsMCwwLDAuNiknXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIOWMuuWfn+e8qeaUvuaOp+WItuWZqFxyXG4gICAgZGF0YVpvb206IHtcclxuICAgICAgICBkYXRhQmFja2dyb3VuZENvbG9yOiAnI2RlZGVkZScsICAgICAgICAgICAgLy8g5pWw5o2u6IOM5pmv6aKc6ImyXHJcbiAgICAgICAgZmlsbGVyQ29sb3I6ICdyZ2JhKDE1NCwyMTcsMjQ3LDAuMiknLCAgIC8vIOWhq+WFheminOiJslxyXG4gICAgICAgIGhhbmRsZUNvbG9yOiAnIzAwNWVhYScgICAgIC8vIOaJi+afhOminOiJslxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ3JpZDoge1xyXG4gICAgICAgIGJvcmRlcldpZHRoOiAwXHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvLyDnsbvnm67ovbRcclxuICAgIGNhdGVnb3J5QXhpczoge1xyXG4gICAgICAgIGF4aXNMaW5lOiB7ICAgICAgICAgICAgLy8g5Z2Q5qCH6L2057q/XHJcbiAgICAgICAgICAgIHNob3c6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBheGlzVGljazogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOWwj+agh+iusFxyXG4gICAgICAgICAgICBzaG93OiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8g5pWw5YC85Z6L5Z2Q5qCH6L206buY6K6k5Y+C5pWwXHJcbiAgICB2YWx1ZUF4aXM6IHtcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBzaG93OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXhpc1RpY2s6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTlsI/moIforrBcclxuICAgICAgICAgICAgc2hvdzogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNwbGl0QXJlYTogeyAgICAgICAgICAgLy8g5YiG6ZqU5Yy65Z+fXHJcbiAgICAgICAgICAgIHNob3c6IHRydWUsICAgICAgIC8vIOm7mOiupOS4jeaYvuekuu+8jOWxnuaAp3Nob3fmjqfliLbmmL7npLrkuI7lkKZcclxuICAgICAgICAgICAgYXJlYVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2FyZWFTdHlsZe+8iOivpuingWFyZWFTdHlsZe+8ieaOp+WItuWMuuWfn+agt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6IFsncmdiYSgyNTAsMjUwLDI1MCwwLjIpJywncmdiYSgyMDAsMjAwLDIwMCwwLjIpJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIHRpbWVsaW5lIDoge1xyXG4gICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgY29sb3IgOiAnIzAwNWVhYSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbnRyb2xTdHlsZSA6IHtcclxuICAgICAgICAgICAgbm9ybWFsIDogeyBjb2xvciA6ICcjMDA1ZWFhJ30sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzIDogeyBjb2xvciA6ICcjMDA1ZWFhJ31cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEvnur/lm77pu5jorqTlj4LmlbBcclxuICAgIGs6IHtcclxuICAgICAgICBpdGVtU3R5bGU6IHtcclxuICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJyNjMTJlMzQnLCAgICAgICAgICAvLyDpmLPnur/loavlhYXpopzoibJcclxuICAgICAgICAgICAgICAgIGNvbG9yMDogJyMyYjgyMWQnLCAgICAgIC8vIOmYtOe6v+Whq+WFheminOiJslxyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjYzEyZTM0JywgICAvLyDpmLPnur/ovrnmoYbpopzoibJcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjA6ICcjMmI4MjFkJyAgIC8vIOmYtOe6v+i+ueahhuminOiJslxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbWFwOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgYXJlYVN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICcjZGRkJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGxhYmVsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2MxMmUzNCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzOiB7ICAgICAgICAgICAgICAgICAvLyDkuZ/mmK/pgInkuK3moLflvI9cclxuICAgICAgICAgICAgICAgIGFyZWFTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2U2YjYwMCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsYWJlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyNjMTJlMzQnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZm9yY2UgOiB7XHJcbiAgICAgICAgaXRlbVN0eWxlOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgbGlua1N0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yIDogJyMwMDVlYWEnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBjaG9yZCA6IHtcclxuICAgICAgICBwYWRkaW5nIDogNCxcclxuICAgICAgICBpdGVtU3R5bGUgOiB7XHJcbiAgICAgICAgICAgIG5vcm1hbCA6IHtcclxuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNob3JkU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIDogJ3JnYmEoMTI4LCAxMjgsIDEyOCwgMC41KSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtcGhhc2lzIDoge1xyXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvciA6ICdyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuNSknXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2hvcmRTdHlsZSA6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lU3R5bGUgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoIDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgOiAncmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIGdhdWdlIDoge1xyXG4gICAgICAgIHN0YXJ0QW5nbGU6IDIyNSxcclxuICAgICAgICBlbmRBbmdsZSA6IC00NSxcclxuICAgICAgICBheGlzTGluZTogeyAgICAgICAgICAgIC8vIOWdkOagh+i9tOe6v1xyXG4gICAgICAgICAgICBzaG93OiB0cnVlLCAgICAgICAgLy8g6buY6K6k5pi+56S677yM5bGe5oCnc2hvd+aOp+WItuaYvuekuuS4juWQplxyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogW1swLjIsICcjMmI4MjFkJ10sWzAuOCwgJyMwMDVlYWEnXSxbMSwgJyNjMTJlMzQnXV0sIFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXhpc1RpY2s6IHsgICAgICAgICAgICAvLyDlnZDmoIfovbTlsI/moIforrBcclxuICAgICAgICAgICAgc3BsaXROdW1iZXI6IDEwLCAgIC8vIOavj+S7vXNwbGl057uG5YiG5aSa5bCR5q61XHJcbiAgICAgICAgICAgIGxlbmd0aCA6OCwgICAgICAgIC8vIOWxnuaAp2xlbmd0aOaOp+WItue6v+mVv1xyXG4gICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF4aXNMYWJlbDogeyAgICAgICAgICAgLy8g5Z2Q5qCH6L205paH5pys5qCH562+77yM6K+m6KeBYXhpcy5heGlzTGFiZWxcclxuICAgICAgICAgICAgdGV4dFN0eWxlOiB7ICAgICAgIC8vIOWFtuS9meWxnuaAp+m7mOiupOS9v+eUqOWFqOWxgOaWh+acrOagt+W8j++8jOivpuingVRFWFRTVFlMRVxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzcGxpdExpbmU6IHsgICAgICAgICAgIC8vIOWIhumalOe6v1xyXG4gICAgICAgICAgICBsZW5ndGggOiAxMiwgICAgICAgICAvLyDlsZ7mgKdsZW5ndGjmjqfliLbnur/plb9cclxuICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZe+8iOivpuingWxpbmVTdHlsZe+8ieaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgY29sb3I6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwb2ludGVyIDoge1xyXG4gICAgICAgICAgICBsZW5ndGggOiAnOTAlJyxcclxuICAgICAgICAgICAgd2lkdGggOiAzLFxyXG4gICAgICAgICAgICBjb2xvciA6ICdhdXRvJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGl0bGUgOiB7XHJcbiAgICAgICAgICAgIHRleHRTdHlsZTogeyAgICAgICAvLyDlhbbkvZnlsZ7mgKfpu5jorqTkvb/nlKjlhajlsYDmlofmnKzmoLflvI/vvIzor6bop4FURVhUU1RZTEVcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzMzMydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGV0YWlsIDoge1xyXG4gICAgICAgICAgICB0ZXh0U3R5bGU6IHsgICAgICAgLy8g5YW25L2Z5bGe5oCn6buY6K6k5L2/55So5YWo5bGA5paH5pys5qC35byP77yM6K+m6KeBVEVYVFNUWUxFXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB0ZXh0U3R5bGU6IHtcclxuICAgICAgICBmb250RmFtaWx5OiAn5b6u6L2v6ZuF6buRLCBBcmlhbCwgVmVyZGFuYSwgc2Fucy1zZXJpZidcclxuICAgIH1cclxufVxyXG5cclxuICAgIHJldHVybiB0aGVtZTtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL2VjaGFydHMvdGhlbWUvc2hpbmUuanMifQ==
