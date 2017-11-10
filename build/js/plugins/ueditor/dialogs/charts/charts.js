/*
 * 图片转换对话框脚本
 **/

var tableData = [],
    //编辑器页面table
    editorTable = null,
    chartsConfig = window.typeConfig,
    resizeTimer = null,
    //初始默认图表类型
    currentChartType = 0;

window.onload = function () {

    editorTable = domUtils.findParentByTagName( editor.selection.getRange().startContainer, 'table', true);

    //未找到表格， 显示错误页面
    if ( !editorTable ) {
        document.body.innerHTML = "<div class='edui-charts-not-data'>未找到数据</div>";
        return;
    }

    //初始化图表类型选择
    initChartsTypeView();
    renderTable( editorTable );
    initEvent();
    initUserConfig( editorTable.getAttribute( "data-chart" ) );
    $( "#scrollBed .view-box:eq("+ currentChartType +")" ).trigger( "click" );
    updateViewType( currentChartType );

    dialog.addListener( "resize", function () {

        if ( resizeTimer != null ) {
            window.clearTimeout( resizeTimer );
        }

        resizeTimer = window.setTimeout( function () {

            resizeTimer = null;

            renderCharts();

        }, 500 );

    } );

};

function initChartsTypeView () {

    var contents = [];

    for ( var i = 0, len = chartsConfig.length; i<len; i++ ) {

        contents.push( '<div class="view-box" data-chart-type="'+ i +'"><img width="300" src="images/charts'+ i +'.png"></div>' );

    }

    $( "#scrollBed" ).html( contents.join( "" ) );

}

//渲染table， 以便用户修改数据
function renderTable ( table ) {

    var tableHtml = [];

    //构造数据
    for ( var i = 0, row; row = table.rows[ i ]; i++ ) {

        tableData[ i ] = [];
        tableHtml[ i ] = [];

        for ( var j = 0, cell; cell = row.cells[ j ]; j++ ) {

            var value = getCellValue( cell );

            if ( i > 0 && j > 0 ) {
                value = +value;
            }

            if ( i === 0 || j === 0 ) {
                tableHtml[ i ].push( '<th>'+ value +'</th>' );
            } else {
                tableHtml[ i ].push( '<td><input type="text" class="data-item" value="'+ value +'"></td>' );
            }

            tableData[ i ][ j ] = value;

        }

        tableHtml[ i ] = tableHtml[ i ].join( "" );

    }

    //draw 表格
    $( "#tableContainer" ).html( '<table id="showTable" border="1"><tbody><tr>'+ tableHtml.join( "</tr><tr>" ) +'</tr></tbody></table>' );

}

/*
 * 根据表格已有的图表属性初始化当前图表属性
 */
function initUserConfig ( config ) {

    var parsedConfig = {};

    if ( !config ) {
        return;
    }

    config = config.split( ";" );

    $.each( config, function ( index, item ) {

        item = item.split( ":" );
        parsedConfig[ item[ 0 ] ] = item[ 1 ];

    } );

    setUserConfig( parsedConfig );

}

function initEvent () {

    var cacheValue = null,
        //图表类型数
        typeViewCount = chartsConfig.length- 1,
        $chartsTypeViewBox = $( '#scrollBed .view-box' );

    $( ".charts-format" ).delegate( ".format-ctrl", "change", function () {

        renderCharts();

    } )

    $( ".table-view" ).delegate( ".data-item", "focus", function () {

        cacheValue = this.value;

    } ).delegate( ".data-item", "blur", function () {

        if ( this.value !== cacheValue ) {
            renderCharts();
        }

        cacheValue = null;

    } );

    $( "#buttonContainer" ).delegate( "a", "click", function (e) {

        e.preventDefault();

        if ( this.getAttribute( "data-title" ) === 'prev' ) {

            if ( currentChartType > 0 ) {
                currentChartType--;
                updateViewType( currentChartType );
            }

        } else {

            if ( currentChartType < typeViewCount ) {
                currentChartType++;
                updateViewType( currentChartType );
            }

        }

    } );

    //图表类型变化
    $( '#scrollBed' ).delegate( ".view-box", "click", function (e) {

        var index = $( this ).attr( "data-chart-type" );
        $chartsTypeViewBox.removeClass( "selected" );
        $( $chartsTypeViewBox[ index ] ).addClass( "selected" );

        currentChartType = index | 0;

        //饼图， 禁用部分配置
        if ( currentChartType === chartsConfig.length - 1 ) {

            disableNotPieConfig();

        //启用完整配置
        } else {

            enableNotPieConfig();

        }

        renderCharts();

    } );

}

