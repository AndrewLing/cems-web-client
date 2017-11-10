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