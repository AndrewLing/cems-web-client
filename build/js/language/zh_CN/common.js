define({
    "systemName": "充电桩运营管理系统",
    "subSystemName": "iCleanPower",

    info: "提示",
    "sure": "确定",
    "second": "秒",
    "confirm": "确认",
    "cancel": "取消",
    "close": "关闭",
    "save": "保存",
    "reset": "重置",
    "all": "全部",
    "search": "查询",

    "language": {
        "zh_CN": "中文(简体)",
        "en_US": "English(US)",
        "en_UK": "English(UK)",
        "ja_JP": "日本語"
    },

    "validator": {
        "required": "不能为空",
        "requiredFormat": "{0}不能为空",
        "remote": "请修复这个字段",
        "email": "无效邮箱地址",
        "url": "无效URL。",
        "date": "无效日期。",
        "dateISO": "请输入合法的( ISO )格式日期",
        "number": "请输入数字",
        "digits": "请输入整数",
        "creditcard": "请输入合法的信用卡号",
        "equalTo": "两次密码不一致，请重新输入",
        "maxlength": "不能超过{0}个字符",
        "minlength": "至少输入{0}个字符",
        "rangelength": "输入在{0} ～ {1}个字符之间",
        "range": "请输入一个值在 {0} ～ {1}之间",
        "max": "请输入不大于{0}的数值",
        "min": "请输入不小于{0}的数值",
        "space": "前后不能有空格",
        "mobile": "手机号码格式错误",
        "phone": "电话号码格式错误",
        "tel": "号码格式错误",
        "zip": "邮政编码格式错误",
        "currency": "货币格式不正确",
        "qq": "qq号码格式错误",
        "age": "年龄必须是0到120之间的整数",
        "idcard": "请正确输入您的身份证号码",
        "ip": "IP地址格式错误",
        "uploadFile": "上传文件",
        "perNumCheck": "请输入(0,100]之间的数据，小数点不超过{0}位",
        "stringCheck": "只能包括中文字、英文字母、日文、数字和下划线组成的非特殊字符",
        "devNameCheck": "{0}不能含有< ' > & \" , | null",
        "signsCheck": "不能输入逗号",
        "PSNameCheck": "电站名称首尾的引号不能相同",
        "port": "端口号应为0-65535之间的整数",
        "positiveInt": "请输入正整数",
        "vacSepecialString": "不能包含< ' > & / , | null等特殊字符",
        "specialChars": "不能含有< ' > & \" , \\ / | { } null等特殊字符",
        "valNumberCheck": "请输入数字",
        "lt": "请输入小于{0}的数值",
        "le": "请输入小于或等于{0}的数值",
        "gt": "请输入大于{0}的数值",
        "ge": "请输入大于或等于{0}的数值"
    },

    "ajax": {
        "gatewayTimeout": "网络异常，您与服务器的连接可能已经断开，请稍候尝试重新载入页面",
        "connectError": "连接服务器出现异常，请检查服务器",
        "badgateway": "连接服务器出现异常，请检查服务器",
        "error": "服务器异常，请检查服务器",
        "noRight": [
            "没有权限",
            "对不起，您没有访问的地址 ",
            " 的权限！"
        ],
        "noFound": [
            "链接不存在",
            "对不起，您访问的地址 ",
            " 不存在！"
        ]
    },

    "unit": {
        "topPowerUnit": "kW·h",
        "powerUnit": "万kW·h",
        "KWh": "kWh",
        "WKWh": "万kWh",
        "KW": "kW",
        "MW": "MW",
        "GW": "GW",
        "GWh": "GWh",
        "co2Unit": "t",
        "coalUnit": "t",
        "treeUnit": "m³",
        "co2WUnit": "万t",
        "coalWUnit": "万t",
        "treeWUnit": "万m³",
        "tree_unit": "棵",
        "wtree_unit": "万棵",
        "curRadiantUnit": "kW·h/m²",
        "radiantUnit": "W/m²",
        "powerCapacityUnit": "kW",
        "temperatureUnit": "℃",
        "lngLatUnit": "°",
        "speedUnit": "m/s",
        "degree": "度",
        "TInsolation": "MJ/㎡",
        "Irradiance": "W/㎡",
        "installCapacityUnit": "MW",
        "powerRate": "%",
        "times": "次",
        "productPowerUnit": "kWh",
        "unit_ton": "吨",
        "currentUnit": "A",
        "voltageUnit": "V",
        "percentUnit": "%",
        "WUnit": "W",
        "kWUnit": "kW",
        "WhUnit": "Wh",
        "kWhUnit": "kWh",
        "VarUnit": "Var",
        "kVarUnit": "kVar",
        "kVarhUnit": "kVarh",
        "kVAUnit": "kVA",
        "HzUnit": "Hz",
        "MΩUnit": "MΩ",
        "NA": "无",
        "timeDem": [
            "年",
            "月",
            "日",
            "周",
            "h",
            "m",
            "s",
            "时",
            "分",
            "秒"
        ],
        "numberUnit": [
            "个",
            "十",
            "百",
            "千",
            "万",
            "十万",
            "百万",
            "千万",
            "亿",
            "十亿",
            "百亿",
            "千亿",
            "兆",
            "十兆",
            "百兆",
            "千兆"
        ],
        "geographicAzimuth": [
            "北（N）",
            "北东北（NNE）",
            "东北（NE）",
            "东东北（ENE）",
            "东（E）",
            "东东南（ESE）",
            "东南（SE）",
            "南东南（SSE）",
            "南（S）",
            "南西南（SSW）",
            "西南（SW）",
            "西西南（WSW）",
            "西（W）",
            "西西北（WNW）",
            "西北（NW）",
            "北西北（NNW）"
        ],
        "dateLimit": [
            "去年",
            "当年",
            "明年",
            "上月",
            "当月",
            "下月",
            "昨日",
            "当日",
            "明日",
            "累计"
        ],
        "brackets": [
            "（",
            "）"
        ],
        "colon": "：",
        "stationUnit": "座",
        "inverterUnit": "台",
        "stringUnit": "个",
        "RMBUnit": "元",
        "WRMBUnit": "万元",
        "KRMBUnit": "千元",
        "KWUnit": "KW",
        "WKWUnit": "万KW",
        "houseUnit": "户",
        "alarmUnit": "条",
        "personUnit": "人"
    },

    "dateFormat": {
        "yyyymmddhhss": "yyyy-MM-dd HH:mm:ss",
        "yyyymmdd": "yyyy-MM-dd",
        "yyyymm": "yyyy-MM",
        "yyyy": "yyyy",
        "MMdd": "MM-dd",
        "yyyyddmm": "yyyy-MM-dd"
    },

    "map": {
        "zoomsTitle": [
            "放大",
            "缩小"
        ],
        "mapType": [
            "2D地图",
            "卫星地图"
        ]
    },
    "gridParam": {
        "pageShowCount": "每页显示：",
        "displayMsg": "共{0}条记录",
        "emptyMsg": "没有相关记录",
        "procMsg": "正在加载...",
        "beforePageText": "第",
        "afterPageText": "页 / 共",
        "jumpTo": "跳到第",
        "mPageText": "页",
        "noData": "该页无数据，将跳转到第一页",
        "systemName": "系统帐号",
        "userName": "用户名",
        "systemCount": "系统用户",
        "normalCount": "普通用户"
    }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsYW5ndWFnZS96aF9DTi9jb21tb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKHtcbiAgICBcInN5c3RlbU5hbWVcIjogXCLlhYXnlLXmoanov5DokKXnrqHnkIbns7vnu59cIixcbiAgICBcInN1YlN5c3RlbU5hbWVcIjogXCJpQ2xlYW5Qb3dlclwiLFxuXG4gICAgaW5mbzogXCLmj5DnpLpcIixcbiAgICBcInN1cmVcIjogXCLnoa7lrppcIixcbiAgICBcInNlY29uZFwiOiBcIuenklwiLFxuICAgIFwiY29uZmlybVwiOiBcIuehruiupFwiLFxuICAgIFwiY2FuY2VsXCI6IFwi5Y+W5raIXCIsXG4gICAgXCJjbG9zZVwiOiBcIuWFs+mXrVwiLFxuICAgIFwic2F2ZVwiOiBcIuS/neWtmFwiLFxuICAgIFwicmVzZXRcIjogXCLph43nva5cIixcbiAgICBcImFsbFwiOiBcIuWFqOmDqFwiLFxuICAgIFwic2VhcmNoXCI6IFwi5p+l6K+iXCIsXG5cbiAgICBcImxhbmd1YWdlXCI6IHtcbiAgICAgICAgXCJ6aF9DTlwiOiBcIuS4reaWhyjnroDkvZMpXCIsXG4gICAgICAgIFwiZW5fVVNcIjogXCJFbmdsaXNoKFVTKVwiLFxuICAgICAgICBcImVuX1VLXCI6IFwiRW5nbGlzaChVSylcIixcbiAgICAgICAgXCJqYV9KUFwiOiBcIuaXpeacrOiqnlwiXG4gICAgfSxcblxuICAgIFwidmFsaWRhdG9yXCI6IHtcbiAgICAgICAgXCJyZXF1aXJlZFwiOiBcIuS4jeiDveS4uuepulwiLFxuICAgICAgICBcInJlcXVpcmVkRm9ybWF0XCI6IFwiezB95LiN6IO95Li656m6XCIsXG4gICAgICAgIFwicmVtb3RlXCI6IFwi6K+35L+u5aSN6L+Z5Liq5a2X5q61XCIsXG4gICAgICAgIFwiZW1haWxcIjogXCLml6DmlYjpgq7nrrHlnLDlnYBcIixcbiAgICAgICAgXCJ1cmxcIjogXCLml6DmlYhVUkzjgIJcIixcbiAgICAgICAgXCJkYXRlXCI6IFwi5peg5pWI5pel5pyf44CCXCIsXG4gICAgICAgIFwiZGF0ZUlTT1wiOiBcIuivt+i+k+WFpeWQiOazleeahCggSVNPICnmoLzlvI/ml6XmnJ9cIixcbiAgICAgICAgXCJudW1iZXJcIjogXCLor7fovpPlhaXmlbDlrZdcIixcbiAgICAgICAgXCJkaWdpdHNcIjogXCLor7fovpPlhaXmlbTmlbBcIixcbiAgICAgICAgXCJjcmVkaXRjYXJkXCI6IFwi6K+36L6T5YWl5ZCI5rOV55qE5L+h55So5Y2h5Y+3XCIsXG4gICAgICAgIFwiZXF1YWxUb1wiOiBcIuS4pOasoeWvhueggeS4jeS4gOiHtO+8jOivt+mHjeaWsOi+k+WFpVwiLFxuICAgICAgICBcIm1heGxlbmd0aFwiOiBcIuS4jeiDvei2hei/h3swfeS4quWtl+esplwiLFxuICAgICAgICBcIm1pbmxlbmd0aFwiOiBcIuiHs+Wwkei+k+WFpXswfeS4quWtl+esplwiLFxuICAgICAgICBcInJhbmdlbGVuZ3RoXCI6IFwi6L6T5YWl5ZyoezB9IO+9niB7MX3kuKrlrZfnrKbkuYvpl7RcIixcbiAgICAgICAgXCJyYW5nZVwiOiBcIuivt+i+k+WFpeS4gOS4quWAvOWcqCB7MH0g772eIHsxfeS5i+mXtFwiLFxuICAgICAgICBcIm1heFwiOiBcIuivt+i+k+WFpeS4jeWkp+S6jnswfeeahOaVsOWAvFwiLFxuICAgICAgICBcIm1pblwiOiBcIuivt+i+k+WFpeS4jeWwj+S6jnswfeeahOaVsOWAvFwiLFxuICAgICAgICBcInNwYWNlXCI6IFwi5YmN5ZCO5LiN6IO95pyJ56m65qC8XCIsXG4gICAgICAgIFwibW9iaWxlXCI6IFwi5omL5py65Y+356CB5qC85byP6ZSZ6K+vXCIsXG4gICAgICAgIFwicGhvbmVcIjogXCLnlLXor53lj7fnoIHmoLzlvI/plJnor69cIixcbiAgICAgICAgXCJ0ZWxcIjogXCLlj7fnoIHmoLzlvI/plJnor69cIixcbiAgICAgICAgXCJ6aXBcIjogXCLpgq7mlL/nvJbnoIHmoLzlvI/plJnor69cIixcbiAgICAgICAgXCJjdXJyZW5jeVwiOiBcIui0p+W4geagvOW8j+S4jeato+ehrlwiLFxuICAgICAgICBcInFxXCI6IFwicXHlj7fnoIHmoLzlvI/plJnor69cIixcbiAgICAgICAgXCJhZ2VcIjogXCLlubTpvoTlv4XpobvmmK8w5YiwMTIw5LmL6Ze055qE5pW05pWwXCIsXG4gICAgICAgIFwiaWRjYXJkXCI6IFwi6K+35q2j56Gu6L6T5YWl5oKo55qE6Lqr5Lu96K+B5Y+356CBXCIsXG4gICAgICAgIFwiaXBcIjogXCJJUOWcsOWdgOagvOW8j+mUmeivr1wiLFxuICAgICAgICBcInVwbG9hZEZpbGVcIjogXCLkuIrkvKDmlofku7ZcIixcbiAgICAgICAgXCJwZXJOdW1DaGVja1wiOiBcIuivt+i+k+WFpSgwLDEwMF3kuYvpl7TnmoTmlbDmja7vvIzlsI/mlbDngrnkuI3otoXov4d7MH3kvY1cIixcbiAgICAgICAgXCJzdHJpbmdDaGVja1wiOiBcIuWPquiDveWMheaLrOS4reaWh+Wtl+OAgeiLseaWh+Wtl+avjeOAgeaXpeaWh+OAgeaVsOWtl+WSjOS4i+WIkue6v+e7hOaIkOeahOmdnueJueauiuWtl+esplwiLFxuICAgICAgICBcImRldk5hbWVDaGVja1wiOiBcInswfeS4jeiDveWQq+aciTwgJyA+ICYgXFxcIiAsIHwgbnVsbFwiLFxuICAgICAgICBcInNpZ25zQ2hlY2tcIjogXCLkuI3og73ovpPlhaXpgJflj7dcIixcbiAgICAgICAgXCJQU05hbWVDaGVja1wiOiBcIueUteermeWQjeensOmmluWwvueahOW8leWPt+S4jeiDveebuOWQjFwiLFxuICAgICAgICBcInBvcnRcIjogXCLnq6/lj6Plj7flupTkuLowLTY1NTM15LmL6Ze055qE5pW05pWwXCIsXG4gICAgICAgIFwicG9zaXRpdmVJbnRcIjogXCLor7fovpPlhaXmraPmlbTmlbBcIixcbiAgICAgICAgXCJ2YWNTZXBlY2lhbFN0cmluZ1wiOiBcIuS4jeiDveWMheWQqzwgJyA+ICYgLyAsIHwgbnVsbOetieeJueauiuWtl+esplwiLFxuICAgICAgICBcInNwZWNpYWxDaGFyc1wiOiBcIuS4jeiDveWQq+aciTwgJyA+ICYgXFxcIiAsIFxcXFwgLyB8IHsgfSBudWxs562J54m55q6K5a2X56ymXCIsXG4gICAgICAgIFwidmFsTnVtYmVyQ2hlY2tcIjogXCLor7fovpPlhaXmlbDlrZdcIixcbiAgICAgICAgXCJsdFwiOiBcIuivt+i+k+WFpeWwj+S6jnswfeeahOaVsOWAvFwiLFxuICAgICAgICBcImxlXCI6IFwi6K+36L6T5YWl5bCP5LqO5oiW562J5LqOezB955qE5pWw5YC8XCIsXG4gICAgICAgIFwiZ3RcIjogXCLor7fovpPlhaXlpKfkuo57MH3nmoTmlbDlgLxcIixcbiAgICAgICAgXCJnZVwiOiBcIuivt+i+k+WFpeWkp+S6juaIluetieS6jnswfeeahOaVsOWAvFwiXG4gICAgfSxcblxuICAgIFwiYWpheFwiOiB7XG4gICAgICAgIFwiZ2F0ZXdheVRpbWVvdXRcIjogXCLnvZHnu5zlvILluLjvvIzmgqjkuI7mnI3liqHlmajnmoTov57mjqXlj6/og73lt7Lnu4/mlq3lvIDvvIzor7fnqI3lgJnlsJ3or5Xph43mlrDovb3lhaXpobXpnaJcIixcbiAgICAgICAgXCJjb25uZWN0RXJyb3JcIjogXCLov57mjqXmnI3liqHlmajlh7rnjrDlvILluLjvvIzor7fmo4Dmn6XmnI3liqHlmahcIixcbiAgICAgICAgXCJiYWRnYXRld2F5XCI6IFwi6L+e5o6l5pyN5Yqh5Zmo5Ye6546w5byC5bi477yM6K+35qOA5p+l5pyN5Yqh5ZmoXCIsXG4gICAgICAgIFwiZXJyb3JcIjogXCLmnI3liqHlmajlvILluLjvvIzor7fmo4Dmn6XmnI3liqHlmahcIixcbiAgICAgICAgXCJub1JpZ2h0XCI6IFtcbiAgICAgICAgICAgIFwi5rKh5pyJ5p2D6ZmQXCIsXG4gICAgICAgICAgICBcIuWvueS4jei1t++8jOaCqOayoeacieiuv+mXrueahOWcsOWdgCBcIixcbiAgICAgICAgICAgIFwiIOeahOadg+mZkO+8gVwiXG4gICAgICAgIF0sXG4gICAgICAgIFwibm9Gb3VuZFwiOiBbXG4gICAgICAgICAgICBcIumTvuaOpeS4jeWtmOWcqFwiLFxuICAgICAgICAgICAgXCLlr7nkuI3otbfvvIzmgqjorr/pl67nmoTlnLDlnYAgXCIsXG4gICAgICAgICAgICBcIiDkuI3lrZjlnKjvvIFcIlxuICAgICAgICBdXG4gICAgfSxcblxuICAgIFwidW5pdFwiOiB7XG4gICAgICAgIFwidG9wUG93ZXJVbml0XCI6IFwia1fCt2hcIixcbiAgICAgICAgXCJwb3dlclVuaXRcIjogXCLkuIdrV8K3aFwiLFxuICAgICAgICBcIktXaFwiOiBcImtXaFwiLFxuICAgICAgICBcIldLV2hcIjogXCLkuIdrV2hcIixcbiAgICAgICAgXCJLV1wiOiBcImtXXCIsXG4gICAgICAgIFwiTVdcIjogXCJNV1wiLFxuICAgICAgICBcIkdXXCI6IFwiR1dcIixcbiAgICAgICAgXCJHV2hcIjogXCJHV2hcIixcbiAgICAgICAgXCJjbzJVbml0XCI6IFwidFwiLFxuICAgICAgICBcImNvYWxVbml0XCI6IFwidFwiLFxuICAgICAgICBcInRyZWVVbml0XCI6IFwibcKzXCIsXG4gICAgICAgIFwiY28yV1VuaXRcIjogXCLkuId0XCIsXG4gICAgICAgIFwiY29hbFdVbml0XCI6IFwi5LiHdFwiLFxuICAgICAgICBcInRyZWVXVW5pdFwiOiBcIuS4h23Cs1wiLFxuICAgICAgICBcInRyZWVfdW5pdFwiOiBcIuajtVwiLFxuICAgICAgICBcInd0cmVlX3VuaXRcIjogXCLkuIfmo7VcIixcbiAgICAgICAgXCJjdXJSYWRpYW50VW5pdFwiOiBcImtXwrdoL23CslwiLFxuICAgICAgICBcInJhZGlhbnRVbml0XCI6IFwiVy9twrJcIixcbiAgICAgICAgXCJwb3dlckNhcGFjaXR5VW5pdFwiOiBcImtXXCIsXG4gICAgICAgIFwidGVtcGVyYXR1cmVVbml0XCI6IFwi4oSDXCIsXG4gICAgICAgIFwibG5nTGF0VW5pdFwiOiBcIsKwXCIsXG4gICAgICAgIFwic3BlZWRVbml0XCI6IFwibS9zXCIsXG4gICAgICAgIFwiZGVncmVlXCI6IFwi5bqmXCIsXG4gICAgICAgIFwiVEluc29sYXRpb25cIjogXCJNSi/jjqFcIixcbiAgICAgICAgXCJJcnJhZGlhbmNlXCI6IFwiVy/jjqFcIixcbiAgICAgICAgXCJpbnN0YWxsQ2FwYWNpdHlVbml0XCI6IFwiTVdcIixcbiAgICAgICAgXCJwb3dlclJhdGVcIjogXCIlXCIsXG4gICAgICAgIFwidGltZXNcIjogXCLmrKFcIixcbiAgICAgICAgXCJwcm9kdWN0UG93ZXJVbml0XCI6IFwia1doXCIsXG4gICAgICAgIFwidW5pdF90b25cIjogXCLlkKhcIixcbiAgICAgICAgXCJjdXJyZW50VW5pdFwiOiBcIkFcIixcbiAgICAgICAgXCJ2b2x0YWdlVW5pdFwiOiBcIlZcIixcbiAgICAgICAgXCJwZXJjZW50VW5pdFwiOiBcIiVcIixcbiAgICAgICAgXCJXVW5pdFwiOiBcIldcIixcbiAgICAgICAgXCJrV1VuaXRcIjogXCJrV1wiLFxuICAgICAgICBcIldoVW5pdFwiOiBcIldoXCIsXG4gICAgICAgIFwia1doVW5pdFwiOiBcImtXaFwiLFxuICAgICAgICBcIlZhclVuaXRcIjogXCJWYXJcIixcbiAgICAgICAgXCJrVmFyVW5pdFwiOiBcImtWYXJcIixcbiAgICAgICAgXCJrVmFyaFVuaXRcIjogXCJrVmFyaFwiLFxuICAgICAgICBcImtWQVVuaXRcIjogXCJrVkFcIixcbiAgICAgICAgXCJIelVuaXRcIjogXCJIelwiLFxuICAgICAgICBcIk3OqVVuaXRcIjogXCJNzqlcIixcbiAgICAgICAgXCJOQVwiOiBcIuaXoFwiLFxuICAgICAgICBcInRpbWVEZW1cIjogW1xuICAgICAgICAgICAgXCLlubRcIixcbiAgICAgICAgICAgIFwi5pyIXCIsXG4gICAgICAgICAgICBcIuaXpVwiLFxuICAgICAgICAgICAgXCLlkahcIixcbiAgICAgICAgICAgIFwiaFwiLFxuICAgICAgICAgICAgXCJtXCIsXG4gICAgICAgICAgICBcInNcIixcbiAgICAgICAgICAgIFwi5pe2XCIsXG4gICAgICAgICAgICBcIuWIhlwiLFxuICAgICAgICAgICAgXCLnp5JcIlxuICAgICAgICBdLFxuICAgICAgICBcIm51bWJlclVuaXRcIjogW1xuICAgICAgICAgICAgXCLkuKpcIixcbiAgICAgICAgICAgIFwi5Y2BXCIsXG4gICAgICAgICAgICBcIueZvlwiLFxuICAgICAgICAgICAgXCLljYNcIixcbiAgICAgICAgICAgIFwi5LiHXCIsXG4gICAgICAgICAgICBcIuWNgeS4h1wiLFxuICAgICAgICAgICAgXCLnmb7kuIdcIixcbiAgICAgICAgICAgIFwi5Y2D5LiHXCIsXG4gICAgICAgICAgICBcIuS6v1wiLFxuICAgICAgICAgICAgXCLljYHkur9cIixcbiAgICAgICAgICAgIFwi55m+5Lq/XCIsXG4gICAgICAgICAgICBcIuWNg+S6v1wiLFxuICAgICAgICAgICAgXCLlhYZcIixcbiAgICAgICAgICAgIFwi5Y2B5YWGXCIsXG4gICAgICAgICAgICBcIueZvuWFhlwiLFxuICAgICAgICAgICAgXCLljYPlhYZcIlxuICAgICAgICBdLFxuICAgICAgICBcImdlb2dyYXBoaWNBemltdXRoXCI6IFtcbiAgICAgICAgICAgIFwi5YyX77yITu+8iVwiLFxuICAgICAgICAgICAgXCLljJfkuJzljJfvvIhOTkXvvIlcIixcbiAgICAgICAgICAgIFwi5Lic5YyX77yITkXvvIlcIixcbiAgICAgICAgICAgIFwi5Lic5Lic5YyX77yIRU5F77yJXCIsXG4gICAgICAgICAgICBcIuS4nO+8iEXvvIlcIixcbiAgICAgICAgICAgIFwi5Lic5Lic5Y2X77yIRVNF77yJXCIsXG4gICAgICAgICAgICBcIuS4nOWNl++8iFNF77yJXCIsXG4gICAgICAgICAgICBcIuWNl+S4nOWNl++8iFNTRe+8iVwiLFxuICAgICAgICAgICAgXCLljZfvvIhT77yJXCIsXG4gICAgICAgICAgICBcIuWNl+ilv+WNl++8iFNTV++8iVwiLFxuICAgICAgICAgICAgXCLopb/ljZfvvIhTV++8iVwiLFxuICAgICAgICAgICAgXCLopb/opb/ljZfvvIhXU1fvvIlcIixcbiAgICAgICAgICAgIFwi6KW/77yIV++8iVwiLFxuICAgICAgICAgICAgXCLopb/opb/ljJfvvIhXTlfvvIlcIixcbiAgICAgICAgICAgIFwi6KW/5YyX77yITlfvvIlcIixcbiAgICAgICAgICAgIFwi5YyX6KW/5YyX77yITk5X77yJXCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJkYXRlTGltaXRcIjogW1xuICAgICAgICAgICAgXCLljrvlubRcIixcbiAgICAgICAgICAgIFwi5b2T5bm0XCIsXG4gICAgICAgICAgICBcIuaYjuW5tFwiLFxuICAgICAgICAgICAgXCLkuIrmnIhcIixcbiAgICAgICAgICAgIFwi5b2T5pyIXCIsXG4gICAgICAgICAgICBcIuS4i+aciFwiLFxuICAgICAgICAgICAgXCLmmKjml6VcIixcbiAgICAgICAgICAgIFwi5b2T5pelXCIsXG4gICAgICAgICAgICBcIuaYjuaXpVwiLFxuICAgICAgICAgICAgXCLntK/orqFcIlxuICAgICAgICBdLFxuICAgICAgICBcImJyYWNrZXRzXCI6IFtcbiAgICAgICAgICAgIFwi77yIXCIsXG4gICAgICAgICAgICBcIu+8iVwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiY29sb25cIjogXCLvvJpcIixcbiAgICAgICAgXCJzdGF0aW9uVW5pdFwiOiBcIuW6p1wiLFxuICAgICAgICBcImludmVydGVyVW5pdFwiOiBcIuWPsFwiLFxuICAgICAgICBcInN0cmluZ1VuaXRcIjogXCLkuKpcIixcbiAgICAgICAgXCJSTUJVbml0XCI6IFwi5YWDXCIsXG4gICAgICAgIFwiV1JNQlVuaXRcIjogXCLkuIflhYNcIixcbiAgICAgICAgXCJLUk1CVW5pdFwiOiBcIuWNg+WFg1wiLFxuICAgICAgICBcIktXVW5pdFwiOiBcIktXXCIsXG4gICAgICAgIFwiV0tXVW5pdFwiOiBcIuS4h0tXXCIsXG4gICAgICAgIFwiaG91c2VVbml0XCI6IFwi5oi3XCIsXG4gICAgICAgIFwiYWxhcm1Vbml0XCI6IFwi5p2hXCIsXG4gICAgICAgIFwicGVyc29uVW5pdFwiOiBcIuS6ulwiXG4gICAgfSxcblxuICAgIFwiZGF0ZUZvcm1hdFwiOiB7XG4gICAgICAgIFwieXl5eW1tZGRoaHNzXCI6IFwieXl5eS1NTS1kZCBISDptbTpzc1wiLFxuICAgICAgICBcInl5eXltbWRkXCI6IFwieXl5eS1NTS1kZFwiLFxuICAgICAgICBcInl5eXltbVwiOiBcInl5eXktTU1cIixcbiAgICAgICAgXCJ5eXl5XCI6IFwieXl5eVwiLFxuICAgICAgICBcIk1NZGRcIjogXCJNTS1kZFwiLFxuICAgICAgICBcInl5eXlkZG1tXCI6IFwieXl5eS1NTS1kZFwiXG4gICAgfSxcblxuICAgIFwibWFwXCI6IHtcbiAgICAgICAgXCJ6b29tc1RpdGxlXCI6IFtcbiAgICAgICAgICAgIFwi5pS+5aSnXCIsXG4gICAgICAgICAgICBcIue8qeWwj1wiXG4gICAgICAgIF0sXG4gICAgICAgIFwibWFwVHlwZVwiOiBbXG4gICAgICAgICAgICBcIjJE5Zyw5Zu+XCIsXG4gICAgICAgICAgICBcIuWNq+aYn+WcsOWbvlwiXG4gICAgICAgIF1cbiAgICB9LFxuICAgIFwiZ3JpZFBhcmFtXCI6IHtcbiAgICAgICAgXCJwYWdlU2hvd0NvdW50XCI6IFwi5q+P6aG15pi+56S677yaXCIsXG4gICAgICAgIFwiZGlzcGxheU1zZ1wiOiBcIuWFsXswfeadoeiusOW9lVwiLFxuICAgICAgICBcImVtcHR5TXNnXCI6IFwi5rKh5pyJ55u45YWz6K6w5b2VXCIsXG4gICAgICAgIFwicHJvY01zZ1wiOiBcIuato+WcqOWKoOi9vS4uLlwiLFxuICAgICAgICBcImJlZm9yZVBhZ2VUZXh0XCI6IFwi56ysXCIsXG4gICAgICAgIFwiYWZ0ZXJQYWdlVGV4dFwiOiBcIumhtSAvIOWFsVwiLFxuICAgICAgICBcImp1bXBUb1wiOiBcIui3s+WIsOesrFwiLFxuICAgICAgICBcIm1QYWdlVGV4dFwiOiBcIumhtVwiLFxuICAgICAgICBcIm5vRGF0YVwiOiBcIuivpemhteaXoOaVsOaNru+8jOWwhui3s+i9rOWIsOesrOS4gOmhtVwiLFxuICAgICAgICBcInN5c3RlbU5hbWVcIjogXCLns7vnu5/luJDlj7dcIixcbiAgICAgICAgXCJ1c2VyTmFtZVwiOiBcIueUqOaIt+WQjVwiLFxuICAgICAgICBcInN5c3RlbUNvdW50XCI6IFwi57O757uf55So5oi3XCIsXG4gICAgICAgIFwibm9ybWFsQ291bnRcIjogXCLmma7pgJrnlKjmiLdcIlxuICAgIH1cbn0pOyJdLCJmaWxlIjoibGFuZ3VhZ2UvemhfQ04vY29tbW9uLmpzIn0=