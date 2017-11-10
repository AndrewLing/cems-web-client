/**
 * 模拟数据生成器（MockData）
 *
 * 使用方式：
 * <pre>
 * 例如：
 *
 * </pre>
 * Created by PL02053 on 2016/3/10.
 */
define('MockData', ['jquery', 'plugins/mockData/mock-min'], function ($, Mock) {

    Mock.mock('/user/ssoLogin', {
        'name': '@name',
        'age|1-100': 100,
        'color': '@color'
    });
    Mock.mock('/enterpriseInfo/getLogoAndTitle', {
        'name': '@name',
        'age|1-100': 100,
        'color': '@color'
    });

    return {
        config: {
            isMock: true
        }
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL21vY2tEYXRhL01vY2tEYXRhLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiDmqKHmi5/mlbDmja7nlJ/miJDlmajvvIhNb2NrRGF0Ye+8iVxyXG4gKlxyXG4gKiDkvb/nlKjmlrnlvI/vvJpcclxuICogPHByZT5cclxuICog5L6L5aaC77yaXHJcbiAqXHJcbiAqIDwvcHJlPlxyXG4gKiBDcmVhdGVkIGJ5IFBMMDIwNTMgb24gMjAxNi8zLzEwLlxyXG4gKi9cclxuZGVmaW5lKCdNb2NrRGF0YScsIFsnanF1ZXJ5JywgJ3BsdWdpbnMvbW9ja0RhdGEvbW9jay1taW4nXSwgZnVuY3Rpb24gKCQsIE1vY2spIHtcclxuXHJcbiAgICBNb2NrLm1vY2soJy91c2VyL3Nzb0xvZ2luJywge1xyXG4gICAgICAgICduYW1lJzogJ0BuYW1lJyxcclxuICAgICAgICAnYWdlfDEtMTAwJzogMTAwLFxyXG4gICAgICAgICdjb2xvcic6ICdAY29sb3InXHJcbiAgICB9KTtcclxuICAgIE1vY2subW9jaygnL2VudGVycHJpc2VJbmZvL2dldExvZ29BbmRUaXRsZScsIHtcclxuICAgICAgICAnbmFtZSc6ICdAbmFtZScsXHJcbiAgICAgICAgJ2FnZXwxLTEwMCc6IDEwMCxcclxuICAgICAgICAnY29sb3InOiAnQGNvbG9yJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjb25maWc6IHtcclxuICAgICAgICAgICAgaXNNb2NrOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL21vY2tEYXRhL01vY2tEYXRhLmpzIn0=