function renderCharts () {

    var data = collectData();

    $('#chartsContainer').highcharts( $.extend( {}, chartsConfig[ currentChartType ], {

        credits: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        title: {
            text: data.title,
            x: -20 //center
        },
        subtitle: {
            text: data.subTitle,
            x: -20
        },
        xAxis: {
            title: {
                text: data.xTitle
            },
            categories: data.categories
        },
        yAxis: {
            title: {
                text: data.yTitle
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            enabled: true,
            valueSuffix: data.suffix
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 1
        },
        series: data.series

    } ));

}

function updateViewType ( index ) {

    $( "#scrollBed" ).css( 'marginLeft', -index*324+'px' );

}

function collectData () {

    var form = document.forms[ 'data-form' ],
        data = null;

    if ( currentChartType !== chartsConfig.length - 1 ) {

        data = getSeriesAndCategories();
        $.extend( data, getUserConfig() );

    //饼图数据格式
    } else {
        data = getSeriesForPieChart();
        data.title = form[ 'title' ].value;
        data.suffix = form[ 'unit' ].value;
    }

    return data;

}

/**
 * 获取用户配置信息
 */
function getUserConfig () {

    var form = document.forms[ 'data-form' ],
        info = {
            title: form[ 'title' ].value,
            subTitle: form[ 'sub-title' ].value,
            xTitle: form[ 'x-title' ].value,
            yTitle: form[ 'y-title' ].value,
            suffix: form[ 'unit' ].value,
            //数据对齐方式
            tableDataFormat: getTableDataFormat (),
            //饼图提示文字
            tip: $( "#tipInput" ).val()
        };

    return info;

}

function setUserConfig ( config ) {

    var form = document.forms[ 'data-form' ];

    config.title && ( form[ 'title' ].value = config.title );
    config.subTitle && ( form[ 'sub-title' ].value = config.subTitle );
    config.xTitle && ( form[ 'x-title' ].value = config.xTitle );
    config.yTitle && ( form[ 'y-title' ].value = config.yTitle );
    config.suffix && ( form[ 'unit' ].value = config.suffix );
    config.dataFormat == "-1" && ( form[ 'charts-format' ][ 1 ].checked = true );
    config.tip && ( form[ 'tip' ].value = config.tip );
    currentChartType = config.chartType || 0;

}

function getSeriesAndCategories () {

    var form = document.forms[ 'data-form' ],
        series = [],
        categories = [],
        tmp = [],
        tableData = getTableData();

    //反转数据
    if ( getTableDataFormat() === "-1" ) {

        for ( var i = 0, len = tableData.length; i < len; i++ ) {

            for ( var j = 0, jlen = tableData[ i ].length; j < jlen; j++ ) {

                if ( !tmp[ j ] ) {
                    tmp[ j ] = [];
                }

                tmp[ j ][ i ] = tableData[ i ][ j ];

            }

        }

        tableData = tmp;

    }

    categories = tableData[0].slice( 1 );

    for ( var i = 1, data; data = tableData[ i ]; i++ ) {

        series.push( {
            name: data[ 0 ],
            data: data.slice( 1 )
        } );

    }

    return {
        series: series,
        categories: categories
    };

}

/*
 * 获取数据源数据对齐方式
 */
function getTableDataFormat () {

    var form = document.forms[ 'data-form' ],
        items = form['charts-format'];

    return items[ 0 ].checked ? items[ 0 ].value : items[ 1 ].value;

}

/*
 * 禁用非饼图类型的配置项
 */
function disableNotPieConfig() {

    updateConfigItem( 'disable' );

}

/*
 * 启用非饼图类型的配置项
 */
function enableNotPieConfig() {

    updateConfigItem( 'enable' );

}

function updateConfigItem ( value ) {

    var table = $( "#showTable" )[ 0 ],
        isDisable = value === 'disable' ? true : false;

    //table中的input处理
    for ( var i = 2 , row; row = table.rows[ i ]; i++ ) {

        for ( var j = 1, cell; cell = row.cells[ j ]; j++ ) {

            $( "input", cell ).attr( "disabled", isDisable );

        }

    }

    //其他项处理
    $( "input.not-pie-item" ).attr( "disabled", isDisable );
    $( "#tipInput" ).attr( "disabled", !isDisable )

}

/*
 * 获取饼图数据
 * 饼图的数据只取第一行的
 **/
function getSeriesForPieChart () {

    var series = {
            type: 'pie',
            name: $("#tipInput").val(),
            data: []
        },
        tableData = getTableData();


    for ( var j = 1, jlen = tableData[ 0 ].length; j < jlen; j++ ) {

        var title = tableData[ 0 ][ j ],
            val = tableData[ 1 ][ j ];

        series.data.push( [ title, val ] );

    }

    return {
        series: [ series ]
    };

}

function getTableData () {

    var table = document.getElementById( "showTable" ),
        xCount = table.rows[0].cells.length - 1,
        values = getTableInputValue();

    for ( var i = 0, value; value = values[ i ]; i++ ) {

        tableData[ Math.floor( i / xCount ) + 1 ][ i % xCount + 1 ] = values[ i ];

    }

    return tableData;

}

function getTableInputValue () {

    var table = document.getElementById( "showTable" ),
        inputs = table.getElementsByTagName( "input" ),
        values = [];

    for ( var i = 0, input; input = inputs[ i ]; i++ ) {
        values.push( input.value | 0 );
    }

    return values;

}

function getCellValue ( cell ) {

    var value = utils.trim( ( cell.innerText || cell.textContent || '' ) );

    return value.replace( new RegExp( UE.dom.domUtils.fillChar, 'g' ), '' ).replace( /^\s+|\s+$/g, '' );

}


//dialog确认事件
dialog.onok = function () {

    //收集信息
    var form = document.forms[ 'data-form' ],
        info = getUserConfig();

    //添加图表类型
    info.chartType = currentChartType;

    //同步表格数据到编辑器
    syncTableData();

    //执行图表命令
    editor.execCommand( 'charts', info );

};

/*
 * 同步图表编辑视图的表格数据到编辑器里的原始表格
 */
function syncTableData () {

    var tableData = getTableData();

    for ( var i = 1, row; row = editorTable.rows[ i ]; i++ ) {

        for ( var j = 1, cell; cell = row.cells[ j ]; j++ ) {

            cell.innerHTML = tableData[ i ] [ j ];

        }

    }

}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9jaGFydHMvY2hhcnRzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiDlm77niYfovazmjaLlr7nor53moYbohJrmnKxcbiAqKi9cblxudmFyIHRhYmxlRGF0YSA9IFtdLFxuICAgIC8v57yW6L6R5Zmo6aG16Z2idGFibGVcbiAgICBlZGl0b3JUYWJsZSA9IG51bGwsXG4gICAgY2hhcnRzQ29uZmlnID0gd2luZG93LnR5cGVDb25maWcsXG4gICAgcmVzaXplVGltZXIgPSBudWxsLFxuICAgIC8v5Yid5aeL6buY6K6k5Zu+6KGo57G75Z6LXG4gICAgY3VycmVudENoYXJ0VHlwZSA9IDA7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICBlZGl0b3JUYWJsZSA9IGRvbVV0aWxzLmZpbmRQYXJlbnRCeVRhZ05hbWUoIGVkaXRvci5zZWxlY3Rpb24uZ2V0UmFuZ2UoKS5zdGFydENvbnRhaW5lciwgJ3RhYmxlJywgdHJ1ZSk7XG5cbiAgICAvL+acquaJvuWIsOihqOagvO+8jCDmmL7npLrplJnor6/pobXpnaJcbiAgICBpZiAoICFlZGl0b3JUYWJsZSApIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSBcIjxkaXYgY2xhc3M9J2VkdWktY2hhcnRzLW5vdC1kYXRhJz7mnKrmib7liLDmlbDmja48L2Rpdj5cIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8v5Yid5aeL5YyW5Zu+6KGo57G75Z6L6YCJ5oupXG4gICAgaW5pdENoYXJ0c1R5cGVWaWV3KCk7XG4gICAgcmVuZGVyVGFibGUoIGVkaXRvclRhYmxlICk7XG4gICAgaW5pdEV2ZW50KCk7XG4gICAgaW5pdFVzZXJDb25maWcoIGVkaXRvclRhYmxlLmdldEF0dHJpYnV0ZSggXCJkYXRhLWNoYXJ0XCIgKSApO1xuICAgICQoIFwiI3Njcm9sbEJlZCAudmlldy1ib3g6ZXEoXCIrIGN1cnJlbnRDaGFydFR5cGUgK1wiKVwiICkudHJpZ2dlciggXCJjbGlja1wiICk7XG4gICAgdXBkYXRlVmlld1R5cGUoIGN1cnJlbnRDaGFydFR5cGUgKTtcblxuICAgIGRpYWxvZy5hZGRMaXN0ZW5lciggXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmICggcmVzaXplVGltZXIgIT0gbnVsbCApIHtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoIHJlc2l6ZVRpbWVyICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNpemVUaW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHJlc2l6ZVRpbWVyID0gbnVsbDtcblxuICAgICAgICAgICAgcmVuZGVyQ2hhcnRzKCk7XG5cbiAgICAgICAgfSwgNTAwICk7XG5cbiAgICB9ICk7XG5cbn07XG5cbmZ1bmN0aW9uIGluaXRDaGFydHNUeXBlVmlldyAoKSB7XG5cbiAgICB2YXIgY29udGVudHMgPSBbXTtcblxuICAgIGZvciAoIHZhciBpID0gMCwgbGVuID0gY2hhcnRzQ29uZmlnLmxlbmd0aDsgaTxsZW47IGkrKyApIHtcblxuICAgICAgICBjb250ZW50cy5wdXNoKCAnPGRpdiBjbGFzcz1cInZpZXctYm94XCIgZGF0YS1jaGFydC10eXBlPVwiJysgaSArJ1wiPjxpbWcgd2lkdGg9XCIzMDBcIiBzcmM9XCJpbWFnZXMvY2hhcnRzJysgaSArJy5wbmdcIj48L2Rpdj4nICk7XG5cbiAgICB9XG5cbiAgICAkKCBcIiNzY3JvbGxCZWRcIiApLmh0bWwoIGNvbnRlbnRzLmpvaW4oIFwiXCIgKSApO1xuXG59XG5cbi8v5riy5p+TdGFibGXvvIwg5Lul5L6/55So5oi35L+u5pS55pWw5o2uXG5mdW5jdGlvbiByZW5kZXJUYWJsZSAoIHRhYmxlICkge1xuXG4gICAgdmFyIHRhYmxlSHRtbCA9IFtdO1xuXG4gICAgLy/mnoTpgKDmlbDmja5cbiAgICBmb3IgKCB2YXIgaSA9IDAsIHJvdzsgcm93ID0gdGFibGUucm93c1sgaSBdOyBpKysgKSB7XG5cbiAgICAgICAgdGFibGVEYXRhWyBpIF0gPSBbXTtcbiAgICAgICAgdGFibGVIdG1sWyBpIF0gPSBbXTtcblxuICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIGNlbGw7IGNlbGwgPSByb3cuY2VsbHNbIGogXTsgaisrICkge1xuXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBnZXRDZWxsVmFsdWUoIGNlbGwgKTtcblxuICAgICAgICAgICAgaWYgKCBpID4gMCAmJiBqID4gMCApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICt2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBpID09PSAwIHx8IGogPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgdGFibGVIdG1sWyBpIF0ucHVzaCggJzx0aD4nKyB2YWx1ZSArJzwvdGg+JyApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YWJsZUh0bWxbIGkgXS5wdXNoKCAnPHRkPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZGF0YS1pdGVtXCIgdmFsdWU9XCInKyB2YWx1ZSArJ1wiPjwvdGQ+JyApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YWJsZURhdGFbIGkgXVsgaiBdID0gdmFsdWU7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRhYmxlSHRtbFsgaSBdID0gdGFibGVIdG1sWyBpIF0uam9pbiggXCJcIiApO1xuXG4gICAgfVxuXG4gICAgLy9kcmF3IOihqOagvFxuICAgICQoIFwiI3RhYmxlQ29udGFpbmVyXCIgKS5odG1sKCAnPHRhYmxlIGlkPVwic2hvd1RhYmxlXCIgYm9yZGVyPVwiMVwiPjx0Ym9keT48dHI+JysgdGFibGVIdG1sLmpvaW4oIFwiPC90cj48dHI+XCIgKSArJzwvdHI+PC90Ym9keT48L3RhYmxlPicgKTtcblxufVxuXG4vKlxuICog5qC55o2u6KGo5qC85bey5pyJ55qE5Zu+6KGo5bGe5oCn5Yid5aeL5YyW5b2T5YmN5Zu+6KGo5bGe5oCnXG4gKi9cbmZ1bmN0aW9uIGluaXRVc2VyQ29uZmlnICggY29uZmlnICkge1xuXG4gICAgdmFyIHBhcnNlZENvbmZpZyA9IHt9O1xuXG4gICAgaWYgKCAhY29uZmlnICkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uZmlnID0gY29uZmlnLnNwbGl0KCBcIjtcIiApO1xuXG4gICAgJC5lYWNoKCBjb25maWcsIGZ1bmN0aW9uICggaW5kZXgsIGl0ZW0gKSB7XG5cbiAgICAgICAgaXRlbSA9IGl0ZW0uc3BsaXQoIFwiOlwiICk7XG4gICAgICAgIHBhcnNlZENvbmZpZ1sgaXRlbVsgMCBdIF0gPSBpdGVtWyAxIF07XG5cbiAgICB9ICk7XG5cbiAgICBzZXRVc2VyQ29uZmlnKCBwYXJzZWRDb25maWcgKTtcblxufVxuXG5mdW5jdGlvbiBpbml0RXZlbnQgKCkge1xuXG4gICAgdmFyIGNhY2hlVmFsdWUgPSBudWxsLFxuICAgICAgICAvL+WbvuihqOexu+Wei+aVsFxuICAgICAgICB0eXBlVmlld0NvdW50ID0gY2hhcnRzQ29uZmlnLmxlbmd0aC0gMSxcbiAgICAgICAgJGNoYXJ0c1R5cGVWaWV3Qm94ID0gJCggJyNzY3JvbGxCZWQgLnZpZXctYm94JyApO1xuXG4gICAgJCggXCIuY2hhcnRzLWZvcm1hdFwiICkuZGVsZWdhdGUoIFwiLmZvcm1hdC1jdHJsXCIsIFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICByZW5kZXJDaGFydHMoKTtcblxuICAgIH0gKVxuXG4gICAgJCggXCIudGFibGUtdmlld1wiICkuZGVsZWdhdGUoIFwiLmRhdGEtaXRlbVwiLCBcImZvY3VzXCIsIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBjYWNoZVZhbHVlID0gdGhpcy52YWx1ZTtcblxuICAgIH0gKS5kZWxlZ2F0ZSggXCIuZGF0YS1pdGVtXCIsIFwiYmx1clwiLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgaWYgKCB0aGlzLnZhbHVlICE9PSBjYWNoZVZhbHVlICkge1xuICAgICAgICAgICAgcmVuZGVyQ2hhcnRzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWNoZVZhbHVlID0gbnVsbDtcblxuICAgIH0gKTtcblxuICAgICQoIFwiI2J1dHRvbkNvbnRhaW5lclwiICkuZGVsZWdhdGUoIFwiYVwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICggdGhpcy5nZXRBdHRyaWJ1dGUoIFwiZGF0YS10aXRsZVwiICkgPT09ICdwcmV2JyApIHtcblxuICAgICAgICAgICAgaWYgKCBjdXJyZW50Q2hhcnRUeXBlID4gMCApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50Q2hhcnRUeXBlLS07XG4gICAgICAgICAgICAgICAgdXBkYXRlVmlld1R5cGUoIGN1cnJlbnRDaGFydFR5cGUgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnRDaGFydFR5cGUgPCB0eXBlVmlld0NvdW50ICkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDaGFydFR5cGUrKztcbiAgICAgICAgICAgICAgICB1cGRhdGVWaWV3VHlwZSggY3VycmVudENoYXJ0VHlwZSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH0gKTtcblxuICAgIC8v5Zu+6KGo57G75Z6L5Y+Y5YyWXG4gICAgJCggJyNzY3JvbGxCZWQnICkuZGVsZWdhdGUoIFwiLnZpZXctYm94XCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcblxuICAgICAgICB2YXIgaW5kZXggPSAkKCB0aGlzICkuYXR0ciggXCJkYXRhLWNoYXJ0LXR5cGVcIiApO1xuICAgICAgICAkY2hhcnRzVHlwZVZpZXdCb3gucmVtb3ZlQ2xhc3MoIFwic2VsZWN0ZWRcIiApO1xuICAgICAgICAkKCAkY2hhcnRzVHlwZVZpZXdCb3hbIGluZGV4IF0gKS5hZGRDbGFzcyggXCJzZWxlY3RlZFwiICk7XG5cbiAgICAgICAgY3VycmVudENoYXJ0VHlwZSA9IGluZGV4IHwgMDtcblxuICAgICAgICAvL+mlvOWbvu+8jCDnpoHnlKjpg6jliIbphY3nva5cbiAgICAgICAgaWYgKCBjdXJyZW50Q2hhcnRUeXBlID09PSBjaGFydHNDb25maWcubGVuZ3RoIC0gMSApIHtcblxuICAgICAgICAgICAgZGlzYWJsZU5vdFBpZUNvbmZpZygpO1xuXG4gICAgICAgIC8v5ZCv55So5a6M5pW06YWN572uXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGVuYWJsZU5vdFBpZUNvbmZpZygpO1xuXG4gICAgICAgIH1cblxuICAgICAgICByZW5kZXJDaGFydHMoKTtcblxuICAgIH0gKTtcblxufVxuXG5mdW5jdGlvbiByZW5kZXJDaGFydHMgKCkge1xuXG4gICAgdmFyIGRhdGEgPSBjb2xsZWN0RGF0YSgpO1xuXG4gICAgJCgnI2NoYXJ0c0NvbnRhaW5lcicpLmhpZ2hjaGFydHMoICQuZXh0ZW5kKCB7fSwgY2hhcnRzQ29uZmlnWyBjdXJyZW50Q2hhcnRUeXBlIF0sIHtcblxuICAgICAgICBjcmVkaXRzOiB7XG4gICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBleHBvcnRpbmc6IHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICB0ZXh0OiBkYXRhLnRpdGxlLFxuICAgICAgICAgICAgeDogLTIwIC8vY2VudGVyXG4gICAgICAgIH0sXG4gICAgICAgIHN1YnRpdGxlOiB7XG4gICAgICAgICAgICB0ZXh0OiBkYXRhLnN1YlRpdGxlLFxuICAgICAgICAgICAgeDogLTIwXG4gICAgICAgIH0sXG4gICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIHRleHQ6IGRhdGEueFRpdGxlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2F0ZWdvcmllczogZGF0YS5jYXRlZ29yaWVzXG4gICAgICAgIH0sXG4gICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIHRleHQ6IGRhdGEueVRpdGxlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGxvdExpbmVzOiBbe1xuICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAxLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAnIzgwODA4MCdcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0sXG4gICAgICAgIHRvb2x0aXA6IHtcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICB2YWx1ZVN1ZmZpeDogZGF0YS5zdWZmaXhcbiAgICAgICAgfSxcbiAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICBsYXlvdXQ6ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICBhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnLFxuICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDFcbiAgICAgICAgfSxcbiAgICAgICAgc2VyaWVzOiBkYXRhLnNlcmllc1xuXG4gICAgfSApKTtcblxufVxuXG5mdW5jdGlvbiB1cGRhdGVWaWV3VHlwZSAoIGluZGV4ICkge1xuXG4gICAgJCggXCIjc2Nyb2xsQmVkXCIgKS5jc3MoICdtYXJnaW5MZWZ0JywgLWluZGV4KjMyNCsncHgnICk7XG5cbn1cblxuZnVuY3Rpb24gY29sbGVjdERhdGEgKCkge1xuXG4gICAgdmFyIGZvcm0gPSBkb2N1bWVudC5mb3Jtc1sgJ2RhdGEtZm9ybScgXSxcbiAgICAgICAgZGF0YSA9IG51bGw7XG5cbiAgICBpZiAoIGN1cnJlbnRDaGFydFR5cGUgIT09IGNoYXJ0c0NvbmZpZy5sZW5ndGggLSAxICkge1xuXG4gICAgICAgIGRhdGEgPSBnZXRTZXJpZXNBbmRDYXRlZ29yaWVzKCk7XG4gICAgICAgICQuZXh0ZW5kKCBkYXRhLCBnZXRVc2VyQ29uZmlnKCkgKTtcblxuICAgIC8v6aW85Zu+5pWw5o2u5qC85byPXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGF0YSA9IGdldFNlcmllc0ZvclBpZUNoYXJ0KCk7XG4gICAgICAgIGRhdGEudGl0bGUgPSBmb3JtWyAndGl0bGUnIF0udmFsdWU7XG4gICAgICAgIGRhdGEuc3VmZml4ID0gZm9ybVsgJ3VuaXQnIF0udmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG5cbn1cblxuLyoqXG4gKiDojrflj5bnlKjmiLfphY3nva7kv6Hmga9cbiAqL1xuZnVuY3Rpb24gZ2V0VXNlckNvbmZpZyAoKSB7XG5cbiAgICB2YXIgZm9ybSA9IGRvY3VtZW50LmZvcm1zWyAnZGF0YS1mb3JtJyBdLFxuICAgICAgICBpbmZvID0ge1xuICAgICAgICAgICAgdGl0bGU6IGZvcm1bICd0aXRsZScgXS52YWx1ZSxcbiAgICAgICAgICAgIHN1YlRpdGxlOiBmb3JtWyAnc3ViLXRpdGxlJyBdLnZhbHVlLFxuICAgICAgICAgICAgeFRpdGxlOiBmb3JtWyAneC10aXRsZScgXS52YWx1ZSxcbiAgICAgICAgICAgIHlUaXRsZTogZm9ybVsgJ3ktdGl0bGUnIF0udmFsdWUsXG4gICAgICAgICAgICBzdWZmaXg6IGZvcm1bICd1bml0JyBdLnZhbHVlLFxuICAgICAgICAgICAgLy/mlbDmja7lr7npvZDmlrnlvI9cbiAgICAgICAgICAgIHRhYmxlRGF0YUZvcm1hdDogZ2V0VGFibGVEYXRhRm9ybWF0ICgpLFxuICAgICAgICAgICAgLy/ppbzlm77mj5DnpLrmloflrZdcbiAgICAgICAgICAgIHRpcDogJCggXCIjdGlwSW5wdXRcIiApLnZhbCgpXG4gICAgICAgIH07XG5cbiAgICByZXR1cm4gaW5mbztcblxufVxuXG5mdW5jdGlvbiBzZXRVc2VyQ29uZmlnICggY29uZmlnICkge1xuXG4gICAgdmFyIGZvcm0gPSBkb2N1bWVudC5mb3Jtc1sgJ2RhdGEtZm9ybScgXTtcblxuICAgIGNvbmZpZy50aXRsZSAmJiAoIGZvcm1bICd0aXRsZScgXS52YWx1ZSA9IGNvbmZpZy50aXRsZSApO1xuICAgIGNvbmZpZy5zdWJUaXRsZSAmJiAoIGZvcm1bICdzdWItdGl0bGUnIF0udmFsdWUgPSBjb25maWcuc3ViVGl0bGUgKTtcbiAgICBjb25maWcueFRpdGxlICYmICggZm9ybVsgJ3gtdGl0bGUnIF0udmFsdWUgPSBjb25maWcueFRpdGxlICk7XG4gICAgY29uZmlnLnlUaXRsZSAmJiAoIGZvcm1bICd5LXRpdGxlJyBdLnZhbHVlID0gY29uZmlnLnlUaXRsZSApO1xuICAgIGNvbmZpZy5zdWZmaXggJiYgKCBmb3JtWyAndW5pdCcgXS52YWx1ZSA9IGNvbmZpZy5zdWZmaXggKTtcbiAgICBjb25maWcuZGF0YUZvcm1hdCA9PSBcIi0xXCIgJiYgKCBmb3JtWyAnY2hhcnRzLWZvcm1hdCcgXVsgMSBdLmNoZWNrZWQgPSB0cnVlICk7XG4gICAgY29uZmlnLnRpcCAmJiAoIGZvcm1bICd0aXAnIF0udmFsdWUgPSBjb25maWcudGlwICk7XG4gICAgY3VycmVudENoYXJ0VHlwZSA9IGNvbmZpZy5jaGFydFR5cGUgfHwgMDtcblxufVxuXG5mdW5jdGlvbiBnZXRTZXJpZXNBbmRDYXRlZ29yaWVzICgpIHtcblxuICAgIHZhciBmb3JtID0gZG9jdW1lbnQuZm9ybXNbICdkYXRhLWZvcm0nIF0sXG4gICAgICAgIHNlcmllcyA9IFtdLFxuICAgICAgICBjYXRlZ29yaWVzID0gW10sXG4gICAgICAgIHRtcCA9IFtdLFxuICAgICAgICB0YWJsZURhdGEgPSBnZXRUYWJsZURhdGEoKTtcblxuICAgIC8v5Y+N6L2s5pWw5o2uXG4gICAgaWYgKCBnZXRUYWJsZURhdGFGb3JtYXQoKSA9PT0gXCItMVwiICkge1xuXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbGVuID0gdGFibGVEYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIGpsZW4gPSB0YWJsZURhdGFbIGkgXS5sZW5ndGg7IGogPCBqbGVuOyBqKysgKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoICF0bXBbIGogXSApIHtcbiAgICAgICAgICAgICAgICAgICAgdG1wWyBqIF0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0bXBbIGogXVsgaSBdID0gdGFibGVEYXRhWyBpIF1bIGogXTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICB0YWJsZURhdGEgPSB0bXA7XG5cbiAgICB9XG5cbiAgICBjYXRlZ29yaWVzID0gdGFibGVEYXRhWzBdLnNsaWNlKCAxICk7XG5cbiAgICBmb3IgKCB2YXIgaSA9IDEsIGRhdGE7IGRhdGEgPSB0YWJsZURhdGFbIGkgXTsgaSsrICkge1xuXG4gICAgICAgIHNlcmllcy5wdXNoKCB7XG4gICAgICAgICAgICBuYW1lOiBkYXRhWyAwIF0sXG4gICAgICAgICAgICBkYXRhOiBkYXRhLnNsaWNlKCAxIClcbiAgICAgICAgfSApO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VyaWVzOiBzZXJpZXMsXG4gICAgICAgIGNhdGVnb3JpZXM6IGNhdGVnb3JpZXNcbiAgICB9O1xuXG59XG5cbi8qXG4gKiDojrflj5bmlbDmja7mupDmlbDmja7lr7npvZDmlrnlvI9cbiAqL1xuZnVuY3Rpb24gZ2V0VGFibGVEYXRhRm9ybWF0ICgpIHtcblxuICAgIHZhciBmb3JtID0gZG9jdW1lbnQuZm9ybXNbICdkYXRhLWZvcm0nIF0sXG4gICAgICAgIGl0ZW1zID0gZm9ybVsnY2hhcnRzLWZvcm1hdCddO1xuXG4gICAgcmV0dXJuIGl0ZW1zWyAwIF0uY2hlY2tlZCA/IGl0ZW1zWyAwIF0udmFsdWUgOiBpdGVtc1sgMSBdLnZhbHVlO1xuXG59XG5cbi8qXG4gKiDnpoHnlKjpnZ7ppbzlm77nsbvlnovnmoTphY3nva7poblcbiAqL1xuZnVuY3Rpb24gZGlzYWJsZU5vdFBpZUNvbmZpZygpIHtcblxuICAgIHVwZGF0ZUNvbmZpZ0l0ZW0oICdkaXNhYmxlJyApO1xuXG59XG5cbi8qXG4gKiDlkK/nlKjpnZ7ppbzlm77nsbvlnovnmoTphY3nva7poblcbiAqL1xuZnVuY3Rpb24gZW5hYmxlTm90UGllQ29uZmlnKCkge1xuXG4gICAgdXBkYXRlQ29uZmlnSXRlbSggJ2VuYWJsZScgKTtcblxufVxuXG5mdW5jdGlvbiB1cGRhdGVDb25maWdJdGVtICggdmFsdWUgKSB7XG5cbiAgICB2YXIgdGFibGUgPSAkKCBcIiNzaG93VGFibGVcIiApWyAwIF0sXG4gICAgICAgIGlzRGlzYWJsZSA9IHZhbHVlID09PSAnZGlzYWJsZScgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAvL3RhYmxl5Lit55qEaW5wdXTlpITnkIZcbiAgICBmb3IgKCB2YXIgaSA9IDIgLCByb3c7IHJvdyA9IHRhYmxlLnJvd3NbIGkgXTsgaSsrICkge1xuXG4gICAgICAgIGZvciAoIHZhciBqID0gMSwgY2VsbDsgY2VsbCA9IHJvdy5jZWxsc1sgaiBdOyBqKysgKSB7XG5cbiAgICAgICAgICAgICQoIFwiaW5wdXRcIiwgY2VsbCApLmF0dHIoIFwiZGlzYWJsZWRcIiwgaXNEaXNhYmxlICk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLy/lhbbku5bpobnlpITnkIZcbiAgICAkKCBcImlucHV0Lm5vdC1waWUtaXRlbVwiICkuYXR0ciggXCJkaXNhYmxlZFwiLCBpc0Rpc2FibGUgKTtcbiAgICAkKCBcIiN0aXBJbnB1dFwiICkuYXR0ciggXCJkaXNhYmxlZFwiLCAhaXNEaXNhYmxlIClcblxufVxuXG4vKlxuICog6I635Y+W6aW85Zu+5pWw5o2uXG4gKiDppbzlm77nmoTmlbDmja7lj6rlj5bnrKzkuIDooYznmoRcbiAqKi9cbmZ1bmN0aW9uIGdldFNlcmllc0ZvclBpZUNoYXJ0ICgpIHtcblxuICAgIHZhciBzZXJpZXMgPSB7XG4gICAgICAgICAgICB0eXBlOiAncGllJyxcbiAgICAgICAgICAgIG5hbWU6ICQoXCIjdGlwSW5wdXRcIikudmFsKCksXG4gICAgICAgICAgICBkYXRhOiBbXVxuICAgICAgICB9LFxuICAgICAgICB0YWJsZURhdGEgPSBnZXRUYWJsZURhdGEoKTtcblxuXG4gICAgZm9yICggdmFyIGogPSAxLCBqbGVuID0gdGFibGVEYXRhWyAwIF0ubGVuZ3RoOyBqIDwgamxlbjsgaisrICkge1xuXG4gICAgICAgIHZhciB0aXRsZSA9IHRhYmxlRGF0YVsgMCBdWyBqIF0sXG4gICAgICAgICAgICB2YWwgPSB0YWJsZURhdGFbIDEgXVsgaiBdO1xuXG4gICAgICAgIHNlcmllcy5kYXRhLnB1c2goIFsgdGl0bGUsIHZhbCBdICk7XG5cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzZXJpZXM6IFsgc2VyaWVzIF1cbiAgICB9O1xuXG59XG5cbmZ1bmN0aW9uIGdldFRhYmxlRGF0YSAoKSB7XG5cbiAgICB2YXIgdGFibGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJzaG93VGFibGVcIiApLFxuICAgICAgICB4Q291bnQgPSB0YWJsZS5yb3dzWzBdLmNlbGxzLmxlbmd0aCAtIDEsXG4gICAgICAgIHZhbHVlcyA9IGdldFRhYmxlSW5wdXRWYWx1ZSgpO1xuXG4gICAgZm9yICggdmFyIGkgPSAwLCB2YWx1ZTsgdmFsdWUgPSB2YWx1ZXNbIGkgXTsgaSsrICkge1xuXG4gICAgICAgIHRhYmxlRGF0YVsgTWF0aC5mbG9vciggaSAvIHhDb3VudCApICsgMSBdWyBpICUgeENvdW50ICsgMSBdID0gdmFsdWVzWyBpIF07XG5cbiAgICB9XG5cbiAgICByZXR1cm4gdGFibGVEYXRhO1xuXG59XG5cbmZ1bmN0aW9uIGdldFRhYmxlSW5wdXRWYWx1ZSAoKSB7XG5cbiAgICB2YXIgdGFibGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJzaG93VGFibGVcIiApLFxuICAgICAgICBpbnB1dHMgPSB0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZSggXCJpbnB1dFwiICksXG4gICAgICAgIHZhbHVlcyA9IFtdO1xuXG4gICAgZm9yICggdmFyIGkgPSAwLCBpbnB1dDsgaW5wdXQgPSBpbnB1dHNbIGkgXTsgaSsrICkge1xuICAgICAgICB2YWx1ZXMucHVzaCggaW5wdXQudmFsdWUgfCAwICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlcztcblxufVxuXG5mdW5jdGlvbiBnZXRDZWxsVmFsdWUgKCBjZWxsICkge1xuXG4gICAgdmFyIHZhbHVlID0gdXRpbHMudHJpbSggKCBjZWxsLmlubmVyVGV4dCB8fCBjZWxsLnRleHRDb250ZW50IHx8ICcnICkgKTtcblxuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKCBuZXcgUmVnRXhwKCBVRS5kb20uZG9tVXRpbHMuZmlsbENoYXIsICdnJyApLCAnJyApLnJlcGxhY2UoIC9eXFxzK3xcXHMrJC9nLCAnJyApO1xuXG59XG5cblxuLy9kaWFsb2fnoa7orqTkuovku7ZcbmRpYWxvZy5vbm9rID0gZnVuY3Rpb24gKCkge1xuXG4gICAgLy/mlLbpm4bkv6Hmga9cbiAgICB2YXIgZm9ybSA9IGRvY3VtZW50LmZvcm1zWyAnZGF0YS1mb3JtJyBdLFxuICAgICAgICBpbmZvID0gZ2V0VXNlckNvbmZpZygpO1xuXG4gICAgLy/mt7vliqDlm77ooajnsbvlnotcbiAgICBpbmZvLmNoYXJ0VHlwZSA9IGN1cnJlbnRDaGFydFR5cGU7XG5cbiAgICAvL+WQjOatpeihqOagvOaVsOaNruWIsOe8lui+keWZqFxuICAgIHN5bmNUYWJsZURhdGEoKTtcblxuICAgIC8v5omn6KGM5Zu+6KGo5ZG95LukXG4gICAgZWRpdG9yLmV4ZWNDb21tYW5kKCAnY2hhcnRzJywgaW5mbyApO1xuXG59O1xuXG4vKlxuICog5ZCM5q2l5Zu+6KGo57yW6L6R6KeG5Zu+55qE6KGo5qC85pWw5o2u5Yiw57yW6L6R5Zmo6YeM55qE5Y6f5aeL6KGo5qC8XG4gKi9cbmZ1bmN0aW9uIHN5bmNUYWJsZURhdGEgKCkge1xuXG4gICAgdmFyIHRhYmxlRGF0YSA9IGdldFRhYmxlRGF0YSgpO1xuXG4gICAgZm9yICggdmFyIGkgPSAxLCByb3c7IHJvdyA9IGVkaXRvclRhYmxlLnJvd3NbIGkgXTsgaSsrICkge1xuXG4gICAgICAgIGZvciAoIHZhciBqID0gMSwgY2VsbDsgY2VsbCA9IHJvdy5jZWxsc1sgaiBdOyBqKysgKSB7XG5cbiAgICAgICAgICAgIGNlbGwuaW5uZXJIVE1MID0gdGFibGVEYXRhWyBpIF0gWyBqIF07XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG59Il0sImZpbGUiOiJwbHVnaW5zL3VlZGl0b3IvZGlhbG9ncy9jaGFydHMvY2hhcnRzLmpzIn0=
