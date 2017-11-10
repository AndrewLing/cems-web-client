define(['jquery', 'css!plugins/comboSelect/combo.select.css', 'plugins/comboSelect/jquery.combo.select'], function ($) {
    if ($.fn.iemsComboSelect) {
        return $;
    }

    $.fn.iemsComboSelect = function (option) {
        var $this = $(this);
        var p = $.extend({
            inGridTable: false,
            inDialogForm: false
        }, option);

        var f = {
            _init: function () {
                $this.comboSelect();
                if (p.inGridTable) {
                    f._fitTable();
                }
                if (p.inDialogForm) {
                	f._fitDialog();
                }
            },
            _fitDialog: function(){
            	$this.hide();
            	$this.siblings("input").css("width",$this.css("width"));
            	$this.siblings('ul').hide();
                $this.siblings("input").on("focus", function () {
                    var that = this;
                    var ulTop = $(that).offset().top - $(that).parents(".modal-dialog").offset().top + $(that).parent().height();
                    

//                          var scrollTop =  $(that).parents('div.GridTableBodyDiv').parent().scrollTop();
//                          var trCount = $(that).parents("tbody").find("tr").length;
//                          var curIndex = $(that).parents("tr").index();
                    var screenDis = $(window).height() - $(that).offset().top - $(that).height();
                    if (!$(that).parent().hasClass('combo-open')) {
                        $(that).parent().addClass('combo-open');
                    }
                    if (!$(that).parent().hasClass('combo-focus')) {
                        $(that).parent().addClass('combo-focus');
                    }
                    $(that).siblings("ul").css({
                        "z-index": "20",
                        "width": $(that).css("width")
                    });
                    /*$(that).siblings("ul").css({
                            "position": "fixed",
                            "z-index": "20",
                            "top": ulTop + 'px',
                            "left": 'inherit',
                            "min-width": $(that).css("width"),
                            "bottom": ''
                        });*/
                    $(that).siblings('ul').width($(that).siblings('ul').width()+20);
                    $(that).siblings('ul').show();
                });
            },
            _fitTable: function () {
                $this.siblings('ul').hide();
                $this.siblings("input").on("focus", function () {
                    var that = this;
                    var ulTop = $(that).parent().offset().top + $(that).parent().height();
                    var ulLeft = $(that).parent().offset().left;

//                          var scrollTop =  $(that).parents('div.GridTableBodyDiv').parent().scrollTop();
//                          var trCount = $(that).parents("tbody").find("tr").length;
//                          var curIndex = $(that).parents("tr").index();
                    var screenDis = $(window).height() - $(that).offset().top - $(that).height();
                    if (!$(that).parent().hasClass('combo-open')) {
                        $(that).parent().addClass('combo-open');
                    }
                    if (!$(that).parent().hasClass('combo-focus')) {
                        $(that).parent().addClass('combo-focus');
                    }
                    if (screenDis < 300) {
                        $(that).siblings("ul").css({
                            "position": "fixed",
                            "left": ulLeft + 'px',
                            "z-index": "20",
                            "min-width": $(that).css("width"),
                            "bottom": $(window).height() - $(that).offset().top + 'px',
                            "top": "auto"
                        });
                    } else {
                        $(that).siblings("ul").css({
                            "position": "fixed",
                            "z-index": "20",
                            "top": ulTop + 'px',
                            "left": ulLeft + 'px',
                            "min-width": $(that).css("width"),
                            "bottom": ''
                        });
                    }
                    $(that).siblings('ul').show();
//                          var scrollT = $(that).parents('div.GridTableBodyDiv').scrollTop();

                    $(that).parents('div.GridTableBodyDiv').off('scroll').scroll(function () {
                        console.log('Combo select scroll');
                        // 方案1： 禁用掉外部父div的滚动
                        // $(this).prop('scrollTop', scrollT);
                        // return;
                        // 方案2： 外部父div滚动时隐藏掉下拉
                        $(that).trigger('blur');
                        $(that).parent().removeClass("combo-focus").removeClass("combo-open");
                        $(that).parents('div.GridTableBodyDiv').off('scroll');
                    });

                    $(that).parents('div.GridTableBodyDiv').on('resize', function () {
                        console.log('Combo select resize');
                        $(that).trigger('blur');
                        $(that).parent().removeClass("combo-focus").removeClass("combo-open");
                    });
                });
            }
        };

        f._init();
    };

    return $;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2NvbWJvU2VsZWN0L2llbXNDb21ib1NlbGVjdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJkZWZpbmUoWydqcXVlcnknLCAnY3NzIXBsdWdpbnMvY29tYm9TZWxlY3QvY29tYm8uc2VsZWN0LmNzcycsICdwbHVnaW5zL2NvbWJvU2VsZWN0L2pxdWVyeS5jb21iby5zZWxlY3QnXSwgZnVuY3Rpb24gKCQpIHtcclxuICAgIGlmICgkLmZuLmllbXNDb21ib1NlbGVjdCkge1xyXG4gICAgICAgIHJldHVybiAkO1xyXG4gICAgfVxyXG5cclxuICAgICQuZm4uaWVtc0NvbWJvU2VsZWN0ID0gZnVuY3Rpb24gKG9wdGlvbikge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIHAgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIGluR3JpZFRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgaW5EaWFsb2dGb3JtOiBmYWxzZVxyXG4gICAgICAgIH0sIG9wdGlvbik7XHJcblxyXG4gICAgICAgIHZhciBmID0ge1xyXG4gICAgICAgICAgICBfaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHRoaXMuY29tYm9TZWxlY3QoKTtcclxuICAgICAgICAgICAgICAgIGlmIChwLmluR3JpZFRhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZi5fZml0VGFibGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwLmluRGlhbG9nRm9ybSkge1xyXG4gICAgICAgICAgICAgICAgXHRmLl9maXREaWFsb2coKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgX2ZpdERpYWxvZzogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgXHQkdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgICAgIFx0JHRoaXMuc2libGluZ3MoXCJpbnB1dFwiKS5jc3MoXCJ3aWR0aFwiLCR0aGlzLmNzcyhcIndpZHRoXCIpKTtcclxuICAgICAgICAgICAgXHQkdGhpcy5zaWJsaW5ncygndWwnKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaWJsaW5ncyhcImlucHV0XCIpLm9uKFwiZm9jdXNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdWxUb3AgPSAkKHRoYXQpLm9mZnNldCgpLnRvcCAtICQodGhhdCkucGFyZW50cyhcIi5tb2RhbC1kaWFsb2dcIikub2Zmc2V0KCkudG9wICsgJCh0aGF0KS5wYXJlbnQoKS5oZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gICQodGhhdCkucGFyZW50cygnZGl2LkdyaWRUYWJsZUJvZHlEaXYnKS5wYXJlbnQoKS5zY3JvbGxUb3AoKTtcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ckNvdW50ID0gJCh0aGF0KS5wYXJlbnRzKFwidGJvZHlcIikuZmluZChcInRyXCIpLmxlbmd0aDtcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJJbmRleCA9ICQodGhhdCkucGFyZW50cyhcInRyXCIpLmluZGV4KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcmVlbkRpcyA9ICQod2luZG93KS5oZWlnaHQoKSAtICQodGhhdCkub2Zmc2V0KCkudG9wIC0gJCh0aGF0KS5oZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISQodGhhdCkucGFyZW50KCkuaGFzQ2xhc3MoJ2NvbWJvLW9wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnBhcmVudCgpLmFkZENsYXNzKCdjb21iby1vcGVuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghJCh0aGF0KS5wYXJlbnQoKS5oYXNDbGFzcygnY29tYm8tZm9jdXMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnBhcmVudCgpLmFkZENsYXNzKCdjb21iby1mb2N1cycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnNpYmxpbmdzKFwidWxcIikuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ6LWluZGV4XCI6IFwiMjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOiAkKHRoYXQpLmNzcyhcIndpZHRoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLyokKHRoYXQpLnNpYmxpbmdzKFwidWxcIikuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicG9zaXRpb25cIjogXCJmaXhlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ6LWluZGV4XCI6IFwiMjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidG9wXCI6IHVsVG9wICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGVmdFwiOiAnaW5oZXJpdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1pbi13aWR0aFwiOiAkKHRoYXQpLmNzcyhcIndpZHRoXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJib3R0b21cIjogJydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7Ki9cclxuICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnNpYmxpbmdzKCd1bCcpLndpZHRoKCQodGhhdCkuc2libGluZ3MoJ3VsJykud2lkdGgoKSsyMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS5zaWJsaW5ncygndWwnKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgX2ZpdFRhYmxlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaWJsaW5ncygndWwnKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaWJsaW5ncyhcImlucHV0XCIpLm9uKFwiZm9jdXNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdWxUb3AgPSAkKHRoYXQpLnBhcmVudCgpLm9mZnNldCgpLnRvcCArICQodGhhdCkucGFyZW50KCkuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVsTGVmdCA9ICQodGhhdCkucGFyZW50KCkub2Zmc2V0KCkubGVmdDtcclxuXHJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gICQodGhhdCkucGFyZW50cygnZGl2LkdyaWRUYWJsZUJvZHlEaXYnKS5wYXJlbnQoKS5zY3JvbGxUb3AoKTtcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ckNvdW50ID0gJCh0aGF0KS5wYXJlbnRzKFwidGJvZHlcIikuZmluZChcInRyXCIpLmxlbmd0aDtcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJJbmRleCA9ICQodGhhdCkucGFyZW50cyhcInRyXCIpLmluZGV4KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcmVlbkRpcyA9ICQod2luZG93KS5oZWlnaHQoKSAtICQodGhhdCkub2Zmc2V0KCkudG9wIC0gJCh0aGF0KS5oZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISQodGhhdCkucGFyZW50KCkuaGFzQ2xhc3MoJ2NvbWJvLW9wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnBhcmVudCgpLmFkZENsYXNzKCdjb21iby1vcGVuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghJCh0aGF0KS5wYXJlbnQoKS5oYXNDbGFzcygnY29tYm8tZm9jdXMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnBhcmVudCgpLmFkZENsYXNzKCdjb21iby1mb2N1cycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NyZWVuRGlzIDwgMzAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhhdCkuc2libGluZ3MoXCJ1bFwiKS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwb3NpdGlvblwiOiBcImZpeGVkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxlZnRcIjogdWxMZWZ0ICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiei1pbmRleFwiOiBcIjIwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1pbi13aWR0aFwiOiAkKHRoYXQpLmNzcyhcIndpZHRoXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJib3R0b21cIjogJCh3aW5kb3cpLmhlaWdodCgpIC0gJCh0aGF0KS5vZmZzZXQoKS50b3AgKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BcIjogXCJhdXRvXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS5zaWJsaW5ncyhcInVsXCIpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBvc2l0aW9uXCI6IFwiZml4ZWRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiei1pbmRleFwiOiBcIjIwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcFwiOiB1bFRvcCArICdweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxlZnRcIjogdWxMZWZ0ICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibWluLXdpZHRoXCI6ICQodGhhdCkuY3NzKFwid2lkdGhcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImJvdHRvbVwiOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS5zaWJsaW5ncygndWwnKS5zaG93KCk7XHJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsVCA9ICQodGhhdCkucGFyZW50cygnZGl2LkdyaWRUYWJsZUJvZHlEaXYnKS5zY3JvbGxUb3AoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS5wYXJlbnRzKCdkaXYuR3JpZFRhYmxlQm9keURpdicpLm9mZignc2Nyb2xsJykuc2Nyb2xsKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NvbWJvIHNlbGVjdCBzY3JvbGwnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pa55qGIMe+8miDnpoHnlKjmjonlpJbpg6jniLZkaXbnmoTmu5rliqhcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCh0aGlzKS5wcm9wKCdzY3JvbGxUb3AnLCBzY3JvbGxUKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmlrnmoYgy77yaIOWklumDqOeItmRpdua7muWKqOaXtumakOiXj+aOieS4i+aLiVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnRyaWdnZXIoJ2JsdXInKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS5wYXJlbnQoKS5yZW1vdmVDbGFzcyhcImNvbWJvLWZvY3VzXCIpLnJlbW92ZUNsYXNzKFwiY29tYm8tb3BlblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS5wYXJlbnRzKCdkaXYuR3JpZFRhYmxlQm9keURpdicpLm9mZignc2Nyb2xsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICQodGhhdCkucGFyZW50cygnZGl2LkdyaWRUYWJsZUJvZHlEaXYnKS5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ29tYm8gc2VsZWN0IHJlc2l6ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnRyaWdnZXIoJ2JsdXInKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS5wYXJlbnQoKS5yZW1vdmVDbGFzcyhcImNvbWJvLWZvY3VzXCIpLnJlbW92ZUNsYXNzKFwiY29tYm8tb3BlblwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZi5faW5pdCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gJDtcclxufSk7Il0sImZpbGUiOiJwbHVnaW5zL2NvbWJvU2VsZWN0L2llbXNDb21ib1NlbGVjdC5qcyJ9
