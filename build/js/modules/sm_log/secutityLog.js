'use strict';
App.Module.config({
    package: '/main',
    moduleName: 'sm_log_secutityLog',
    description: '模块功能：日志管理:安全日志',
    importList: ['jquery', 'bootstrap', 'easyTabs', 'ValidateForm', 'datePicker', 'GridTable']
});
App.Module('sm_log_secutityLog', function () {
    return {
        Render: function (params) {
            $(function () {
                var securityGetQueryData = null;
                $("#secutityLogSearchBar").ValidateForm('secutityLogSearchBar', {
                        show: 'horizontal',
                        fnSubmit: submit,
                        fnGetData: fnGetData,
                        model: [
                            [
                                {
                                    input: 'select',
                                    type: 'select',
                                    show: '安全影响',
                                    options: [{text: Msg.all, value: ""}, {
                                        text: '成功',
                                        value: "SUCCESS"
                                    }, {text: '失败', value: "FAIL"}],
                                    name: 'securityLog_result',
                                    extend: {id: 'securityLog_result', readonly: 'readonly'}
                                },
                                {
                                    input: 'input',
                                    type: 'text',
                                    show: '时间段:',
                                    name: 'securityLog_start',
                                    width: 160,
                                    extend: {class: 'Wdate', readonly: 'readonly', id: 'securityLog_start'},
                                    fnClick: securityLogDateStart
                                },
                                {
                                    input: 'input',
                                    type: 'text',
                                    show: '至',
                                    name: 'securityLog_end',
                                    width: 160,
                                    extend: {class: 'Wdate', readonly: 'readonly', id: 'securityLog_end'},
                                    fnClick: securityLogDateEnd
                                }
                            ]
                        ]
                    }
                );

                //时间控件(起始时间)
                function securityLogDateStart(selector) {
                    DatePicker({
                        dateFmt: 'yyyy-MM-dd HH:mm:ss',
                        maxDate: $("#securityLog_end").val(),
                        isShowClear: true
                    });
                }

                //时间控件(结束时间)
                function securityLogDateEnd(selector) {
                    DatePicker({
                        dateFmt: 'yyyy-MM-dd HH:mm:ss',
                        minDate: $("#securityLog_start").val(),
                        isShowClear: true
                    });
                }

                //表格
                $('#secutity_logTable').GridTable({
                    url: 'log/querySecutityLog',
                    params: {
                        logType: "security",
                        sortOrder: "desc",
                        stime: $("#securityLog_start").val(),
                        etime: $("#securityLog_end").val(),
                        result: $("#securityLog_result").val()
                    },
                    title: false,
                    max_height: '575',
                    colModel: [
                        {
                            display: '用户名',
                            name: 'userName',
                            width: 0.1,
                            sortable: false,
                            align: 'center'
                        },
                        {
                            display: '安全动作',
                            name: 'userAction',
                            width: 0.15,
                            sortable: false,
                            align: 'center'
                        },
                        {
                            display: '安全影响',
                            name: 'sercurityCase',
                            width: 0.1,
                            sortable: true,
                            align: 'center',
                            fnInit: formatResult
                        },
                        {
                            display: '影响用户',
                            name: 'affectedUser',
                            width: 0.1,
                            sortable: false,
                            align: 'center'
                        },
                        {
                            display: '详细',
                            name: 'details',
                            width: 0.2,
                            sortable: false,
                            align: 'center'
                        },
                        {
                            display: '终端IP',
                            name: 'loginIp',
                            width: 0.15,
                            sortable: false,
                            align: 'center'
                        },
                        {
                            display: '时间',
                            name: 'occureDate',
                            width: 0.2,
                            sortable: true,
                            align: 'center',
                            fnInit: formatDate
                        }
                    ]
                });
                function formatDate(dom, pid) {
                    var longTime = $.trim($(dom).text());
                    var time = longTime && Date.parse(longTime).format('yyyy-MM-dd hh:mm:ss').replace(/-/g, '-');
                    $(dom).parent().attr("title",time);
                    $(dom).html(time);
                }

                function formatResult(dom, pid) {
                    var result = $(dom).text();
                    if (result.indexOf("SUCCESS") >= 0 || result.indexOf("success") >= 0) {
                        $(dom).parent().attr("title", '成功');
                        $(dom).html("<font color='green'>" + '成功' + "</font>");
                    } else {
                        $(dom).parent().attr("title", '失败');
                        $(dom).html("<font color='red'>" + '失败' + "</font>");
                    }
                }

                //相应查询按钮
                function submit() {
                    var result = $("#securityLog_result").val();
                    var stime = $("#securityLog_start").val();
                    var etime = $("#securityLog_end").val();
                    securityGetQueryData = {
                        stime: stime,
                        etime: etime,
                        logType: "security",
                        sortOrder: "desc",
                        result: result
                    };
                    $('#secutity_logTable').GridTableSearch({
                        params: securityGetQueryData
                    });
                };

                function fnGetData() {

                }
                //导出安全日志
                $("#sm_securityLog_export").click(function () {
                    window.open("log/exportSecutityLog?logType=security&sortOrder=desc&stime=" + securityGetQueryData.stime + "&etime=" + securityGetQueryData.etime + "&result=" + securityGetQueryData.result, "_parent")
                });
            });
        },


    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtb2R1bGVzL3NtX2xvZy9zZWN1dGl0eUxvZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcbkFwcC5Nb2R1bGUuY29uZmlnKHtcclxuICAgIHBhY2thZ2U6ICcvbWFpbicsXHJcbiAgICBtb2R1bGVOYW1lOiAnc21fbG9nX3NlY3V0aXR5TG9nJyxcclxuICAgIGRlc2NyaXB0aW9uOiAn5qih5Z2X5Yqf6IO977ya5pel5b+X566h55CGOuWuieWFqOaXpeW/lycsXHJcbiAgICBpbXBvcnRMaXN0OiBbJ2pxdWVyeScsICdib290c3RyYXAnLCAnZWFzeVRhYnMnLCAnVmFsaWRhdGVGb3JtJywgJ2RhdGVQaWNrZXInLCAnR3JpZFRhYmxlJ11cclxufSk7XHJcbkFwcC5Nb2R1bGUoJ3NtX2xvZ19zZWN1dGl0eUxvZycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgUmVuZGVyOiBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgICAgICQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlY3VyaXR5R2V0UXVlcnlEYXRhID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICQoXCIjc2VjdXRpdHlMb2dTZWFyY2hCYXJcIikuVmFsaWRhdGVGb3JtKCdzZWN1dGl0eUxvZ1NlYXJjaEJhcicsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdzogJ2hvcml6b250YWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmblN1Ym1pdDogc3VibWl0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbkdldERhdGE6IGZuR2V0RGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnc2VsZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3NlbGVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6ICflronlhajlvbHlk40nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBbe3RleHQ6IE1zZy5hbGwsIHZhbHVlOiBcIlwifSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ+aIkOWKnycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogXCJTVUNDRVNTXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge3RleHQ6ICflpLHotKUnLCB2YWx1ZTogXCJGQUlMXCJ9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3NlY3VyaXR5TG9nX3Jlc3VsdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZDoge2lkOiAnc2VjdXJpdHlMb2dfcmVzdWx0JywgcmVhZG9ubHk6ICdyZWFkb25seSd9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnaW5wdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6ICfml7bpl7TmrrU6JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3NlY3VyaXR5TG9nX3N0YXJ0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDE2MCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kOiB7Y2xhc3M6ICdXZGF0ZScsIHJlYWRvbmx5OiAncmVhZG9ubHknLCBpZDogJ3NlY3VyaXR5TG9nX3N0YXJ0J30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuQ2xpY2s6IHNlY3VyaXR5TG9nRGF0ZVN0YXJ0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiAnaW5wdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6ICfoh7MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnc2VjdXJpdHlMb2dfZW5kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDE2MCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kOiB7Y2xhc3M6ICdXZGF0ZScsIHJlYWRvbmx5OiAncmVhZG9ubHknLCBpZDogJ3NlY3VyaXR5TG9nX2VuZCd9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbkNsaWNrOiBzZWN1cml0eUxvZ0RhdGVFbmRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v5pe26Ze05o6n5Lu2KOi1t+Wni+aXtumXtClcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHNlY3VyaXR5TG9nRGF0ZVN0YXJ0KHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgRGF0ZVBpY2tlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVGbXQ6ICd5eXl5LU1NLWRkIEhIOm1tOnNzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4RGF0ZTogJChcIiNzZWN1cml0eUxvZ19lbmRcIikudmFsKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzU2hvd0NsZWFyOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy/ml7bpl7Tmjqfku7Yo57uT5p2f5pe26Ze0KVxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gc2VjdXJpdHlMb2dEYXRlRW5kKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgRGF0ZVBpY2tlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVGbXQ6ICd5eXl5LU1NLWRkIEhIOm1tOnNzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluRGF0ZTogJChcIiNzZWN1cml0eUxvZ19zdGFydFwiKS52YWwoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNTaG93Q2xlYXI6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL+ihqOagvFxyXG4gICAgICAgICAgICAgICAgJCgnI3NlY3V0aXR5X2xvZ1RhYmxlJykuR3JpZFRhYmxlKHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6ICdsb2cvcXVlcnlTZWN1dGl0eUxvZycsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ1R5cGU6IFwic2VjdXJpdHlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyOiBcImRlc2NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RpbWU6ICQoXCIjc2VjdXJpdHlMb2dfc3RhcnRcIikudmFsKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV0aW1lOiAkKFwiI3NlY3VyaXR5TG9nX2VuZFwiKS52YWwoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiAkKFwiI3NlY3VyaXR5TG9nX3Jlc3VsdFwiKS52YWwoKVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heF9oZWlnaHQ6ICc1NzUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbE1vZGVsOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICfnlKjmiLflkI0nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3VzZXJOYW1lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAwLjEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbjogJ2NlbnRlcidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ+WuieWFqOWKqOS9nCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAndXNlckFjdGlvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMC4xNSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiAnY2VudGVyJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAn5a6J5YWo5b2x5ZONJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdzZXJjdXJpdHlDYXNlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAwLjEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuSW5pdDogZm9ybWF0UmVzdWx0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICflvbHlk43nlKjmiLcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2FmZmVjdGVkVXNlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMC4xLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ydGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdjZW50ZXInXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICfor6bnu4YnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RldGFpbHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDAuMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduOiAnY2VudGVyJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAn57uI56uvSVAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2xvZ2luSXAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDAuMTUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbjogJ2NlbnRlcidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ+aXtumXtCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnb2NjdXJlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMC4yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ydGFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbkluaXQ6IGZvcm1hdERhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZm9ybWF0RGF0ZShkb20sIHBpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb25nVGltZSA9ICQudHJpbSgkKGRvbSkudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGltZSA9IGxvbmdUaW1lICYmIERhdGUucGFyc2UobG9uZ1RpbWUpLmZvcm1hdCgneXl5eS1NTS1kZCBoaDptbTpzcycpLnJlcGxhY2UoLy0vZywgJy0nKTtcclxuICAgICAgICAgICAgICAgICAgICAkKGRvbSkucGFyZW50KCkuYXR0cihcInRpdGxlXCIsdGltZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb20pLmh0bWwodGltZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZm9ybWF0UmVzdWx0KGRvbSwgcGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICQoZG9tKS50ZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5pbmRleE9mKFwiU1VDQ0VTU1wiKSA+PSAwIHx8IHJlc3VsdC5pbmRleE9mKFwic3VjY2Vzc1wiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZG9tKS5wYXJlbnQoKS5hdHRyKFwidGl0bGVcIiwgJ+aIkOWKnycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGRvbSkuaHRtbChcIjxmb250IGNvbG9yPSdncmVlbic+XCIgKyAn5oiQ5YqfJyArIFwiPC9mb250PlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGRvbSkucGFyZW50KCkuYXR0cihcInRpdGxlXCIsICflpLHotKUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChkb20pLmh0bWwoXCI8Zm9udCBjb2xvcj0ncmVkJz5cIiArICflpLHotKUnICsgXCI8L2ZvbnQ+XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL+ebuOW6lOafpeivouaMiemSrlxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gc3VibWl0KCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAkKFwiI3NlY3VyaXR5TG9nX3Jlc3VsdFwiKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RpbWUgPSAkKFwiI3NlY3VyaXR5TG9nX3N0YXJ0XCIpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBldGltZSA9ICQoXCIjc2VjdXJpdHlMb2dfZW5kXCIpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5R2V0UXVlcnlEYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGltZTogc3RpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV0aW1lOiBldGltZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nVHlwZTogXCJzZWN1cml0eVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IFwiZGVzY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3NlY3V0aXR5X2xvZ1RhYmxlJykuR3JpZFRhYmxlU2VhcmNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBzZWN1cml0eUdldFF1ZXJ5RGF0YVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBmbkdldERhdGEoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy/lr7zlh7rlronlhajml6Xlv5dcclxuICAgICAgICAgICAgICAgICQoXCIjc21fc2VjdXJpdHlMb2dfZXhwb3J0XCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub3BlbihcImxvZy9leHBvcnRTZWN1dGl0eUxvZz9sb2dUeXBlPXNlY3VyaXR5JnNvcnRPcmRlcj1kZXNjJnN0aW1lPVwiICsgc2VjdXJpdHlHZXRRdWVyeURhdGEuc3RpbWUgKyBcIiZldGltZT1cIiArIHNlY3VyaXR5R2V0UXVlcnlEYXRhLmV0aW1lICsgXCImcmVzdWx0PVwiICsgc2VjdXJpdHlHZXRRdWVyeURhdGEucmVzdWx0LCBcIl9wYXJlbnRcIilcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICB9O1xyXG59KTsiXSwiZmlsZSI6Im1vZHVsZXMvc21fbG9nL3NlY3V0aXR5TG9nLmpzIn0=
