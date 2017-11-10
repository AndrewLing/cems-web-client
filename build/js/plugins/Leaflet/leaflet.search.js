/* 
 * Leaflet Control Search v2.7.0 - 2016-09-13 
 * 
 * Copyright 2016 Stefano Cudini 
 * stefano.cudini@gmail.com 
 * http://labs.easyblog.it/ 
 * 
 * Licensed under the MIT license. 
 * 
 * Demo: 
 * http://labs.easyblog.it/maps/leaflet-search/ 
 * 
 * Source: 
 * git@github.com:stefanocudini/leaflet-search.git 
 * 
 */
(function (factory) {
    if(typeof define === 'function' && define.amd) {
    //AMD
        define(['leaflet'], factory);
    } else if(typeof module !== 'undefined') {
    // Node/CommonJS
        module.exports = factory(require('leaflet'));
    } else {
    // Browser globals
        if(typeof window.L === 'undefined')
            throw 'Leaflet must be loaded first';
        factory(window.L);
    }
})(function (L) {

	function _getPath(obj, prop) {
		var parts = prop.split('.'),
			last = parts.pop(),
			len = parts.length,
			cur = parts[0],
			i = 1;

		if(len > 0)
			while((obj = obj[cur]) && i < len)
				cur = parts[i++];

		if(obj)
			return obj[last];
	}

	function _isObject(obj) {
		return Object.prototype.toString.call(obj) === "[object Object]";
	}


L.Control.Search = L.Control.extend({
	includes: L.Mixin.Events,
	//
	//	Name					Data passed			   Description
	//
	//Managed Events:
	//	search:locationfound	{latlng, title, layer} fired after moved and show markerLocation
	//	search:expanded			{}					   fired after control was expanded
	//  search:collapsed		{}					   fired after control was collapsed
	//
	//Public methods:
	//  setLayer()				L.LayerGroup()         set layer search at runtime
	//  showAlert()             'Text message'         show alert message
	//  searchText()			'Text searched'        search text by external code
	//
	options: {
        clickCallback: null,
		url: '',						//url for search by ajax request, ex: "search.php?q={s}". Can be function that returns string for dynamic parameter setting
		layer: null,					//layer where search markers(is a L.LayerGroup)				
		sourceData: null,				//function that fill _recordsCache, passed searching text by first param and callback in second				
		//TODO implements uniq option 'sourceData' that recognizes source type: url,array,callback or layer				
		jsonpParam: null,				//jsonp param name for search by jsonp service, ex: "callback"
		propertyLoc: 'loc',				//field for remapping location, using array: ['latname','lonname'] for select double fields(ex. ['lat','lon'] ) support dotted format: 'prop.subprop.title'
		propertyName: 'title',			//property in marker.options(or feature.properties for vector layer) trough filter elements in layer,
        filterProperty: null,
        filterOptions: null,
        filterCallback: null,
		formatData: null,				//callback for reformat all data from source to indexed data object
		filterData: null,				//callback for filtering data from text searched, params: textSearch, allRecords
		moveToLocation: null,			//callback run on location found, params: latlng, title, map
		buildTip: null,					//function that return row tip html node(or html string), receive text tooltip in first param
		container: '',					//container id to insert Search Control		
		zoom: null,						//default zoom level for move to location
		minLength: 1,					//minimal text length for autocomplete
		initial: true,					//search elements only by initial text
		casesensitive: false,			//search elements in case sensitive text
		autoType: true,					//complete input with first suggested result and select this filled-in text.
		delayType: 400,					//delay while typing for show tooltip
		tooltipLimit: -1,				//limit max results to show in tooltip. -1 for no limit.
		tipAutoSubmit: true,			//auto map panTo when click on tooltip
		firstTipSubmit: false,			//auto select first result con enter click
		autoResize: true,				//autoresize on input change
		collapsed: true,				//collapse search control at startup
		autoCollapse: false,			//collapse search control after submit(on button or on tips if enabled tipAutoSubmit)
		autoCollapseTime: 1200,			//delay for autoclosing alert and collapse after blur
		textErr: 'Location not found',	//error message
		textCancel: 'Cancel',		    //title in cancel button		
		textPlaceholder: 'Search...',   //placeholder value			
		position: 'topleft',
		hideMarkerOnCollapse: false,    //remove circle and marker on search control collapsed		
		marker: {						//custom L.Marker or false for hide
			icon: false,				//custom L.Icon for maker location or false for hide
			animate: true,				//animate a circle over location found
			circle: {					//draw a circle in location found
				radius: 10,
				weight: 3,
				color: '#e03',
				stroke: true,
				fill: false
			}
		}
		//TODO implement can do research on multiple sources layers and remote		
		//TODO history: false,		//show latest searches in tooltip		
	},
//FIXME option condition problem {autoCollapse: true, markerLocation: true} not show location
//FIXME option condition problem {autoCollapse: false }
//
//TODO here insert function that search inputText FIRST in _recordsCache keys and if not find results.. 
//  run one of callbacks search(sourceData,jsonpUrl or options.layer) and run this.showTooltip
//
//TODO change structure of _recordsCache
//	like this: _recordsCache = {"text-key1": {loc:[lat,lng], ..other attributes.. }, {"text-key2": {loc:[lat,lng]}...}, ...}
//	in this mode every record can have a free structure of attributes, only 'loc' is required
	
	initialize: function(options) {
		L.Util.setOptions(this, options || {});
		this._inputMinSize = this.options.textPlaceholder ? this.options.textPlaceholder.length : 10;
		this._layer = this.options.layer || new L.LayerGroup();
		this._filterData = this.options.filterData || this._defaultFilterData;
		this._formatData = this.options.formatData || this._defaultFormatData;
		this._moveToLocation = this.options.moveToLocation || this._defaultMoveToLocation;
		this._autoTypeTmp = this.options.autoType;	//useful for disable autoType temporarily in delete/backspace keydown
		this._countertips = 0;		//number of tips items
		this._recordsCache = {};	//key,value table! that store locations! format: key,latlng
		this._curReq = null;
	},

	onAdd: function (map) {
		this._map = map;
		this._container = L.DomUtil.create('div', 'leaflet-control-search');
		this._input = this._createInput(this.options.textPlaceholder, 'search-input');
		this._tooltip = this._createTooltip('search-tooltip');
		this._cancel = this._createCancel(this.options.textCancel, 'search-cancel');
		this._button = this._createButton(this.options.textPlaceholder, 'search-button');
        this._dropdown = this._createDropDown(this.options.textPlaceholder, 'search-button');
		this._alert = this._createAlert('search-alert');


		if(this.options.collapsed===false)
			this.expand(this.options.collapsed);

		if(this.options.marker) {
			
			if(this.options.marker instanceof L.Marker || this.options.marker instanceof L.CircleMarker)
				this._markerSearch = this.options.marker;

			else if(_isObject(this.options.marker))
				this._markerSearch = new L.Control.Search.Marker([0,0], this.options.marker);

			this._markerSearch._isMarkerSearch = true;
		}

		this.setLayer( this._layer );

		map.on({
			// 		'layeradd': this._onLayerAddRemove,
			// 		'layerremove': this._onLayerAddRemove
			'resize': this._handleAutoresize
			}, this);
		return this._container;
	},
	addTo: function (map) {

		if(this.options.container) {
			this._container = this.onAdd(map);
			this._wrapper = L.DomUtil.get(this.options.container);
			this._wrapper.style.position = 'relative';
			this._wrapper.appendChild(this._container);
		}
		else
			L.Control.prototype.addTo.call(this, map);

		return this;
	},

	onRemove: function(map) {
		this._recordsCache = {};
		// map.off({
		// 		'layeradd': this._onLayerAddRemove,
		// 		'layerremove': this._onLayerAddRemove
		// 	}, this);
	},

	// _onLayerAddRemove: function(e) {
	// 	//without this, run setLayer also for each Markers!! to optimize!
	// 	if(e.layer instanceof L.LayerGroup)
	// 		if( L.stamp(e.layer) != L.stamp(this._layer) )
	// 			this.setLayer(e.layer);
	// },

	setLayer: function(layer) {	//set search layer at runtime
		//this.options.layer = layer; //setting this, run only this._recordsFromLayer()
		this._layer = layer;
		this._layer.addTo(this._map);
		return this;
	},
	
	showAlert: function(text) {
		text = text || this.options.textErr;
		this._alert.style.display = 'block';
		this._alert.innerHTML = text;
		clearTimeout(this.timerAlert);
		var that = this;		
		this.timerAlert = setTimeout(function() {
			that.hideAlert();
		},this.options.autoCollapseTime);
		return this;
	},
	
	hideAlert: function() {
		this._alert.style.display = 'none';
		return this;
	},
		
	cancel: function() {
		this._input.value = '';
		this._handleKeypress({ keyCode: 8 });//simulate backspace keypress
		this._input.size = this._inputMinSize;
		this._input.focus();
		this._cancel.style.visibility = 'hidden';
		this._hideTooltip();
		return this;
	},
	
	expand: function(toggle) {
		toggle = typeof toggle === 'boolean' ? toggle : true;
		this._input.style.display = 'block';
		L.DomUtil.addClass(this._container, 'search-exp');
		if ( toggle !== false ) {
			this._input.focus();
			this._map.on('dragstart click', this.collapse, this);
		}
		this.fire('search:expanded');
		return this;	
	},

	collapse: function() {
		this._hideTooltip();
		this.cancel();
		this._alert.style.display = 'none';
		this._input.blur();
		if(this.options.collapsed)
		{
			this._input.style.display = 'none';
			this._cancel.style.visibility = 'hidden';
			L.DomUtil.removeClass(this._container, 'search-exp');		
			if (this.options.hideMarkerOnCollapse) {
				this._map.removeLayer(this._markerSearch);
			}
			this._map.off('dragstart click', this.collapse, this);
		}
		this.fire('search:collapsed');
		return this;
	},
	
	collapseDelayed: function() {	//collapse after delay, used on_input blur
		if (!this.options.autoCollapse) return this;
		var that = this;
		clearTimeout(this.timerCollapse);
		this.timerCollapse = setTimeout(function() {
			that.collapse();
		}, this.options.autoCollapseTime);
		return this;		
	},

	collapseDelayedStop: function() {
		clearTimeout(this.timerCollapse);
		return this;		
	},

////start DOM creations
	_createAlert: function(className) {
		var alert = L.DomUtil.create('div', className, this._container);
		alert.style.display = 'none';

		L.DomEvent
			.on(alert, 'click', L.DomEvent.stop, this)
			.on(alert, 'click', this.hideAlert, this);

		return alert;
	},

	_createInput: function (text, className) {
		var label = L.DomUtil.create('label', className, this._container);
		var input = L.DomUtil.create('input', className, this._container);
		input.type = 'text';
		input.size = this._inputMinSize;
		input.value = '';
		input.autocomplete = 'off';
		input.autocorrect = 'off';
		input.autocapitalize = 'off';
		input.placeholder = text;
		input.style.display = 'none';
		input.role = 'search';
		input.id = input.role + input.type + input.size;
		
		label.htmlFor = input.id;
		label.style.display = 'none';
		label.value = text;

		L.DomEvent
			.disableClickPropagation(input)
			.on(input, 'keyup', this._handleKeypress, this)
			.on(input, 'blur', this.collapseDelayed, this)
			.on(input, 'focus', this.collapseDelayedStop, this);
		
		return input;
	},

	_createCancel: function (title, className) {
		var cancelContainer = L.DomUtil.create('a', className, this._container);
        cancelContainer.href = 'javascript:void(0);';
        cancelContainer.title = title;
        cancelContainer.style.display = 'none';
        cancelContainer.style.display = 'block';
        var cancelIcon = L.DomUtil.create('span', 'icon animated fadeInUp', cancelContainer);
        cancelIcon.style.visibility = 'hidden';

		L.DomEvent
			.on(cancelIcon, 'click', L.DomEvent.stop, this)
			.on(cancelIcon, 'click', this.cancel, this);

		return cancelIcon;
	},

    _createDropDown: function (title, className) {
	    if(this.options.filterOptions == null || this.options.filterOptions.length == 0){
	        return; null
        }
        var markerCluster = this._layer;
        var markerGroup = {};// 根据filterOptions将makers分为多个组, 根据不同的下拉选项, 展示对应的marker

        //Select leaflet class
        var dropdown = L.DomUtil.create('div', 'leaflet-control-search-filter', this._container);
        var filter = L.DomUtil.create('div', 'filter', dropdown);
        var title = L.DomUtil.create('span', 'title', filter);
        title.innerHTML = '<img value="" class="filterIcon" src="" style="visibility: hidden;"></img>'+this.options.filterOptions[0].title;

        //Select Icon (Chevron down)
        var icon = L.DomUtil.create('i', 'fa fa-chevron-up pull-right', title);

        //List of items
        var items = L.DomUtil.create('ul', 'items collapsed ', filter);

        //Add items to the list
        var component = this;
        this.options.filterOptions.forEach(function(item){
            var li = L.DomUtil.create('li');
            if($.trim(item.icon)==""){
                li.innerHTML = '<img value="'+item.value+'" class="filterIcon" src="'+item.icon+'" style="visibility: hidden;"></img>'+item.title;
			}else{
                li.innerHTML = '<img value="'+item.value+'" class="filterIcon" src="'+item.icon+'" style="visibility: visible;"></img>'+item.title;
			}

            if(item.selected == true) {
                li.className = "selected";
            }

            L.DomEvent.addListener(li, 'click', function(e) {
                $(dropdown).attr("value", $(e.currentTarget).find("img").attr("value"));
                $(title).html($(e.currentTarget).html());
                
                if (component.options.filterCallback != null) {
                    component.options.filterCallback($(dropdown).attr("value"));
                } else {
                    // 显示不同分组的数据
                    markerCluster.clearLayers();
                    $(markerGroup["V_"+$(dropdown).attr("value")]).each(function(idx, marker){
                        markerCluster.addLayer(marker);
                    });
                }
            });
            items.appendChild(li);
            //markers 分组
            markerGroup["V_"+item.value] = [];
            this._layer.eachLayer(function(layer) {
                if((layer instanceof L.Marker || layer instanceof L.CircleMarker)){
                    if(this.options.filterProperty && layer.options[this.options.filterProperty] == $.trim(item.value)
                    || $.trim(item.value) == ""){
                        markerGroup["V_"+item.value].push(layer);
                    }
                }
            },this);
        }, this);
        var toggleDropdown = function () {
            $(items).slideToggle(200);
            $(icon).toggleClass('fa-chevron-down fa-chevron-up');
        };

        L.DomEvent.addListener(filter, 'click', function(e) {
            component._hideTooltip();
            toggleDropdown();
        });

        //Avoid click propagation
        L.DomEvent.disableClickPropagation(dropdown);
        L.DomEvent.disableScrollPropagation(dropdown);

        return dropdown;
    },



	_createButton: function (title, className) {
		var button = L.DomUtil.create('a', className, this._container);
		button.href = 'javascript:void(0);';
		button.title = title;

		L.DomEvent
			.on(button, 'click', L.DomEvent.stop, this)
			.on(button, 'click', this._handleSubmit, this)			
			.on(button, 'focus', this.collapseDelayedStop, this)
			.on(button, 'blur', this.collapseDelayed, this);

		return button;
	},

	_createTooltip: function(className) {
		var tool = L.DomUtil.create('ul', className, this._container);
		tool.style.display = 'none';

		var that = this;
		L.DomEvent
			.disableClickPropagation(tool)
			.on(tool, 'blur', this.collapseDelayed, this)
			.on(tool, 'mousewheel', function(e) {
				that.collapseDelayedStop();
				L.DomEvent.stopPropagation(e);//disable zoom map
			}, this)
			.on(tool, 'mouseover', function(e) {
				that.collapseDelayedStop();
			}, this);
		return tool;
	},

	_createTip: function(text, val) {//val is object in recordCache, usually is Latlng
		var tip;
		
		if(this.options.buildTip)
		{
			tip = this.options.buildTip.call(this, text, val); //custom tip node or html string
			if(typeof tip === 'string')
			{
				var tmpNode = L.DomUtil.create('div');
				tmpNode.innerHTML = tip;
				tip = tmpNode.firstChild;
			}
		}
		else
		{
			tip = L.DomUtil.create('li', '');
			tip.innerHTML = text;
		}
		
		L.DomUtil.addClass(tip, 'search-tip');
		tip._text = text; //value replaced in this._input and used by _autoType

		if(this.options.tipAutoSubmit)
			L.DomEvent
				.disableClickPropagation(tip)		
				.on(tip, 'click', L.DomEvent.stop, this)
				.on(tip, 'click', function(e) {
					this._input.value = text;
					this._handleAutoresize();
					this._input.focus();
					this._hideTooltip();	
					this._handleSubmit();
				}, this);

		return tip;
	},

//////end DOM creations

	_getUrl: function(text) {
		return (typeof this.options.url === 'function') ? this.options.url(text) : this.options.url;
	},

	_defaultFilterData: function(text, records) {
	
		var I, icase, regSearch, frecords = {};

		text = text.replace(/[.*+?^${}()|[\]\\]/g, '');  //sanitize remove all special characters
		if(text==='')
			return {};

		I = this.options.initial ? '^' : '';  //search only initial text
		icase = !this.options.casesensitive ? 'i' : undefined;

		regSearch = new RegExp(I + text, icase);

		//TODO use .filter or .map
		for(var key in records) {
			if( regSearch.test(key) )
				frecords[key]= records[key];
		}
		
		return frecords;
	},

	showTooltip: function(records) {
		var tip;

		this._countertips = 0;
				
		this._tooltip.innerHTML = '';
		this._tooltip.currentSelection = -1;  //inizialized for _handleArrowSelect()

		for(var key in records)//fill tooltip
		{
			if(++this._countertips == this.options.tooltipLimit) break;

			tip = this._createTip(key, records[key] );

			this._tooltip.appendChild(tip);
		}
		
		if(this._countertips > 0)
		{
			this._tooltip.style.display = 'block';
			if(this._autoTypeTmp)
				this._autoType();
			this._autoTypeTmp = this.options.autoType;//reset default value
		}
		else
			this._hideTooltip();

		this._tooltip.scrollTop = 0;
		return this._countertips;
	},

	_hideTooltip: function() {
		this._tooltip.style.display = 'none';
		this._tooltip.innerHTML = '';
		return 0;
	},

	_defaultFormatData: function(json) {	//default callback for format data to indexed data
		var propName = this.options.propertyName,
			propLoc = this.options.propertyLoc;
		this._recordsCache = {};
		if( L.Util.isArray(propLoc) )
			for(var i=0; i<json.length; i++)
                this._recordsCache[ _getPath(json[i],propName) ]= L.latLng( json[i][ propLoc[0] ], json[i][ propLoc[1] ] );
		else
            for(var i=0; i<json.length; i++)
                this._recordsCache[ _getPath(json[i],propName) ]= L.latLng( _getPath(json[i],propLoc) );
	},

	_recordsFromJsonp: function(text, callAfter) {  //extract searched records from remote jsonp service
		L.Control.Search.callJsonp = callAfter;
		var script = L.DomUtil.create('script','leaflet-search-jsonp', document.getElementsByTagName('body')[0] ),			
			url = L.Util.template(this._getUrl(text)+'&'+this.options.jsonpParam+'=L.Control.Search.callJsonp', {s: text}); //parsing url
			//rnd = '&_='+Math.floor(Math.random()*10000);
			//TODO add rnd param or randomize callback name! in recordsFromJsonp
		script.type = 'text/javascript';
		script.src = url;
		return { abort: function() { script.parentNode.removeChild(script); } };
	},

	_recordsFromAjax: function(text, callAfter) {	//Ajax request
		if (window.XMLHttpRequest === undefined) {
			window.XMLHttpRequest = function() {
				try { return new ActiveXObject("Microsoft.XMLHTTP.6.0"); }
				catch  (e1) {
					try { return new ActiveXObject("Microsoft.XMLHTTP.3.0"); }
					catch (e2) { throw new Error("XMLHttpRequest is not supported"); }
				}
			};
		}
		var IE8or9 = ( L.Browser.ie && !window.atob && document.querySelector ),
			request = IE8or9 ? new XDomainRequest() : new XMLHttpRequest(),
			url = L.Util.template(this._getUrl(text), {s: text});

		//rnd = '&_='+Math.floor(Math.random()*10000);
		//TODO add rnd param or randomize callback name! in recordsFromAjax			
		
		request.open("GET", url);
		var that = this;

		request.onload = function() {
			callAfter( JSON.parse(request.responseText) );
		};
		request.onreadystatechange = function() {
		    if(request.readyState === 4 && request.status === 200) {
		    	this.onload();
		    }
		};

		request.send();
		return request;   
	},
	
	_recordsFromLayer: function() {	//return table: key,value from layer
		var that = this,
			retRecords = {},
			propName = this.options.propertyName,
			loc;
		var _dropdownValue = $.trim($(".leaflet-control-search-filter").attr("value"));
		this._layer.eachLayer(function(layer) {

			if(layer.hasOwnProperty('_isMarkerSearch')) return;

			if(layer instanceof L.Marker || layer instanceof L.CircleMarker)
			{
				try {

					if(_getPath(layer.options,propName) &&
						// 无下拉限定值, 或者有下拉限定的属性但该属性在marker的options中不存在
						(_dropdownValue == "" || this.options.filterProperty == null || layer.options[this.options.filterProperty] == null
						// 下拉限定值域 marker的对应属性匹配
						|| this.options.filterProperty && (layer.options[this.options.filterProperty] == _dropdownValue))) //可能的值  连接中断 "1"; 故障 "2"; 健康 "3";
					{
						loc = layer.getLatLng();
						loc.layer = layer;
						retRecords[ _getPath(layer.options,propName) ] = loc;
						
					}
					// else if(_getPath(layer.feature.properties,propName)  &&
					// 	($.trim(this._dropdown.value) =="" || this.options.filterProperty == null || layer.options[this.options.v] == null
					// 		|| (this.options.filterProperty && layer.options[this.options.v]) == this._dropdown.value)){
					//
					// 	loc = layer.getLatLng();
					// 	loc.layer = layer;
					// 	retRecords[ _getPath(layer.feature.properties,propName) ] = loc;
					//
					// }
					// else
					// 	throw new Error("propertyName '"+propName+"' not found in marker");
					
				}
				catch(err){
					if (console) {  }
				}
			}
            else if(layer.hasOwnProperty('feature'))//GeoJSON
			{
				try {
					if(layer.feature.properties.hasOwnProperty(propName))
					{
						loc = layer.getBounds().getCenter();
						loc.layer = layer;			
						retRecords[ layer.feature.properties[propName] ] = loc;
					}
					else
						throw new Error("propertyName '"+propName+"' not found in feature");
				}
				catch(err){
					if (console) {  }
				}
			}
			else if(layer instanceof L.LayerGroup)
            {
                //TODO: Optimize
                layer.eachLayer(function(m) {
                    loc = m.getLatLng();
                    loc.layer = m;
                    retRecords[ m.feature.properties[propName] ] = loc;
                });
            }
			
		},this);
		
		return retRecords;
	},

	_autoType: function() {
		
		//TODO implements autype without selection(useful for mobile device)
		
		var start = this._input.value.length,
			firstRecord = this._tooltip.firstChild._text,
			end = firstRecord.length;

		if (firstRecord.indexOf(this._input.value) === 0) { // If prefix match
			this._input.value = firstRecord;
			this._handleAutoresize();

			if (this._input.createTextRange) {
				var selRange = this._input.createTextRange();
				selRange.collapse(true);
				selRange.moveStart('character', start);
				selRange.moveEnd('character', end);
				selRange.select();
			}
			else if(this._input.setSelectionRange) {
				this._input.setSelectionRange(start, end);
			}
			else if(this._input.selectionStart) {
				this._input.selectionStart = start;
				this._input.selectionEnd = end;
			}
		}
	},

	_hideAutoType: function() {	// deselect text:

		var sel;
		if ((sel = this._input.selection) && sel.empty) {
			sel.empty();
		}
		else if (this._input.createTextRange) {
			sel = this._input.createTextRange();
			sel.collapse(true);
			var end = this._input.value.length;
			sel.moveStart('character', end);
			sel.moveEnd('character', end);
			sel.select();
		}
		else {
			if (this._input.getSelection) {
				this._input.getSelection().removeAllRanges();
			}
			this._input.selectionStart = this._input.selectionEnd;
		}
	},
	
	_handleKeypress: function (e) {	//run _input keyup event
		switch(e.keyCode)
		{
			case 27://Esc
				this.collapse();
			    break;
			case 13://Enter
                if((main.getBrowser().mozilla || main.getBrowser().msie) && $.isEmptyObject(this._recordsCache)){
                    if(this._input.value.length)
                        this._cancel.style.visibility = 'visible';
                    else
                        this._cancel.style.visibility = 'hidden';

                    this._fillRecordsCache();
                }
				if(this._countertips == 1 || (this.options.firstTipSubmit && this._countertips > 0))
					this._handleArrowSelect(1);
				this._handleSubmit();	//do search
			    break;
			case 38://Up
				this._handleArrowSelect(-1);
			    break;

			case 45://Insert
				this._autoTypeTmp = false;//disable temporarily autoType
			    break;
			case 37://Left
			case 39://Right
			case 16://Shift
			case 17://Ctrl
			case 35://End
			case 36://Home
			    break;
            default://All keys
                // 向下箭头, 触发自动补全
                if(e.keyCode == 40 && $(".search-tip").length > 0){
                    this._handleArrowSelect(1);
                    return;
                }

				if(this._input.value.length)
					this._cancel.style.visibility = 'visible';
				else
					this._cancel.style.visibility = 'hidden';
				if(this._input.value.length >= this.options.minLength)
				{
					var that = this;

					clearTimeout(this.timerKeypress);	//cancel last search request while type in				
					this.timerKeypress = setTimeout(function() {	//delay before request, for limit jsonp/ajax request

						that._fillRecordsCache();
					
					}, this.options.delayType);
				}
				else
					this._hideTooltip();
		}

		this._handleAutoresize();
	},

	searchText: function(text) {
		var code = text.charCodeAt(text.length);

		this._input.value = text;

		this._input.style.display = 'block';
		L.DomUtil.addClass(this._container, 'search-exp');

		this._autoTypeTmp = false;

		this._handleKeypress({keyCode: code});
	},
	
	_fillRecordsCache: function() {
//TODO important optimization!!! always append data in this._recordsCache
//  now _recordsCache content is emptied and replaced with new data founded
//  always appending data on _recordsCache give the possibility of caching ajax, jsonp and layersearch!
//
//TODO here insert function that search inputText FIRST in _recordsCache keys and if not find results.. 
//  run one of callbacks search(sourceData,jsonpUrl or options.layer) and run this.showTooltip
//
//TODO change structure of _recordsCache
//	like this: _recordsCache = {"text-key1": {loc:[lat,lng], ..other attributes.. }, {"text-key2": {loc:[lat,lng]}...}, ...}
//	in this way every record can have a free structure of attributes, only 'loc' is required
        //先将电站类别选择隐藏
        $(".leaflet-control-search-filter .items").css('display','none');
		var inputText = this._input.value,
			that = this, records;

		if(this._curReq && this._curReq.abort)
			this._curReq.abort();
		//abort previous requests

		L.DomUtil.addClass(this._container, 'search-load');	

		if(this.options.layer)
		{
			//TODO _recordsFromLayer must return array of objects, formatted from _formatData
			this._recordsCache = this._recordsFromLayer();

			records = this._filterData( this._input.value, this._recordsCache );
			this.showTooltip( records );

			L.DomUtil.removeClass(this._container, 'search-load');
		}
        if(this.options.sourceData)
            this._retrieveData = this.options.sourceData;

        else if(this.options.url)	//jsonp or ajax
            this._retrieveData = this.options.jsonpParam ? this._recordsFromJsonp : this._recordsFromAjax;

        this._curReq = this._retrieveData && this._retrieveData.call(this, inputText, function(response) {
            that._formatData.call(that, response);
            //TODO refact!
            if(that.options.sourceData)
                records = that._filterData( that._input.value, that._recordsCache );
            else
                records = that._recordsCache;
            that.showTooltip( records );

            L.DomUtil.removeClass(that._container, 'search-load');
        });
	},
	
	_handleAutoresize: function() {	//autoresize this._input
	    //TODO refact _handleAutoresize now is not accurate
	    if (this._input.style.maxWidth != this._map._container.offsetWidth) //If maxWidth isn't the same as when first set, reset to current Map width
	        this._input.style.maxWidth = L.DomUtil.getStyle(this._map._container, 'width');

		if(this.options.autoResize && (this._container.offsetWidth + 45 < this._map._container.offsetWidth))
			this._input.size = this._input.value.length<this._inputMinSize ? this._inputMinSize : this._input.value.length;
	},

	_handleArrowSelect: function(velocity) {
	
		var searchTips = this._tooltip.hasChildNodes() ? this._tooltip.childNodes : [];
        if(searchTips.length == 0){
            return;
        }
		for (i=0; i<searchTips.length; i++)
			L.DomUtil.removeClass(searchTips[i], 'search-tip-select');
		
		if ((velocity == 1 ) && (this._tooltip.currentSelection >= (searchTips.length - 1))) {// If at end of list.
			L.DomUtil.addClass(searchTips[this._tooltip.currentSelection], 'search-tip-select');
		}
		else if ((velocity == -1 ) && (this._tooltip.currentSelection <= 0)) { // Going back up to the search box.
			this._tooltip.currentSelection = -1;
		}
		else if (this._tooltip.style.display != 'none') {
			this._tooltip.currentSelection += velocity;
			
			L.DomUtil.addClass(searchTips[this._tooltip.currentSelection], 'search-tip-select');
			
			this._input.value = searchTips[this._tooltip.currentSelection]._text;

			// scroll:
			var tipOffsetTop = searchTips[this._tooltip.currentSelection].offsetTop;
			
			if (tipOffsetTop + searchTips[this._tooltip.currentSelection].clientHeight >= this._tooltip.scrollTop + this._tooltip.clientHeight) {
				this._tooltip.scrollTop = tipOffsetTop - this._tooltip.clientHeight + searchTips[this._tooltip.currentSelection].clientHeight;
			}
			else if (tipOffsetTop <= this._tooltip.scrollTop) {
				this._tooltip.scrollTop = tipOffsetTop;
			}
		}
	},

	_handleSubmit: function() {	//button and tooltip click and enter submit
        //先将电站类别选择隐藏
        $(".leaflet-control-search-filter .items").css('display','none');
		this._hideAutoType();
		
		this.hideAlert();
		this._hideTooltip();

		if(this._input.style.display == 'none')	//on first click show _input only
			this.expand();
		else
		{
			if(this._input.value === '')	//hide _input only
				this.collapse();
			else
			{
				var loc = this._getLocation(this._input.value);
				
				if(loc===false)
					this.showAlert();
				else
				{
                    if(this.options.clickCallback){
                        this.options.clickCallback.call(this);
                    }
					this.showLocation(loc, this._input.value);
					this.fire('search:locationfound', {
							latlng: loc,
							text: this._input.value,
							layer: loc.layer ? loc.layer : null
						});
				}
			}
		}
	},

	_getLocation: function(key) {	//extract latlng from _recordsCache

		if( this._recordsCache.hasOwnProperty(key) )
			return this._recordsCache[key];//then after use .loc attribute
		else
			return false;
	},

	_defaultMoveToLocation: function(latlng, title, map) {
		if(this.options.zoom)
 			this._map.setView(latlng, this.options.zoom);
 		else
			this._map.panTo(latlng);
	},

	showLocation: function(latlng, title) {	//set location on map from _recordsCache
		var self = this;

		self._map.once('moveend zoomend', function(e) {

			if(self._markerSearch) {
				self._markerSearch.addTo(self._map).setLatLng(latlng);
			}
			
		});

		self._moveToLocation(latlng, title, self._map);
		//FIXME autoCollapse option hide self._markerSearch before that visualized!!
		if(self.options.autoCollapse)
			self.collapse();

		return self;
	}
});

L.Control.Search.Marker = L.Marker.extend({

	includes: L.Mixin.Events,
	
	options: {
		icon: new L.Icon.Default(),
		animate: true,
		circle: {
			radius: 10,
			weight: 3,
			color: '#e03',
			stroke: true,
			fill: false
		}
	},
	
	initialize: function (latlng, options) {
		L.setOptions(this, options);

		if(options.icon === true)
			options.icon = new L.Icon.Default();

		L.Marker.prototype.initialize.call(this, latlng, options);
		
		if( _isObject(this.options.circle) )
			this._circleLoc = new L.CircleMarker(latlng, this.options.circle);
	},

	onAdd: function (map) {
		L.Marker.prototype.onAdd.call(this, map);
		if(this._circleLoc) {
			map.addLayer(this._circleLoc);
			if(this.options.animate)
				this.animate();
		}
	},

	onRemove: function (map) {
		L.Marker.prototype.onRemove.call(this, map);
		if(this._circleLoc)
			map.removeLayer(this._circleLoc);
	},
	
	setLatLng: function (latlng) {
		L.Marker.prototype.setLatLng.call(this, latlng);
		if(this._circleLoc)
			this._circleLoc.setLatLng(latlng);
		return this;
	},
	
	_initIcon: function () {
		if(this.options.icon)
			L.Marker.prototype._initIcon.call(this);
	},

	_removeIcon: function () {
		if(this.options.icon)
			L.Marker.prototype._removeIcon.call(this);
	},

	animate: function() {
	//TODO refact animate() more smooth! like this: http://goo.gl/DDlRs
		if(this._circleLoc)
		{
			var circle = this._circleLoc,
				tInt = 200,	//time interval
				ss = 5,	//frames
				mr = parseInt(circle._radius/ss),
				oldrad = this.options.circle.radius,
				newrad = circle._radius * 2,
				acc = 0;

			circle._timerAnimLoc = setInterval(function() {
				acc += 0.5;
				mr += acc;	//adding acceleration
				newrad -= mr;
				
				circle.setRadius(newrad);

				if(newrad<oldrad)
				{
					clearInterval(circle._timerAnimLoc);
					circle.setRadius(oldrad);//reset radius
					//if(typeof afterAnimCall == 'function')
						//afterAnimCall();
						//TODO use create event 'animateEnd' in L.Control.Search.Marker 
				}
			}, tInt);
		}
		
		return this;
	}
});

L.Map.addInitHook(function () {
    if (this.options.searchControl) {
        this.searchControl = L.control.search(this.options.searchControl);
        this.addControl(this.searchControl);
    }
});

L.control.search = function (options) {
    return new L.Control.Search(options);
};

return L.Control.Search;

});



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL0xlYWZsZXQvbGVhZmxldC5zZWFyY2guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gKiBMZWFmbGV0IENvbnRyb2wgU2VhcmNoIHYyLjcuMCAtIDIwMTYtMDktMTMgXG4gKiBcbiAqIENvcHlyaWdodCAyMDE2IFN0ZWZhbm8gQ3VkaW5pIFxuICogc3RlZmFuby5jdWRpbmlAZ21haWwuY29tIFxuICogaHR0cDovL2xhYnMuZWFzeWJsb2cuaXQvIFxuICogXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuIFxuICogXG4gKiBEZW1vOiBcbiAqIGh0dHA6Ly9sYWJzLmVhc3libG9nLml0L21hcHMvbGVhZmxldC1zZWFyY2gvIFxuICogXG4gKiBTb3VyY2U6IFxuICogZ2l0QGdpdGh1Yi5jb206c3RlZmFub2N1ZGluaS9sZWFmbGV0LXNlYXJjaC5naXQgXG4gKiBcbiAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy9BTURcbiAgICAgICAgZGVmaW5lKFsnbGVhZmxldCddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBOb2RlL0NvbW1vbkpTXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsZWFmbGV0JykpO1xuICAgIH0gZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWxzXG4gICAgICAgIGlmKHR5cGVvZiB3aW5kb3cuTCA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICB0aHJvdyAnTGVhZmxldCBtdXN0IGJlIGxvYWRlZCBmaXJzdCc7XG4gICAgICAgIGZhY3Rvcnkod2luZG93LkwpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChMKSB7XG5cblx0ZnVuY3Rpb24gX2dldFBhdGgob2JqLCBwcm9wKSB7XG5cdFx0dmFyIHBhcnRzID0gcHJvcC5zcGxpdCgnLicpLFxuXHRcdFx0bGFzdCA9IHBhcnRzLnBvcCgpLFxuXHRcdFx0bGVuID0gcGFydHMubGVuZ3RoLFxuXHRcdFx0Y3VyID0gcGFydHNbMF0sXG5cdFx0XHRpID0gMTtcblxuXHRcdGlmKGxlbiA+IDApXG5cdFx0XHR3aGlsZSgob2JqID0gb2JqW2N1cl0pICYmIGkgPCBsZW4pXG5cdFx0XHRcdGN1ciA9IHBhcnRzW2krK107XG5cblx0XHRpZihvYmopXG5cdFx0XHRyZXR1cm4gb2JqW2xhc3RdO1xuXHR9XG5cblx0ZnVuY3Rpb24gX2lzT2JqZWN0KG9iaikge1xuXHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIjtcblx0fVxuXG5cbkwuQ29udHJvbC5TZWFyY2ggPSBMLkNvbnRyb2wuZXh0ZW5kKHtcblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxuXHQvL1xuXHQvL1x0TmFtZVx0XHRcdFx0XHREYXRhIHBhc3NlZFx0XHRcdCAgIERlc2NyaXB0aW9uXG5cdC8vXG5cdC8vTWFuYWdlZCBFdmVudHM6XG5cdC8vXHRzZWFyY2g6bG9jYXRpb25mb3VuZFx0e2xhdGxuZywgdGl0bGUsIGxheWVyfSBmaXJlZCBhZnRlciBtb3ZlZCBhbmQgc2hvdyBtYXJrZXJMb2NhdGlvblxuXHQvL1x0c2VhcmNoOmV4cGFuZGVkXHRcdFx0e31cdFx0XHRcdFx0ICAgZmlyZWQgYWZ0ZXIgY29udHJvbCB3YXMgZXhwYW5kZWRcblx0Ly8gIHNlYXJjaDpjb2xsYXBzZWRcdFx0e31cdFx0XHRcdFx0ICAgZmlyZWQgYWZ0ZXIgY29udHJvbCB3YXMgY29sbGFwc2VkXG5cdC8vXG5cdC8vUHVibGljIG1ldGhvZHM6XG5cdC8vICBzZXRMYXllcigpXHRcdFx0XHRMLkxheWVyR3JvdXAoKSAgICAgICAgIHNldCBsYXllciBzZWFyY2ggYXQgcnVudGltZVxuXHQvLyAgc2hvd0FsZXJ0KCkgICAgICAgICAgICAgJ1RleHQgbWVzc2FnZScgICAgICAgICBzaG93IGFsZXJ0IG1lc3NhZ2Vcblx0Ly8gIHNlYXJjaFRleHQoKVx0XHRcdCdUZXh0IHNlYXJjaGVkJyAgICAgICAgc2VhcmNoIHRleHQgYnkgZXh0ZXJuYWwgY29kZVxuXHQvL1xuXHRvcHRpb25zOiB7XG4gICAgICAgIGNsaWNrQ2FsbGJhY2s6IG51bGwsXG5cdFx0dXJsOiAnJyxcdFx0XHRcdFx0XHQvL3VybCBmb3Igc2VhcmNoIGJ5IGFqYXggcmVxdWVzdCwgZXg6IFwic2VhcmNoLnBocD9xPXtzfVwiLiBDYW4gYmUgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHN0cmluZyBmb3IgZHluYW1pYyBwYXJhbWV0ZXIgc2V0dGluZ1xuXHRcdGxheWVyOiBudWxsLFx0XHRcdFx0XHQvL2xheWVyIHdoZXJlIHNlYXJjaCBtYXJrZXJzKGlzIGEgTC5MYXllckdyb3VwKVx0XHRcdFx0XG5cdFx0c291cmNlRGF0YTogbnVsbCxcdFx0XHRcdC8vZnVuY3Rpb24gdGhhdCBmaWxsIF9yZWNvcmRzQ2FjaGUsIHBhc3NlZCBzZWFyY2hpbmcgdGV4dCBieSBmaXJzdCBwYXJhbSBhbmQgY2FsbGJhY2sgaW4gc2Vjb25kXHRcdFx0XHRcblx0XHQvL1RPRE8gaW1wbGVtZW50cyB1bmlxIG9wdGlvbiAnc291cmNlRGF0YScgdGhhdCByZWNvZ25pemVzIHNvdXJjZSB0eXBlOiB1cmwsYXJyYXksY2FsbGJhY2sgb3IgbGF5ZXJcdFx0XHRcdFxuXHRcdGpzb25wUGFyYW06IG51bGwsXHRcdFx0XHQvL2pzb25wIHBhcmFtIG5hbWUgZm9yIHNlYXJjaCBieSBqc29ucCBzZXJ2aWNlLCBleDogXCJjYWxsYmFja1wiXG5cdFx0cHJvcGVydHlMb2M6ICdsb2MnLFx0XHRcdFx0Ly9maWVsZCBmb3IgcmVtYXBwaW5nIGxvY2F0aW9uLCB1c2luZyBhcnJheTogWydsYXRuYW1lJywnbG9ubmFtZSddIGZvciBzZWxlY3QgZG91YmxlIGZpZWxkcyhleC4gWydsYXQnLCdsb24nXSApIHN1cHBvcnQgZG90dGVkIGZvcm1hdDogJ3Byb3Auc3VicHJvcC50aXRsZSdcblx0XHRwcm9wZXJ0eU5hbWU6ICd0aXRsZScsXHRcdFx0Ly9wcm9wZXJ0eSBpbiBtYXJrZXIub3B0aW9ucyhvciBmZWF0dXJlLnByb3BlcnRpZXMgZm9yIHZlY3RvciBsYXllcikgdHJvdWdoIGZpbHRlciBlbGVtZW50cyBpbiBsYXllcixcbiAgICAgICAgZmlsdGVyUHJvcGVydHk6IG51bGwsXG4gICAgICAgIGZpbHRlck9wdGlvbnM6IG51bGwsXG4gICAgICAgIGZpbHRlckNhbGxiYWNrOiBudWxsLFxuXHRcdGZvcm1hdERhdGE6IG51bGwsXHRcdFx0XHQvL2NhbGxiYWNrIGZvciByZWZvcm1hdCBhbGwgZGF0YSBmcm9tIHNvdXJjZSB0byBpbmRleGVkIGRhdGEgb2JqZWN0XG5cdFx0ZmlsdGVyRGF0YTogbnVsbCxcdFx0XHRcdC8vY2FsbGJhY2sgZm9yIGZpbHRlcmluZyBkYXRhIGZyb20gdGV4dCBzZWFyY2hlZCwgcGFyYW1zOiB0ZXh0U2VhcmNoLCBhbGxSZWNvcmRzXG5cdFx0bW92ZVRvTG9jYXRpb246IG51bGwsXHRcdFx0Ly9jYWxsYmFjayBydW4gb24gbG9jYXRpb24gZm91bmQsIHBhcmFtczogbGF0bG5nLCB0aXRsZSwgbWFwXG5cdFx0YnVpbGRUaXA6IG51bGwsXHRcdFx0XHRcdC8vZnVuY3Rpb24gdGhhdCByZXR1cm4gcm93IHRpcCBodG1sIG5vZGUob3IgaHRtbCBzdHJpbmcpLCByZWNlaXZlIHRleHQgdG9vbHRpcCBpbiBmaXJzdCBwYXJhbVxuXHRcdGNvbnRhaW5lcjogJycsXHRcdFx0XHRcdC8vY29udGFpbmVyIGlkIHRvIGluc2VydCBTZWFyY2ggQ29udHJvbFx0XHRcblx0XHR6b29tOiBudWxsLFx0XHRcdFx0XHRcdC8vZGVmYXVsdCB6b29tIGxldmVsIGZvciBtb3ZlIHRvIGxvY2F0aW9uXG5cdFx0bWluTGVuZ3RoOiAxLFx0XHRcdFx0XHQvL21pbmltYWwgdGV4dCBsZW5ndGggZm9yIGF1dG9jb21wbGV0ZVxuXHRcdGluaXRpYWw6IHRydWUsXHRcdFx0XHRcdC8vc2VhcmNoIGVsZW1lbnRzIG9ubHkgYnkgaW5pdGlhbCB0ZXh0XG5cdFx0Y2FzZXNlbnNpdGl2ZTogZmFsc2UsXHRcdFx0Ly9zZWFyY2ggZWxlbWVudHMgaW4gY2FzZSBzZW5zaXRpdmUgdGV4dFxuXHRcdGF1dG9UeXBlOiB0cnVlLFx0XHRcdFx0XHQvL2NvbXBsZXRlIGlucHV0IHdpdGggZmlyc3Qgc3VnZ2VzdGVkIHJlc3VsdCBhbmQgc2VsZWN0IHRoaXMgZmlsbGVkLWluIHRleHQuXG5cdFx0ZGVsYXlUeXBlOiA0MDAsXHRcdFx0XHRcdC8vZGVsYXkgd2hpbGUgdHlwaW5nIGZvciBzaG93IHRvb2x0aXBcblx0XHR0b29sdGlwTGltaXQ6IC0xLFx0XHRcdFx0Ly9saW1pdCBtYXggcmVzdWx0cyB0byBzaG93IGluIHRvb2x0aXAuIC0xIGZvciBubyBsaW1pdC5cblx0XHR0aXBBdXRvU3VibWl0OiB0cnVlLFx0XHRcdC8vYXV0byBtYXAgcGFuVG8gd2hlbiBjbGljayBvbiB0b29sdGlwXG5cdFx0Zmlyc3RUaXBTdWJtaXQ6IGZhbHNlLFx0XHRcdC8vYXV0byBzZWxlY3QgZmlyc3QgcmVzdWx0IGNvbiBlbnRlciBjbGlja1xuXHRcdGF1dG9SZXNpemU6IHRydWUsXHRcdFx0XHQvL2F1dG9yZXNpemUgb24gaW5wdXQgY2hhbmdlXG5cdFx0Y29sbGFwc2VkOiB0cnVlLFx0XHRcdFx0Ly9jb2xsYXBzZSBzZWFyY2ggY29udHJvbCBhdCBzdGFydHVwXG5cdFx0YXV0b0NvbGxhcHNlOiBmYWxzZSxcdFx0XHQvL2NvbGxhcHNlIHNlYXJjaCBjb250cm9sIGFmdGVyIHN1Ym1pdChvbiBidXR0b24gb3Igb24gdGlwcyBpZiBlbmFibGVkIHRpcEF1dG9TdWJtaXQpXG5cdFx0YXV0b0NvbGxhcHNlVGltZTogMTIwMCxcdFx0XHQvL2RlbGF5IGZvciBhdXRvY2xvc2luZyBhbGVydCBhbmQgY29sbGFwc2UgYWZ0ZXIgYmx1clxuXHRcdHRleHRFcnI6ICdMb2NhdGlvbiBub3QgZm91bmQnLFx0Ly9lcnJvciBtZXNzYWdlXG5cdFx0dGV4dENhbmNlbDogJ0NhbmNlbCcsXHRcdCAgICAvL3RpdGxlIGluIGNhbmNlbCBidXR0b25cdFx0XG5cdFx0dGV4dFBsYWNlaG9sZGVyOiAnU2VhcmNoLi4uJywgICAvL3BsYWNlaG9sZGVyIHZhbHVlXHRcdFx0XG5cdFx0cG9zaXRpb246ICd0b3BsZWZ0Jyxcblx0XHRoaWRlTWFya2VyT25Db2xsYXBzZTogZmFsc2UsICAgIC8vcmVtb3ZlIGNpcmNsZSBhbmQgbWFya2VyIG9uIHNlYXJjaCBjb250cm9sIGNvbGxhcHNlZFx0XHRcblx0XHRtYXJrZXI6IHtcdFx0XHRcdFx0XHQvL2N1c3RvbSBMLk1hcmtlciBvciBmYWxzZSBmb3IgaGlkZVxuXHRcdFx0aWNvbjogZmFsc2UsXHRcdFx0XHQvL2N1c3RvbSBMLkljb24gZm9yIG1ha2VyIGxvY2F0aW9uIG9yIGZhbHNlIGZvciBoaWRlXG5cdFx0XHRhbmltYXRlOiB0cnVlLFx0XHRcdFx0Ly9hbmltYXRlIGEgY2lyY2xlIG92ZXIgbG9jYXRpb24gZm91bmRcblx0XHRcdGNpcmNsZToge1x0XHRcdFx0XHQvL2RyYXcgYSBjaXJjbGUgaW4gbG9jYXRpb24gZm91bmRcblx0XHRcdFx0cmFkaXVzOiAxMCxcblx0XHRcdFx0d2VpZ2h0OiAzLFxuXHRcdFx0XHRjb2xvcjogJyNlMDMnLFxuXHRcdFx0XHRzdHJva2U6IHRydWUsXG5cdFx0XHRcdGZpbGw6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vVE9ETyBpbXBsZW1lbnQgY2FuIGRvIHJlc2VhcmNoIG9uIG11bHRpcGxlIHNvdXJjZXMgbGF5ZXJzIGFuZCByZW1vdGVcdFx0XG5cdFx0Ly9UT0RPIGhpc3Rvcnk6IGZhbHNlLFx0XHQvL3Nob3cgbGF0ZXN0IHNlYXJjaGVzIGluIHRvb2x0aXBcdFx0XG5cdH0sXG4vL0ZJWE1FIG9wdGlvbiBjb25kaXRpb24gcHJvYmxlbSB7YXV0b0NvbGxhcHNlOiB0cnVlLCBtYXJrZXJMb2NhdGlvbjogdHJ1ZX0gbm90IHNob3cgbG9jYXRpb25cbi8vRklYTUUgb3B0aW9uIGNvbmRpdGlvbiBwcm9ibGVtIHthdXRvQ29sbGFwc2U6IGZhbHNlIH1cbi8vXG4vL1RPRE8gaGVyZSBpbnNlcnQgZnVuY3Rpb24gdGhhdCBzZWFyY2ggaW5wdXRUZXh0IEZJUlNUIGluIF9yZWNvcmRzQ2FjaGUga2V5cyBhbmQgaWYgbm90IGZpbmQgcmVzdWx0cy4uIFxuLy8gIHJ1biBvbmUgb2YgY2FsbGJhY2tzIHNlYXJjaChzb3VyY2VEYXRhLGpzb25wVXJsIG9yIG9wdGlvbnMubGF5ZXIpIGFuZCBydW4gdGhpcy5zaG93VG9vbHRpcFxuLy9cbi8vVE9ETyBjaGFuZ2Ugc3RydWN0dXJlIG9mIF9yZWNvcmRzQ2FjaGVcbi8vXHRsaWtlIHRoaXM6IF9yZWNvcmRzQ2FjaGUgPSB7XCJ0ZXh0LWtleTFcIjoge2xvYzpbbGF0LGxuZ10sIC4ub3RoZXIgYXR0cmlidXRlcy4uIH0sIHtcInRleHQta2V5MlwiOiB7bG9jOltsYXQsbG5nXX0uLi59LCAuLi59XG4vL1x0aW4gdGhpcyBtb2RlIGV2ZXJ5IHJlY29yZCBjYW4gaGF2ZSBhIGZyZWUgc3RydWN0dXJlIG9mIGF0dHJpYnV0ZXMsIG9ubHkgJ2xvYycgaXMgcmVxdWlyZWRcblx0XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRMLlV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zIHx8IHt9KTtcblx0XHR0aGlzLl9pbnB1dE1pblNpemUgPSB0aGlzLm9wdGlvbnMudGV4dFBsYWNlaG9sZGVyID8gdGhpcy5vcHRpb25zLnRleHRQbGFjZWhvbGRlci5sZW5ndGggOiAxMDtcblx0XHR0aGlzLl9sYXllciA9IHRoaXMub3B0aW9ucy5sYXllciB8fCBuZXcgTC5MYXllckdyb3VwKCk7XG5cdFx0dGhpcy5fZmlsdGVyRGF0YSA9IHRoaXMub3B0aW9ucy5maWx0ZXJEYXRhIHx8IHRoaXMuX2RlZmF1bHRGaWx0ZXJEYXRhO1xuXHRcdHRoaXMuX2Zvcm1hdERhdGEgPSB0aGlzLm9wdGlvbnMuZm9ybWF0RGF0YSB8fCB0aGlzLl9kZWZhdWx0Rm9ybWF0RGF0YTtcblx0XHR0aGlzLl9tb3ZlVG9Mb2NhdGlvbiA9IHRoaXMub3B0aW9ucy5tb3ZlVG9Mb2NhdGlvbiB8fCB0aGlzLl9kZWZhdWx0TW92ZVRvTG9jYXRpb247XG5cdFx0dGhpcy5fYXV0b1R5cGVUbXAgPSB0aGlzLm9wdGlvbnMuYXV0b1R5cGU7XHQvL3VzZWZ1bCBmb3IgZGlzYWJsZSBhdXRvVHlwZSB0ZW1wb3JhcmlseSBpbiBkZWxldGUvYmFja3NwYWNlIGtleWRvd25cblx0XHR0aGlzLl9jb3VudGVydGlwcyA9IDA7XHRcdC8vbnVtYmVyIG9mIHRpcHMgaXRlbXNcblx0XHR0aGlzLl9yZWNvcmRzQ2FjaGUgPSB7fTtcdC8va2V5LHZhbHVlIHRhYmxlISB0aGF0IHN0b3JlIGxvY2F0aW9ucyEgZm9ybWF0OiBrZXksbGF0bG5nXG5cdFx0dGhpcy5fY3VyUmVxID0gbnVsbDtcblx0fSxcblxuXHRvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xuXHRcdHRoaXMuX21hcCA9IG1hcDtcblx0XHR0aGlzLl9jb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1jb250cm9sLXNlYXJjaCcpO1xuXHRcdHRoaXMuX2lucHV0ID0gdGhpcy5fY3JlYXRlSW5wdXQodGhpcy5vcHRpb25zLnRleHRQbGFjZWhvbGRlciwgJ3NlYXJjaC1pbnB1dCcpO1xuXHRcdHRoaXMuX3Rvb2x0aXAgPSB0aGlzLl9jcmVhdGVUb29sdGlwKCdzZWFyY2gtdG9vbHRpcCcpO1xuXHRcdHRoaXMuX2NhbmNlbCA9IHRoaXMuX2NyZWF0ZUNhbmNlbCh0aGlzLm9wdGlvbnMudGV4dENhbmNlbCwgJ3NlYXJjaC1jYW5jZWwnKTtcblx0XHR0aGlzLl9idXR0b24gPSB0aGlzLl9jcmVhdGVCdXR0b24odGhpcy5vcHRpb25zLnRleHRQbGFjZWhvbGRlciwgJ3NlYXJjaC1idXR0b24nKTtcbiAgICAgICAgdGhpcy5fZHJvcGRvd24gPSB0aGlzLl9jcmVhdGVEcm9wRG93bih0aGlzLm9wdGlvbnMudGV4dFBsYWNlaG9sZGVyLCAnc2VhcmNoLWJ1dHRvbicpO1xuXHRcdHRoaXMuX2FsZXJ0ID0gdGhpcy5fY3JlYXRlQWxlcnQoJ3NlYXJjaC1hbGVydCcpO1xuXG5cblx0XHRpZih0aGlzLm9wdGlvbnMuY29sbGFwc2VkPT09ZmFsc2UpXG5cdFx0XHR0aGlzLmV4cGFuZCh0aGlzLm9wdGlvbnMuY29sbGFwc2VkKTtcblxuXHRcdGlmKHRoaXMub3B0aW9ucy5tYXJrZXIpIHtcblx0XHRcdFxuXHRcdFx0aWYodGhpcy5vcHRpb25zLm1hcmtlciBpbnN0YW5jZW9mIEwuTWFya2VyIHx8IHRoaXMub3B0aW9ucy5tYXJrZXIgaW5zdGFuY2VvZiBMLkNpcmNsZU1hcmtlcilcblx0XHRcdFx0dGhpcy5fbWFya2VyU2VhcmNoID0gdGhpcy5vcHRpb25zLm1hcmtlcjtcblxuXHRcdFx0ZWxzZSBpZihfaXNPYmplY3QodGhpcy5vcHRpb25zLm1hcmtlcikpXG5cdFx0XHRcdHRoaXMuX21hcmtlclNlYXJjaCA9IG5ldyBMLkNvbnRyb2wuU2VhcmNoLk1hcmtlcihbMCwwXSwgdGhpcy5vcHRpb25zLm1hcmtlcik7XG5cblx0XHRcdHRoaXMuX21hcmtlclNlYXJjaC5faXNNYXJrZXJTZWFyY2ggPSB0cnVlO1xuXHRcdH1cblxuXHRcdHRoaXMuc2V0TGF5ZXIoIHRoaXMuX2xheWVyICk7XG5cblx0XHRtYXAub24oe1xuXHRcdFx0Ly8gXHRcdCdsYXllcmFkZCc6IHRoaXMuX29uTGF5ZXJBZGRSZW1vdmUsXG5cdFx0XHQvLyBcdFx0J2xheWVycmVtb3ZlJzogdGhpcy5fb25MYXllckFkZFJlbW92ZVxuXHRcdFx0J3Jlc2l6ZSc6IHRoaXMuX2hhbmRsZUF1dG9yZXNpemVcblx0XHRcdH0sIHRoaXMpO1xuXHRcdHJldHVybiB0aGlzLl9jb250YWluZXI7XG5cdH0sXG5cdGFkZFRvOiBmdW5jdGlvbiAobWFwKSB7XG5cblx0XHRpZih0aGlzLm9wdGlvbnMuY29udGFpbmVyKSB7XG5cdFx0XHR0aGlzLl9jb250YWluZXIgPSB0aGlzLm9uQWRkKG1hcCk7XG5cdFx0XHR0aGlzLl93cmFwcGVyID0gTC5Eb21VdGlsLmdldCh0aGlzLm9wdGlvbnMuY29udGFpbmVyKTtcblx0XHRcdHRoaXMuX3dyYXBwZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dGhpcy5fd3JhcHBlci5hcHBlbmRDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHRMLkNvbnRyb2wucHJvdG90eXBlLmFkZFRvLmNhbGwodGhpcywgbWFwKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbihtYXApIHtcblx0XHR0aGlzLl9yZWNvcmRzQ2FjaGUgPSB7fTtcblx0XHQvLyBtYXAub2ZmKHtcblx0XHQvLyBcdFx0J2xheWVyYWRkJzogdGhpcy5fb25MYXllckFkZFJlbW92ZSxcblx0XHQvLyBcdFx0J2xheWVycmVtb3ZlJzogdGhpcy5fb25MYXllckFkZFJlbW92ZVxuXHRcdC8vIFx0fSwgdGhpcyk7XG5cdH0sXG5cblx0Ly8gX29uTGF5ZXJBZGRSZW1vdmU6IGZ1bmN0aW9uKGUpIHtcblx0Ly8gXHQvL3dpdGhvdXQgdGhpcywgcnVuIHNldExheWVyIGFsc28gZm9yIGVhY2ggTWFya2VycyEhIHRvIG9wdGltaXplIVxuXHQvLyBcdGlmKGUubGF5ZXIgaW5zdGFuY2VvZiBMLkxheWVyR3JvdXApXG5cdC8vIFx0XHRpZiggTC5zdGFtcChlLmxheWVyKSAhPSBMLnN0YW1wKHRoaXMuX2xheWVyKSApXG5cdC8vIFx0XHRcdHRoaXMuc2V0TGF5ZXIoZS5sYXllcik7XG5cdC8vIH0sXG5cblx0c2V0TGF5ZXI6IGZ1bmN0aW9uKGxheWVyKSB7XHQvL3NldCBzZWFyY2ggbGF5ZXIgYXQgcnVudGltZVxuXHRcdC8vdGhpcy5vcHRpb25zLmxheWVyID0gbGF5ZXI7IC8vc2V0dGluZyB0aGlzLCBydW4gb25seSB0aGlzLl9yZWNvcmRzRnJvbUxheWVyKClcblx0XHR0aGlzLl9sYXllciA9IGxheWVyO1xuXHRcdHRoaXMuX2xheWVyLmFkZFRvKHRoaXMuX21hcCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdFxuXHRzaG93QWxlcnQ6IGZ1bmN0aW9uKHRleHQpIHtcblx0XHR0ZXh0ID0gdGV4dCB8fCB0aGlzLm9wdGlvbnMudGV4dEVycjtcblx0XHR0aGlzLl9hbGVydC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHR0aGlzLl9hbGVydC5pbm5lckhUTUwgPSB0ZXh0O1xuXHRcdGNsZWFyVGltZW91dCh0aGlzLnRpbWVyQWxlcnQpO1xuXHRcdHZhciB0aGF0ID0gdGhpcztcdFx0XG5cdFx0dGhpcy50aW1lckFsZXJ0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdHRoYXQuaGlkZUFsZXJ0KCk7XG5cdFx0fSx0aGlzLm9wdGlvbnMuYXV0b0NvbGxhcHNlVGltZSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdFxuXHRoaWRlQWxlcnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2FsZXJ0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdFx0XG5cdGNhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5faW5wdXQudmFsdWUgPSAnJztcblx0XHR0aGlzLl9oYW5kbGVLZXlwcmVzcyh7IGtleUNvZGU6IDggfSk7Ly9zaW11bGF0ZSBiYWNrc3BhY2Uga2V5cHJlc3Ncblx0XHR0aGlzLl9pbnB1dC5zaXplID0gdGhpcy5faW5wdXRNaW5TaXplO1xuXHRcdHRoaXMuX2lucHV0LmZvY3VzKCk7XG5cdFx0dGhpcy5fY2FuY2VsLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcblx0XHR0aGlzLl9oaWRlVG9vbHRpcCgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRcblx0ZXhwYW5kOiBmdW5jdGlvbih0b2dnbGUpIHtcblx0XHR0b2dnbGUgPSB0eXBlb2YgdG9nZ2xlID09PSAnYm9vbGVhbicgPyB0b2dnbGUgOiB0cnVlO1xuXHRcdHRoaXMuX2lucHV0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9jb250YWluZXIsICdzZWFyY2gtZXhwJyk7XG5cdFx0aWYgKCB0b2dnbGUgIT09IGZhbHNlICkge1xuXHRcdFx0dGhpcy5faW5wdXQuZm9jdXMoKTtcblx0XHRcdHRoaXMuX21hcC5vbignZHJhZ3N0YXJ0IGNsaWNrJywgdGhpcy5jb2xsYXBzZSwgdGhpcyk7XG5cdFx0fVxuXHRcdHRoaXMuZmlyZSgnc2VhcmNoOmV4cGFuZGVkJyk7XG5cdFx0cmV0dXJuIHRoaXM7XHRcblx0fSxcblxuXHRjb2xsYXBzZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5faGlkZVRvb2x0aXAoKTtcblx0XHR0aGlzLmNhbmNlbCgpO1xuXHRcdHRoaXMuX2FsZXJ0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0dGhpcy5faW5wdXQuYmx1cigpO1xuXHRcdGlmKHRoaXMub3B0aW9ucy5jb2xsYXBzZWQpXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdHRoaXMuX2NhbmNlbC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cdFx0XHRMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnc2VhcmNoLWV4cCcpO1x0XHRcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuaGlkZU1hcmtlck9uQ29sbGFwc2UpIHtcblx0XHRcdFx0dGhpcy5fbWFwLnJlbW92ZUxheWVyKHRoaXMuX21hcmtlclNlYXJjaCk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9tYXAub2ZmKCdkcmFnc3RhcnQgY2xpY2snLCB0aGlzLmNvbGxhcHNlLCB0aGlzKTtcblx0XHR9XG5cdFx0dGhpcy5maXJlKCdzZWFyY2g6Y29sbGFwc2VkJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdFxuXHRjb2xsYXBzZURlbGF5ZWQ6IGZ1bmN0aW9uKCkge1x0Ly9jb2xsYXBzZSBhZnRlciBkZWxheSwgdXNlZCBvbl9pbnB1dCBibHVyXG5cdFx0aWYgKCF0aGlzLm9wdGlvbnMuYXV0b0NvbGxhcHNlKSByZXR1cm4gdGhpcztcblx0XHR2YXIgdGhhdCA9IHRoaXM7XG5cdFx0Y2xlYXJUaW1lb3V0KHRoaXMudGltZXJDb2xsYXBzZSk7XG5cdFx0dGhpcy50aW1lckNvbGxhcHNlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdHRoYXQuY29sbGFwc2UoKTtcblx0XHR9LCB0aGlzLm9wdGlvbnMuYXV0b0NvbGxhcHNlVGltZSk7XG5cdFx0cmV0dXJuIHRoaXM7XHRcdFxuXHR9LFxuXG5cdGNvbGxhcHNlRGVsYXllZFN0b3A6IGZ1bmN0aW9uKCkge1xuXHRcdGNsZWFyVGltZW91dCh0aGlzLnRpbWVyQ29sbGFwc2UpO1xuXHRcdHJldHVybiB0aGlzO1x0XHRcblx0fSxcblxuLy8vL3N0YXJ0IERPTSBjcmVhdGlvbnNcblx0X2NyZWF0ZUFsZXJ0OiBmdW5jdGlvbihjbGFzc05hbWUpIHtcblx0XHR2YXIgYWxlcnQgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lcik7XG5cdFx0YWxlcnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuXHRcdEwuRG9tRXZlbnRcblx0XHRcdC5vbihhbGVydCwgJ2NsaWNrJywgTC5Eb21FdmVudC5zdG9wLCB0aGlzKVxuXHRcdFx0Lm9uKGFsZXJ0LCAnY2xpY2snLCB0aGlzLmhpZGVBbGVydCwgdGhpcyk7XG5cblx0XHRyZXR1cm4gYWxlcnQ7XG5cdH0sXG5cblx0X2NyZWF0ZUlucHV0OiBmdW5jdGlvbiAodGV4dCwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGxhYmVsID0gTC5Eb21VdGlsLmNyZWF0ZSgnbGFiZWwnLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lcik7XG5cdFx0dmFyIGlucHV0ID0gTC5Eb21VdGlsLmNyZWF0ZSgnaW5wdXQnLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lcik7XG5cdFx0aW5wdXQudHlwZSA9ICd0ZXh0Jztcblx0XHRpbnB1dC5zaXplID0gdGhpcy5faW5wdXRNaW5TaXplO1xuXHRcdGlucHV0LnZhbHVlID0gJyc7XG5cdFx0aW5wdXQuYXV0b2NvbXBsZXRlID0gJ29mZic7XG5cdFx0aW5wdXQuYXV0b2NvcnJlY3QgPSAnb2ZmJztcblx0XHRpbnB1dC5hdXRvY2FwaXRhbGl6ZSA9ICdvZmYnO1xuXHRcdGlucHV0LnBsYWNlaG9sZGVyID0gdGV4dDtcblx0XHRpbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdGlucHV0LnJvbGUgPSAnc2VhcmNoJztcblx0XHRpbnB1dC5pZCA9IGlucHV0LnJvbGUgKyBpbnB1dC50eXBlICsgaW5wdXQuc2l6ZTtcblx0XHRcblx0XHRsYWJlbC5odG1sRm9yID0gaW5wdXQuaWQ7XG5cdFx0bGFiZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRsYWJlbC52YWx1ZSA9IHRleHQ7XG5cblx0XHRMLkRvbUV2ZW50XG5cdFx0XHQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24oaW5wdXQpXG5cdFx0XHQub24oaW5wdXQsICdrZXl1cCcsIHRoaXMuX2hhbmRsZUtleXByZXNzLCB0aGlzKVxuXHRcdFx0Lm9uKGlucHV0LCAnYmx1cicsIHRoaXMuY29sbGFwc2VEZWxheWVkLCB0aGlzKVxuXHRcdFx0Lm9uKGlucHV0LCAnZm9jdXMnLCB0aGlzLmNvbGxhcHNlRGVsYXllZFN0b3AsIHRoaXMpO1xuXHRcdFxuXHRcdHJldHVybiBpbnB1dDtcblx0fSxcblxuXHRfY3JlYXRlQ2FuY2VsOiBmdW5jdGlvbiAodGl0bGUsIGNsYXNzTmFtZSkge1xuXHRcdHZhciBjYW5jZWxDb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdhJywgY2xhc3NOYW1lLCB0aGlzLl9jb250YWluZXIpO1xuICAgICAgICBjYW5jZWxDb250YWluZXIuaHJlZiA9ICdqYXZhc2NyaXB0OnZvaWQoMCk7JztcbiAgICAgICAgY2FuY2VsQ29udGFpbmVyLnRpdGxlID0gdGl0bGU7XG4gICAgICAgIGNhbmNlbENvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBjYW5jZWxDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHZhciBjYW5jZWxJY29uID0gTC5Eb21VdGlsLmNyZWF0ZSgnc3BhbicsICdpY29uIGFuaW1hdGVkIGZhZGVJblVwJywgY2FuY2VsQ29udGFpbmVyKTtcbiAgICAgICAgY2FuY2VsSWNvbi5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cblx0XHRMLkRvbUV2ZW50XG5cdFx0XHQub24oY2FuY2VsSWNvbiwgJ2NsaWNrJywgTC5Eb21FdmVudC5zdG9wLCB0aGlzKVxuXHRcdFx0Lm9uKGNhbmNlbEljb24sICdjbGljaycsIHRoaXMuY2FuY2VsLCB0aGlzKTtcblxuXHRcdHJldHVybiBjYW5jZWxJY29uO1xuXHR9LFxuXG4gICAgX2NyZWF0ZURyb3BEb3duOiBmdW5jdGlvbiAodGl0bGUsIGNsYXNzTmFtZSkge1xuXHQgICAgaWYodGhpcy5vcHRpb25zLmZpbHRlck9wdGlvbnMgPT0gbnVsbCB8fCB0aGlzLm9wdGlvbnMuZmlsdGVyT3B0aW9ucy5sZW5ndGggPT0gMCl7XG5cdCAgICAgICAgcmV0dXJuOyBudWxsXG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1hcmtlckNsdXN0ZXIgPSB0aGlzLl9sYXllcjtcbiAgICAgICAgdmFyIG1hcmtlckdyb3VwID0ge307Ly8g5qC55o2uZmlsdGVyT3B0aW9uc+Wwhm1ha2Vyc+WIhuS4uuWkmuS4que7hCwg5qC55o2u5LiN5ZCM55qE5LiL5ouJ6YCJ6aG5LCDlsZXnpLrlr7nlupTnmoRtYXJrZXJcblxuICAgICAgICAvL1NlbGVjdCBsZWFmbGV0IGNsYXNzXG4gICAgICAgIHZhciBkcm9wZG93biA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWNvbnRyb2wtc2VhcmNoLWZpbHRlcicsIHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIHZhciBmaWx0ZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnZmlsdGVyJywgZHJvcGRvd24pO1xuICAgICAgICB2YXIgdGl0bGUgPSBMLkRvbVV0aWwuY3JlYXRlKCdzcGFuJywgJ3RpdGxlJywgZmlsdGVyKTtcbiAgICAgICAgdGl0bGUuaW5uZXJIVE1MID0gJzxpbWcgdmFsdWU9XCJcIiBjbGFzcz1cImZpbHRlckljb25cIiBzcmM9XCJcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj48L2ltZz4nK3RoaXMub3B0aW9ucy5maWx0ZXJPcHRpb25zWzBdLnRpdGxlO1xuXG4gICAgICAgIC8vU2VsZWN0IEljb24gKENoZXZyb24gZG93bilcbiAgICAgICAgdmFyIGljb24gPSBMLkRvbVV0aWwuY3JlYXRlKCdpJywgJ2ZhIGZhLWNoZXZyb24tdXAgcHVsbC1yaWdodCcsIHRpdGxlKTtcblxuICAgICAgICAvL0xpc3Qgb2YgaXRlbXNcbiAgICAgICAgdmFyIGl0ZW1zID0gTC5Eb21VdGlsLmNyZWF0ZSgndWwnLCAnaXRlbXMgY29sbGFwc2VkICcsIGZpbHRlcik7XG5cbiAgICAgICAgLy9BZGQgaXRlbXMgdG8gdGhlIGxpc3RcbiAgICAgICAgdmFyIGNvbXBvbmVudCA9IHRoaXM7XG4gICAgICAgIHRoaXMub3B0aW9ucy5maWx0ZXJPcHRpb25zLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICB2YXIgbGkgPSBMLkRvbVV0aWwuY3JlYXRlKCdsaScpO1xuICAgICAgICAgICAgaWYoJC50cmltKGl0ZW0uaWNvbik9PVwiXCIpe1xuICAgICAgICAgICAgICAgIGxpLmlubmVySFRNTCA9ICc8aW1nIHZhbHVlPVwiJytpdGVtLnZhbHVlKydcIiBjbGFzcz1cImZpbHRlckljb25cIiBzcmM9XCInK2l0ZW0uaWNvbisnXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+PC9pbWc+JytpdGVtLnRpdGxlO1xuXHRcdFx0fWVsc2V7XG4gICAgICAgICAgICAgICAgbGkuaW5uZXJIVE1MID0gJzxpbWcgdmFsdWU9XCInK2l0ZW0udmFsdWUrJ1wiIGNsYXNzPVwiZmlsdGVySWNvblwiIHNyYz1cIicraXRlbS5pY29uKydcIiBzdHlsZT1cInZpc2liaWxpdHk6IHZpc2libGU7XCI+PC9pbWc+JytpdGVtLnRpdGxlO1xuXHRcdFx0fVxuXG4gICAgICAgICAgICBpZihpdGVtLnNlbGVjdGVkID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcInNlbGVjdGVkXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEwuRG9tRXZlbnQuYWRkTGlzdGVuZXIobGksICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAkKGRyb3Bkb3duKS5hdHRyKFwidmFsdWVcIiwgJChlLmN1cnJlbnRUYXJnZXQpLmZpbmQoXCJpbWdcIikuYXR0cihcInZhbHVlXCIpKTtcbiAgICAgICAgICAgICAgICAkKHRpdGxlKS5odG1sKCQoZS5jdXJyZW50VGFyZ2V0KS5odG1sKCkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQub3B0aW9ucy5maWx0ZXJDYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5vcHRpb25zLmZpbHRlckNhbGxiYWNrKCQoZHJvcGRvd24pLmF0dHIoXCJ2YWx1ZVwiKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pi+56S65LiN5ZCM5YiG57uE55qE5pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlckNsdXN0ZXIuY2xlYXJMYXllcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgJChtYXJrZXJHcm91cFtcIlZfXCIrJChkcm9wZG93bikuYXR0cihcInZhbHVlXCIpXSkuZWFjaChmdW5jdGlvbihpZHgsIG1hcmtlcil7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJDbHVzdGVyLmFkZExheWVyKG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaXRlbXMuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICAgICAgLy9tYXJrZXJzIOWIhue7hFxuICAgICAgICAgICAgbWFya2VyR3JvdXBbXCJWX1wiK2l0ZW0udmFsdWVdID0gW107XG4gICAgICAgICAgICB0aGlzLl9sYXllci5lYWNoTGF5ZXIoZnVuY3Rpb24obGF5ZXIpIHtcbiAgICAgICAgICAgICAgICBpZigobGF5ZXIgaW5zdGFuY2VvZiBMLk1hcmtlciB8fCBsYXllciBpbnN0YW5jZW9mIEwuQ2lyY2xlTWFya2VyKSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5maWx0ZXJQcm9wZXJ0eSAmJiBsYXllci5vcHRpb25zW3RoaXMub3B0aW9ucy5maWx0ZXJQcm9wZXJ0eV0gPT0gJC50cmltKGl0ZW0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIHx8ICQudHJpbShpdGVtLnZhbHVlKSA9PSBcIlwiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlckdyb3VwW1wiVl9cIitpdGVtLnZhbHVlXS5wdXNoKGxheWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB2YXIgdG9nZ2xlRHJvcGRvd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKGl0ZW1zKS5zbGlkZVRvZ2dsZSgyMDApO1xuICAgICAgICAgICAgJChpY29uKS50b2dnbGVDbGFzcygnZmEtY2hldnJvbi1kb3duIGZhLWNoZXZyb24tdXAnKTtcbiAgICAgICAgfTtcblxuICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGZpbHRlciwgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgY29tcG9uZW50Ll9oaWRlVG9vbHRpcCgpO1xuICAgICAgICAgICAgdG9nZ2xlRHJvcGRvd24oKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9Bdm9pZCBjbGljayBwcm9wYWdhdGlvblxuICAgICAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKGRyb3Bkb3duKTtcbiAgICAgICAgTC5Eb21FdmVudC5kaXNhYmxlU2Nyb2xsUHJvcGFnYXRpb24oZHJvcGRvd24pO1xuXG4gICAgICAgIHJldHVybiBkcm9wZG93bjtcbiAgICB9LFxuXG5cblxuXHRfY3JlYXRlQnV0dG9uOiBmdW5jdGlvbiAodGl0bGUsIGNsYXNzTmFtZSkge1xuXHRcdHZhciBidXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlKCdhJywgY2xhc3NOYW1lLCB0aGlzLl9jb250YWluZXIpO1xuXHRcdGJ1dHRvbi5ocmVmID0gJ2phdmFzY3JpcHQ6dm9pZCgwKTsnO1xuXHRcdGJ1dHRvbi50aXRsZSA9IHRpdGxlO1xuXG5cdFx0TC5Eb21FdmVudFxuXHRcdFx0Lm9uKGJ1dHRvbiwgJ2NsaWNrJywgTC5Eb21FdmVudC5zdG9wLCB0aGlzKVxuXHRcdFx0Lm9uKGJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5faGFuZGxlU3VibWl0LCB0aGlzKVx0XHRcdFxuXHRcdFx0Lm9uKGJ1dHRvbiwgJ2ZvY3VzJywgdGhpcy5jb2xsYXBzZURlbGF5ZWRTdG9wLCB0aGlzKVxuXHRcdFx0Lm9uKGJ1dHRvbiwgJ2JsdXInLCB0aGlzLmNvbGxhcHNlRGVsYXllZCwgdGhpcyk7XG5cblx0XHRyZXR1cm4gYnV0dG9uO1xuXHR9LFxuXG5cdF9jcmVhdGVUb29sdGlwOiBmdW5jdGlvbihjbGFzc05hbWUpIHtcblx0XHR2YXIgdG9vbCA9IEwuRG9tVXRpbC5jcmVhdGUoJ3VsJywgY2xhc3NOYW1lLCB0aGlzLl9jb250YWluZXIpO1xuXHRcdHRvb2wuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuXHRcdHZhciB0aGF0ID0gdGhpcztcblx0XHRMLkRvbUV2ZW50XG5cdFx0XHQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24odG9vbClcblx0XHRcdC5vbih0b29sLCAnYmx1cicsIHRoaXMuY29sbGFwc2VEZWxheWVkLCB0aGlzKVxuXHRcdFx0Lm9uKHRvb2wsICdtb3VzZXdoZWVsJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHR0aGF0LmNvbGxhcHNlRGVsYXllZFN0b3AoKTtcblx0XHRcdFx0TC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb24oZSk7Ly9kaXNhYmxlIHpvb20gbWFwXG5cdFx0XHR9LCB0aGlzKVxuXHRcdFx0Lm9uKHRvb2wsICdtb3VzZW92ZXInLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHRoYXQuY29sbGFwc2VEZWxheWVkU3RvcCgpO1xuXHRcdFx0fSwgdGhpcyk7XG5cdFx0cmV0dXJuIHRvb2w7XG5cdH0sXG5cblx0X2NyZWF0ZVRpcDogZnVuY3Rpb24odGV4dCwgdmFsKSB7Ly92YWwgaXMgb2JqZWN0IGluIHJlY29yZENhY2hlLCB1c3VhbGx5IGlzIExhdGxuZ1xuXHRcdHZhciB0aXA7XG5cdFx0XG5cdFx0aWYodGhpcy5vcHRpb25zLmJ1aWxkVGlwKVxuXHRcdHtcblx0XHRcdHRpcCA9IHRoaXMub3B0aW9ucy5idWlsZFRpcC5jYWxsKHRoaXMsIHRleHQsIHZhbCk7IC8vY3VzdG9tIHRpcCBub2RlIG9yIGh0bWwgc3RyaW5nXG5cdFx0XHRpZih0eXBlb2YgdGlwID09PSAnc3RyaW5nJylcblx0XHRcdHtcblx0XHRcdFx0dmFyIHRtcE5vZGUgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnKTtcblx0XHRcdFx0dG1wTm9kZS5pbm5lckhUTUwgPSB0aXA7XG5cdFx0XHRcdHRpcCA9IHRtcE5vZGUuZmlyc3RDaGlsZDtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRpcCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2xpJywgJycpO1xuXHRcdFx0dGlwLmlubmVySFRNTCA9IHRleHQ7XG5cdFx0fVxuXHRcdFxuXHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aXAsICdzZWFyY2gtdGlwJyk7XG5cdFx0dGlwLl90ZXh0ID0gdGV4dDsgLy92YWx1ZSByZXBsYWNlZCBpbiB0aGlzLl9pbnB1dCBhbmQgdXNlZCBieSBfYXV0b1R5cGVcblxuXHRcdGlmKHRoaXMub3B0aW9ucy50aXBBdXRvU3VibWl0KVxuXHRcdFx0TC5Eb21FdmVudFxuXHRcdFx0XHQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24odGlwKVx0XHRcblx0XHRcdFx0Lm9uKHRpcCwgJ2NsaWNrJywgTC5Eb21FdmVudC5zdG9wLCB0aGlzKVxuXHRcdFx0XHQub24odGlwLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0dGhpcy5faW5wdXQudmFsdWUgPSB0ZXh0O1xuXHRcdFx0XHRcdHRoaXMuX2hhbmRsZUF1dG9yZXNpemUoKTtcblx0XHRcdFx0XHR0aGlzLl9pbnB1dC5mb2N1cygpO1xuXHRcdFx0XHRcdHRoaXMuX2hpZGVUb29sdGlwKCk7XHRcblx0XHRcdFx0XHR0aGlzLl9oYW5kbGVTdWJtaXQoKTtcblx0XHRcdFx0fSwgdGhpcyk7XG5cblx0XHRyZXR1cm4gdGlwO1xuXHR9LFxuXG4vLy8vLy9lbmQgRE9NIGNyZWF0aW9uc1xuXG5cdF9nZXRVcmw6IGZ1bmN0aW9uKHRleHQpIHtcblx0XHRyZXR1cm4gKHR5cGVvZiB0aGlzLm9wdGlvbnMudXJsID09PSAnZnVuY3Rpb24nKSA/IHRoaXMub3B0aW9ucy51cmwodGV4dCkgOiB0aGlzLm9wdGlvbnMudXJsO1xuXHR9LFxuXG5cdF9kZWZhdWx0RmlsdGVyRGF0YTogZnVuY3Rpb24odGV4dCwgcmVjb3Jkcykge1xuXHRcblx0XHR2YXIgSSwgaWNhc2UsIHJlZ1NlYXJjaCwgZnJlY29yZHMgPSB7fTtcblxuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnJyk7ICAvL3Nhbml0aXplIHJlbW92ZSBhbGwgc3BlY2lhbCBjaGFyYWN0ZXJzXG5cdFx0aWYodGV4dD09PScnKVxuXHRcdFx0cmV0dXJuIHt9O1xuXG5cdFx0SSA9IHRoaXMub3B0aW9ucy5pbml0aWFsID8gJ14nIDogJyc7ICAvL3NlYXJjaCBvbmx5IGluaXRpYWwgdGV4dFxuXHRcdGljYXNlID0gIXRoaXMub3B0aW9ucy5jYXNlc2Vuc2l0aXZlID8gJ2knIDogdW5kZWZpbmVkO1xuXG5cdFx0cmVnU2VhcmNoID0gbmV3IFJlZ0V4cChJICsgdGV4dCwgaWNhc2UpO1xuXG5cdFx0Ly9UT0RPIHVzZSAuZmlsdGVyIG9yIC5tYXBcblx0XHRmb3IodmFyIGtleSBpbiByZWNvcmRzKSB7XG5cdFx0XHRpZiggcmVnU2VhcmNoLnRlc3Qoa2V5KSApXG5cdFx0XHRcdGZyZWNvcmRzW2tleV09IHJlY29yZHNba2V5XTtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIGZyZWNvcmRzO1xuXHR9LFxuXG5cdHNob3dUb29sdGlwOiBmdW5jdGlvbihyZWNvcmRzKSB7XG5cdFx0dmFyIHRpcDtcblxuXHRcdHRoaXMuX2NvdW50ZXJ0aXBzID0gMDtcblx0XHRcdFx0XG5cdFx0dGhpcy5fdG9vbHRpcC5pbm5lckhUTUwgPSAnJztcblx0XHR0aGlzLl90b29sdGlwLmN1cnJlbnRTZWxlY3Rpb24gPSAtMTsgIC8vaW5pemlhbGl6ZWQgZm9yIF9oYW5kbGVBcnJvd1NlbGVjdCgpXG5cblx0XHRmb3IodmFyIGtleSBpbiByZWNvcmRzKS8vZmlsbCB0b29sdGlwXG5cdFx0e1xuXHRcdFx0aWYoKyt0aGlzLl9jb3VudGVydGlwcyA9PSB0aGlzLm9wdGlvbnMudG9vbHRpcExpbWl0KSBicmVhaztcblxuXHRcdFx0dGlwID0gdGhpcy5fY3JlYXRlVGlwKGtleSwgcmVjb3Jkc1trZXldICk7XG5cblx0XHRcdHRoaXMuX3Rvb2x0aXAuYXBwZW5kQ2hpbGQodGlwKTtcblx0XHR9XG5cdFx0XG5cdFx0aWYodGhpcy5fY291bnRlcnRpcHMgPiAwKVxuXHRcdHtcblx0XHRcdHRoaXMuX3Rvb2x0aXAuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRpZih0aGlzLl9hdXRvVHlwZVRtcClcblx0XHRcdFx0dGhpcy5fYXV0b1R5cGUoKTtcblx0XHRcdHRoaXMuX2F1dG9UeXBlVG1wID0gdGhpcy5vcHRpb25zLmF1dG9UeXBlOy8vcmVzZXQgZGVmYXVsdCB2YWx1ZVxuXHRcdH1cblx0XHRlbHNlXG5cdFx0XHR0aGlzLl9oaWRlVG9vbHRpcCgpO1xuXG5cdFx0dGhpcy5fdG9vbHRpcC5zY3JvbGxUb3AgPSAwO1xuXHRcdHJldHVybiB0aGlzLl9jb3VudGVydGlwcztcblx0fSxcblxuXHRfaGlkZVRvb2x0aXA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX3Rvb2x0aXAuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHR0aGlzLl90b29sdGlwLmlubmVySFRNTCA9ICcnO1xuXHRcdHJldHVybiAwO1xuXHR9LFxuXG5cdF9kZWZhdWx0Rm9ybWF0RGF0YTogZnVuY3Rpb24oanNvbikge1x0Ly9kZWZhdWx0IGNhbGxiYWNrIGZvciBmb3JtYXQgZGF0YSB0byBpbmRleGVkIGRhdGFcblx0XHR2YXIgcHJvcE5hbWUgPSB0aGlzLm9wdGlvbnMucHJvcGVydHlOYW1lLFxuXHRcdFx0cHJvcExvYyA9IHRoaXMub3B0aW9ucy5wcm9wZXJ0eUxvYztcblx0XHR0aGlzLl9yZWNvcmRzQ2FjaGUgPSB7fTtcblx0XHRpZiggTC5VdGlsLmlzQXJyYXkocHJvcExvYykgKVxuXHRcdFx0Zm9yKHZhciBpPTA7IGk8anNvbi5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWNvcmRzQ2FjaGVbIF9nZXRQYXRoKGpzb25baV0scHJvcE5hbWUpIF09IEwubGF0TG5nKCBqc29uW2ldWyBwcm9wTG9jWzBdIF0sIGpzb25baV1bIHByb3BMb2NbMV0gXSApO1xuXHRcdGVsc2VcbiAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpPGpzb24ubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVjb3Jkc0NhY2hlWyBfZ2V0UGF0aChqc29uW2ldLHByb3BOYW1lKSBdPSBMLmxhdExuZyggX2dldFBhdGgoanNvbltpXSxwcm9wTG9jKSApO1xuXHR9LFxuXG5cdF9yZWNvcmRzRnJvbUpzb25wOiBmdW5jdGlvbih0ZXh0LCBjYWxsQWZ0ZXIpIHsgIC8vZXh0cmFjdCBzZWFyY2hlZCByZWNvcmRzIGZyb20gcmVtb3RlIGpzb25wIHNlcnZpY2Vcblx0XHRMLkNvbnRyb2wuU2VhcmNoLmNhbGxKc29ucCA9IGNhbGxBZnRlcjtcblx0XHR2YXIgc2NyaXB0ID0gTC5Eb21VdGlsLmNyZWF0ZSgnc2NyaXB0JywnbGVhZmxldC1zZWFyY2gtanNvbnAnLCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdICksXHRcdFx0XG5cdFx0XHR1cmwgPSBMLlV0aWwudGVtcGxhdGUodGhpcy5fZ2V0VXJsKHRleHQpKycmJyt0aGlzLm9wdGlvbnMuanNvbnBQYXJhbSsnPUwuQ29udHJvbC5TZWFyY2guY2FsbEpzb25wJywge3M6IHRleHR9KTsgLy9wYXJzaW5nIHVybFxuXHRcdFx0Ly9ybmQgPSAnJl89JytNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTAwMDApO1xuXHRcdFx0Ly9UT0RPIGFkZCBybmQgcGFyYW0gb3IgcmFuZG9taXplIGNhbGxiYWNrIG5hbWUhIGluIHJlY29yZHNGcm9tSnNvbnBcblx0XHRzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuXHRcdHNjcmlwdC5zcmMgPSB1cmw7XG5cdFx0cmV0dXJuIHsgYWJvcnQ6IGZ1bmN0aW9uKCkgeyBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpOyB9IH07XG5cdH0sXG5cblx0X3JlY29yZHNGcm9tQWpheDogZnVuY3Rpb24odGV4dCwgY2FsbEFmdGVyKSB7XHQvL0FqYXggcmVxdWVzdFxuXHRcdGlmICh3aW5kb3cuWE1MSHR0cFJlcXVlc3QgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0d2luZG93LlhNTEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdChcIk1pY3Jvc29mdC5YTUxIVFRQLjYuMFwiKTsgfVxuXHRcdFx0XHRjYXRjaCAgKGUxKSB7XG5cdFx0XHRcdFx0dHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTEhUVFAuMy4wXCIpOyB9XG5cdFx0XHRcdFx0Y2F0Y2ggKGUyKSB7IHRocm93IG5ldyBFcnJvcihcIlhNTEh0dHBSZXF1ZXN0IGlzIG5vdCBzdXBwb3J0ZWRcIik7IH1cblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0dmFyIElFOG9yOSA9ICggTC5Ccm93c2VyLmllICYmICF3aW5kb3cuYXRvYiAmJiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yICksXG5cdFx0XHRyZXF1ZXN0ID0gSUU4b3I5ID8gbmV3IFhEb21haW5SZXF1ZXN0KCkgOiBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcblx0XHRcdHVybCA9IEwuVXRpbC50ZW1wbGF0ZSh0aGlzLl9nZXRVcmwodGV4dCksIHtzOiB0ZXh0fSk7XG5cblx0XHQvL3JuZCA9ICcmXz0nK01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoxMDAwMCk7XG5cdFx0Ly9UT0RPIGFkZCBybmQgcGFyYW0gb3IgcmFuZG9taXplIGNhbGxiYWNrIG5hbWUhIGluIHJlY29yZHNGcm9tQWpheFx0XHRcdFxuXHRcdFxuXHRcdHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwpO1xuXHRcdHZhciB0aGF0ID0gdGhpcztcblxuXHRcdHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjYWxsQWZ0ZXIoIEpTT04ucGFyc2UocmVxdWVzdC5yZXNwb25zZVRleHQpICk7XG5cdFx0fTtcblx0XHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCAgICBpZihyZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDQgJiYgcmVxdWVzdC5zdGF0dXMgPT09IDIwMCkge1xuXHRcdCAgICBcdHRoaXMub25sb2FkKCk7XG5cdFx0ICAgIH1cblx0XHR9O1xuXG5cdFx0cmVxdWVzdC5zZW5kKCk7XG5cdFx0cmV0dXJuIHJlcXVlc3Q7ICAgXG5cdH0sXG5cdFxuXHRfcmVjb3Jkc0Zyb21MYXllcjogZnVuY3Rpb24oKSB7XHQvL3JldHVybiB0YWJsZToga2V5LHZhbHVlIGZyb20gbGF5ZXJcblx0XHR2YXIgdGhhdCA9IHRoaXMsXG5cdFx0XHRyZXRSZWNvcmRzID0ge30sXG5cdFx0XHRwcm9wTmFtZSA9IHRoaXMub3B0aW9ucy5wcm9wZXJ0eU5hbWUsXG5cdFx0XHRsb2M7XG5cdFx0dmFyIF9kcm9wZG93blZhbHVlID0gJC50cmltKCQoXCIubGVhZmxldC1jb250cm9sLXNlYXJjaC1maWx0ZXJcIikuYXR0cihcInZhbHVlXCIpKTtcblx0XHR0aGlzLl9sYXllci5lYWNoTGF5ZXIoZnVuY3Rpb24obGF5ZXIpIHtcblxuXHRcdFx0aWYobGF5ZXIuaGFzT3duUHJvcGVydHkoJ19pc01hcmtlclNlYXJjaCcpKSByZXR1cm47XG5cblx0XHRcdGlmKGxheWVyIGluc3RhbmNlb2YgTC5NYXJrZXIgfHwgbGF5ZXIgaW5zdGFuY2VvZiBMLkNpcmNsZU1hcmtlcilcblx0XHRcdHtcblx0XHRcdFx0dHJ5IHtcblxuXHRcdFx0XHRcdGlmKF9nZXRQYXRoKGxheWVyLm9wdGlvbnMscHJvcE5hbWUpICYmXG5cdFx0XHRcdFx0XHQvLyDml6DkuIvmi4npmZDlrprlgLwsIOaIluiAheacieS4i+aLiemZkOWumueahOWxnuaAp+S9huivpeWxnuaAp+WcqG1hcmtlcueahG9wdGlvbnPkuK3kuI3lrZjlnKhcblx0XHRcdFx0XHRcdChfZHJvcGRvd25WYWx1ZSA9PSBcIlwiIHx8IHRoaXMub3B0aW9ucy5maWx0ZXJQcm9wZXJ0eSA9PSBudWxsIHx8IGxheWVyLm9wdGlvbnNbdGhpcy5vcHRpb25zLmZpbHRlclByb3BlcnR5XSA9PSBudWxsXG5cdFx0XHRcdFx0XHQvLyDkuIvmi4npmZDlrprlgLzln58gbWFya2Vy55qE5a+55bqU5bGe5oCn5Yy56YWNXG5cdFx0XHRcdFx0XHR8fCB0aGlzLm9wdGlvbnMuZmlsdGVyUHJvcGVydHkgJiYgKGxheWVyLm9wdGlvbnNbdGhpcy5vcHRpb25zLmZpbHRlclByb3BlcnR5XSA9PSBfZHJvcGRvd25WYWx1ZSkpKSAvL+WPr+iDveeahOWAvCAg6L+e5o6l5Lit5patIFwiMVwiOyDmlYXpmpwgXCIyXCI7IOWBpeW6tyBcIjNcIjtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsb2MgPSBsYXllci5nZXRMYXRMbmcoKTtcblx0XHRcdFx0XHRcdGxvYy5sYXllciA9IGxheWVyO1xuXHRcdFx0XHRcdFx0cmV0UmVjb3Jkc1sgX2dldFBhdGgobGF5ZXIub3B0aW9ucyxwcm9wTmFtZSkgXSA9IGxvYztcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBlbHNlIGlmKF9nZXRQYXRoKGxheWVyLmZlYXR1cmUucHJvcGVydGllcyxwcm9wTmFtZSkgICYmXG5cdFx0XHRcdFx0Ly8gXHQoJC50cmltKHRoaXMuX2Ryb3Bkb3duLnZhbHVlKSA9PVwiXCIgfHwgdGhpcy5vcHRpb25zLmZpbHRlclByb3BlcnR5ID09IG51bGwgfHwgbGF5ZXIub3B0aW9uc1t0aGlzLm9wdGlvbnMudl0gPT0gbnVsbFxuXHRcdFx0XHRcdC8vIFx0XHR8fCAodGhpcy5vcHRpb25zLmZpbHRlclByb3BlcnR5ICYmIGxheWVyLm9wdGlvbnNbdGhpcy5vcHRpb25zLnZdKSA9PSB0aGlzLl9kcm9wZG93bi52YWx1ZSkpe1xuXHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0Ly8gXHRsb2MgPSBsYXllci5nZXRMYXRMbmcoKTtcblx0XHRcdFx0XHQvLyBcdGxvYy5sYXllciA9IGxheWVyO1xuXHRcdFx0XHRcdC8vIFx0cmV0UmVjb3Jkc1sgX2dldFBhdGgobGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzLHByb3BOYW1lKSBdID0gbG9jO1xuXHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0Ly8gfVxuXHRcdFx0XHRcdC8vIGVsc2Vcblx0XHRcdFx0XHQvLyBcdHRocm93IG5ldyBFcnJvcihcInByb3BlcnR5TmFtZSAnXCIrcHJvcE5hbWUrXCInIG5vdCBmb3VuZCBpbiBtYXJrZXJcIik7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2F0Y2goZXJyKXtcblx0XHRcdFx0XHRpZiAoY29uc29sZSkgeyAgfVxuXHRcdFx0XHR9XG5cdFx0XHR9XG4gICAgICAgICAgICBlbHNlIGlmKGxheWVyLmhhc093blByb3BlcnR5KCdmZWF0dXJlJykpLy9HZW9KU09OXG5cdFx0XHR7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0aWYobGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsb2MgPSBsYXllci5nZXRCb3VuZHMoKS5nZXRDZW50ZXIoKTtcblx0XHRcdFx0XHRcdGxvYy5sYXllciA9IGxheWVyO1x0XHRcdFxuXHRcdFx0XHRcdFx0cmV0UmVjb3Jkc1sgbGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzW3Byb3BOYW1lXSBdID0gbG9jO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJwcm9wZXJ0eU5hbWUgJ1wiK3Byb3BOYW1lK1wiJyBub3QgZm91bmQgaW4gZmVhdHVyZVwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXRjaChlcnIpe1xuXHRcdFx0XHRcdGlmIChjb25zb2xlKSB7ICB9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYobGF5ZXIgaW5zdGFuY2VvZiBMLkxheWVyR3JvdXApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy9UT0RPOiBPcHRpbWl6ZVxuICAgICAgICAgICAgICAgIGxheWVyLmVhY2hMYXllcihmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYyA9IG0uZ2V0TGF0TG5nKCk7XG4gICAgICAgICAgICAgICAgICAgIGxvYy5sYXllciA9IG07XG4gICAgICAgICAgICAgICAgICAgIHJldFJlY29yZHNbIG0uZmVhdHVyZS5wcm9wZXJ0aWVzW3Byb3BOYW1lXSBdID0gbG9jO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXHRcdFx0XG5cdFx0fSx0aGlzKTtcblx0XHRcblx0XHRyZXR1cm4gcmV0UmVjb3Jkcztcblx0fSxcblxuXHRfYXV0b1R5cGU6IGZ1bmN0aW9uKCkge1xuXHRcdFxuXHRcdC8vVE9ETyBpbXBsZW1lbnRzIGF1dHlwZSB3aXRob3V0IHNlbGVjdGlvbih1c2VmdWwgZm9yIG1vYmlsZSBkZXZpY2UpXG5cdFx0XG5cdFx0dmFyIHN0YXJ0ID0gdGhpcy5faW5wdXQudmFsdWUubGVuZ3RoLFxuXHRcdFx0Zmlyc3RSZWNvcmQgPSB0aGlzLl90b29sdGlwLmZpcnN0Q2hpbGQuX3RleHQsXG5cdFx0XHRlbmQgPSBmaXJzdFJlY29yZC5sZW5ndGg7XG5cblx0XHRpZiAoZmlyc3RSZWNvcmQuaW5kZXhPZih0aGlzLl9pbnB1dC52YWx1ZSkgPT09IDApIHsgLy8gSWYgcHJlZml4IG1hdGNoXG5cdFx0XHR0aGlzLl9pbnB1dC52YWx1ZSA9IGZpcnN0UmVjb3JkO1xuXHRcdFx0dGhpcy5faGFuZGxlQXV0b3Jlc2l6ZSgpO1xuXG5cdFx0XHRpZiAodGhpcy5faW5wdXQuY3JlYXRlVGV4dFJhbmdlKSB7XG5cdFx0XHRcdHZhciBzZWxSYW5nZSA9IHRoaXMuX2lucHV0LmNyZWF0ZVRleHRSYW5nZSgpO1xuXHRcdFx0XHRzZWxSYW5nZS5jb2xsYXBzZSh0cnVlKTtcblx0XHRcdFx0c2VsUmFuZ2UubW92ZVN0YXJ0KCdjaGFyYWN0ZXInLCBzdGFydCk7XG5cdFx0XHRcdHNlbFJhbmdlLm1vdmVFbmQoJ2NoYXJhY3RlcicsIGVuZCk7XG5cdFx0XHRcdHNlbFJhbmdlLnNlbGVjdCgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZih0aGlzLl9pbnB1dC5zZXRTZWxlY3Rpb25SYW5nZSkge1xuXHRcdFx0XHR0aGlzLl9pbnB1dC5zZXRTZWxlY3Rpb25SYW5nZShzdGFydCwgZW5kKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYodGhpcy5faW5wdXQuc2VsZWN0aW9uU3RhcnQpIHtcblx0XHRcdFx0dGhpcy5faW5wdXQuc2VsZWN0aW9uU3RhcnQgPSBzdGFydDtcblx0XHRcdFx0dGhpcy5faW5wdXQuc2VsZWN0aW9uRW5kID0gZW5kO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRfaGlkZUF1dG9UeXBlOiBmdW5jdGlvbigpIHtcdC8vIGRlc2VsZWN0IHRleHQ6XG5cblx0XHR2YXIgc2VsO1xuXHRcdGlmICgoc2VsID0gdGhpcy5faW5wdXQuc2VsZWN0aW9uKSAmJiBzZWwuZW1wdHkpIHtcblx0XHRcdHNlbC5lbXB0eSgpO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0aGlzLl9pbnB1dC5jcmVhdGVUZXh0UmFuZ2UpIHtcblx0XHRcdHNlbCA9IHRoaXMuX2lucHV0LmNyZWF0ZVRleHRSYW5nZSgpO1xuXHRcdFx0c2VsLmNvbGxhcHNlKHRydWUpO1xuXHRcdFx0dmFyIGVuZCA9IHRoaXMuX2lucHV0LnZhbHVlLmxlbmd0aDtcblx0XHRcdHNlbC5tb3ZlU3RhcnQoJ2NoYXJhY3RlcicsIGVuZCk7XG5cdFx0XHRzZWwubW92ZUVuZCgnY2hhcmFjdGVyJywgZW5kKTtcblx0XHRcdHNlbC5zZWxlY3QoKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAodGhpcy5faW5wdXQuZ2V0U2VsZWN0aW9uKSB7XG5cdFx0XHRcdHRoaXMuX2lucHV0LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5faW5wdXQuc2VsZWN0aW9uU3RhcnQgPSB0aGlzLl9pbnB1dC5zZWxlY3Rpb25FbmQ7XG5cdFx0fVxuXHR9LFxuXHRcblx0X2hhbmRsZUtleXByZXNzOiBmdW5jdGlvbiAoZSkge1x0Ly9ydW4gX2lucHV0IGtleXVwIGV2ZW50XG5cdFx0c3dpdGNoKGUua2V5Q29kZSlcblx0XHR7XG5cdFx0XHRjYXNlIDI3Oi8vRXNjXG5cdFx0XHRcdHRoaXMuY29sbGFwc2UoKTtcblx0XHRcdCAgICBicmVhaztcblx0XHRcdGNhc2UgMTM6Ly9FbnRlclxuICAgICAgICAgICAgICAgIGlmKChtYWluLmdldEJyb3dzZXIoKS5tb3ppbGxhIHx8IG1haW4uZ2V0QnJvd3NlcigpLm1zaWUpICYmICQuaXNFbXB0eU9iamVjdCh0aGlzLl9yZWNvcmRzQ2FjaGUpKXtcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5faW5wdXQudmFsdWUubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FuY2VsLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbmNlbC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmlsbFJlY29yZHNDYWNoZSgpO1xuICAgICAgICAgICAgICAgIH1cblx0XHRcdFx0aWYodGhpcy5fY291bnRlcnRpcHMgPT0gMSB8fCAodGhpcy5vcHRpb25zLmZpcnN0VGlwU3VibWl0ICYmIHRoaXMuX2NvdW50ZXJ0aXBzID4gMCkpXG5cdFx0XHRcdFx0dGhpcy5faGFuZGxlQXJyb3dTZWxlY3QoMSk7XG5cdFx0XHRcdHRoaXMuX2hhbmRsZVN1Ym1pdCgpO1x0Ly9kbyBzZWFyY2hcblx0XHRcdCAgICBicmVhaztcblx0XHRcdGNhc2UgMzg6Ly9VcFxuXHRcdFx0XHR0aGlzLl9oYW5kbGVBcnJvd1NlbGVjdCgtMSk7XG5cdFx0XHQgICAgYnJlYWs7XG5cblx0XHRcdGNhc2UgNDU6Ly9JbnNlcnRcblx0XHRcdFx0dGhpcy5fYXV0b1R5cGVUbXAgPSBmYWxzZTsvL2Rpc2FibGUgdGVtcG9yYXJpbHkgYXV0b1R5cGVcblx0XHRcdCAgICBicmVhaztcblx0XHRcdGNhc2UgMzc6Ly9MZWZ0XG5cdFx0XHRjYXNlIDM5Oi8vUmlnaHRcblx0XHRcdGNhc2UgMTY6Ly9TaGlmdFxuXHRcdFx0Y2FzZSAxNzovL0N0cmxcblx0XHRcdGNhc2UgMzU6Ly9FbmRcblx0XHRcdGNhc2UgMzY6Ly9Ib21lXG5cdFx0XHQgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0Oi8vQWxsIGtleXNcbiAgICAgICAgICAgICAgICAvLyDlkJHkuIvnrq3lpLQsIOinpuWPkeiHquWKqOihpeWFqFxuICAgICAgICAgICAgICAgIGlmKGUua2V5Q29kZSA9PSA0MCAmJiAkKFwiLnNlYXJjaC10aXBcIikubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZUFycm93U2VsZWN0KDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG5cdFx0XHRcdGlmKHRoaXMuX2lucHV0LnZhbHVlLmxlbmd0aClcblx0XHRcdFx0XHR0aGlzLl9jYW5jZWwuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHRoaXMuX2NhbmNlbC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cdFx0XHRcdGlmKHRoaXMuX2lucHV0LnZhbHVlLmxlbmd0aCA+PSB0aGlzLm9wdGlvbnMubWluTGVuZ3RoKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIHRoYXQgPSB0aGlzO1xuXG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMudGltZXJLZXlwcmVzcyk7XHQvL2NhbmNlbCBsYXN0IHNlYXJjaCByZXF1ZXN0IHdoaWxlIHR5cGUgaW5cdFx0XHRcdFxuXHRcdFx0XHRcdHRoaXMudGltZXJLZXlwcmVzcyA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHQvL2RlbGF5IGJlZm9yZSByZXF1ZXN0LCBmb3IgbGltaXQganNvbnAvYWpheCByZXF1ZXN0XG5cblx0XHRcdFx0XHRcdHRoYXQuX2ZpbGxSZWNvcmRzQ2FjaGUoKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR9LCB0aGlzLm9wdGlvbnMuZGVsYXlUeXBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0dGhpcy5faGlkZVRvb2x0aXAoKTtcblx0XHR9XG5cblx0XHR0aGlzLl9oYW5kbGVBdXRvcmVzaXplKCk7XG5cdH0sXG5cblx0c2VhcmNoVGV4dDogZnVuY3Rpb24odGV4dCkge1xuXHRcdHZhciBjb2RlID0gdGV4dC5jaGFyQ29kZUF0KHRleHQubGVuZ3RoKTtcblxuXHRcdHRoaXMuX2lucHV0LnZhbHVlID0gdGV4dDtcblxuXHRcdHRoaXMuX2lucHV0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9jb250YWluZXIsICdzZWFyY2gtZXhwJyk7XG5cblx0XHR0aGlzLl9hdXRvVHlwZVRtcCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5faGFuZGxlS2V5cHJlc3Moe2tleUNvZGU6IGNvZGV9KTtcblx0fSxcblx0XG5cdF9maWxsUmVjb3Jkc0NhY2hlOiBmdW5jdGlvbigpIHtcbi8vVE9ETyBpbXBvcnRhbnQgb3B0aW1pemF0aW9uISEhIGFsd2F5cyBhcHBlbmQgZGF0YSBpbiB0aGlzLl9yZWNvcmRzQ2FjaGVcbi8vICBub3cgX3JlY29yZHNDYWNoZSBjb250ZW50IGlzIGVtcHRpZWQgYW5kIHJlcGxhY2VkIHdpdGggbmV3IGRhdGEgZm91bmRlZFxuLy8gIGFsd2F5cyBhcHBlbmRpbmcgZGF0YSBvbiBfcmVjb3Jkc0NhY2hlIGdpdmUgdGhlIHBvc3NpYmlsaXR5IG9mIGNhY2hpbmcgYWpheCwganNvbnAgYW5kIGxheWVyc2VhcmNoIVxuLy9cbi8vVE9ETyBoZXJlIGluc2VydCBmdW5jdGlvbiB0aGF0IHNlYXJjaCBpbnB1dFRleHQgRklSU1QgaW4gX3JlY29yZHNDYWNoZSBrZXlzIGFuZCBpZiBub3QgZmluZCByZXN1bHRzLi4gXG4vLyAgcnVuIG9uZSBvZiBjYWxsYmFja3Mgc2VhcmNoKHNvdXJjZURhdGEsanNvbnBVcmwgb3Igb3B0aW9ucy5sYXllcikgYW5kIHJ1biB0aGlzLnNob3dUb29sdGlwXG4vL1xuLy9UT0RPIGNoYW5nZSBzdHJ1Y3R1cmUgb2YgX3JlY29yZHNDYWNoZVxuLy9cdGxpa2UgdGhpczogX3JlY29yZHNDYWNoZSA9IHtcInRleHQta2V5MVwiOiB7bG9jOltsYXQsbG5nXSwgLi5vdGhlciBhdHRyaWJ1dGVzLi4gfSwge1widGV4dC1rZXkyXCI6IHtsb2M6W2xhdCxsbmddfS4uLn0sIC4uLn1cbi8vXHRpbiB0aGlzIHdheSBldmVyeSByZWNvcmQgY2FuIGhhdmUgYSBmcmVlIHN0cnVjdHVyZSBvZiBhdHRyaWJ1dGVzLCBvbmx5ICdsb2MnIGlzIHJlcXVpcmVkXG4gICAgICAgIC8v5YWI5bCG55S156uZ57G75Yir6YCJ5oup6ZqQ6JePXG4gICAgICAgICQoXCIubGVhZmxldC1jb250cm9sLXNlYXJjaC1maWx0ZXIgLml0ZW1zXCIpLmNzcygnZGlzcGxheScsJ25vbmUnKTtcblx0XHR2YXIgaW5wdXRUZXh0ID0gdGhpcy5faW5wdXQudmFsdWUsXG5cdFx0XHR0aGF0ID0gdGhpcywgcmVjb3JkcztcblxuXHRcdGlmKHRoaXMuX2N1clJlcSAmJiB0aGlzLl9jdXJSZXEuYWJvcnQpXG5cdFx0XHR0aGlzLl9jdXJSZXEuYWJvcnQoKTtcblx0XHQvL2Fib3J0IHByZXZpb3VzIHJlcXVlc3RzXG5cblx0XHRMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnc2VhcmNoLWxvYWQnKTtcdFxuXG5cdFx0aWYodGhpcy5vcHRpb25zLmxheWVyKVxuXHRcdHtcblx0XHRcdC8vVE9ETyBfcmVjb3Jkc0Zyb21MYXllciBtdXN0IHJldHVybiBhcnJheSBvZiBvYmplY3RzLCBmb3JtYXR0ZWQgZnJvbSBfZm9ybWF0RGF0YVxuXHRcdFx0dGhpcy5fcmVjb3Jkc0NhY2hlID0gdGhpcy5fcmVjb3Jkc0Zyb21MYXllcigpO1xuXG5cdFx0XHRyZWNvcmRzID0gdGhpcy5fZmlsdGVyRGF0YSggdGhpcy5faW5wdXQudmFsdWUsIHRoaXMuX3JlY29yZHNDYWNoZSApO1xuXHRcdFx0dGhpcy5zaG93VG9vbHRpcCggcmVjb3JkcyApO1xuXG5cdFx0XHRMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnc2VhcmNoLWxvYWQnKTtcblx0XHR9XG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy5zb3VyY2VEYXRhKVxuICAgICAgICAgICAgdGhpcy5fcmV0cmlldmVEYXRhID0gdGhpcy5vcHRpb25zLnNvdXJjZURhdGE7XG5cbiAgICAgICAgZWxzZSBpZih0aGlzLm9wdGlvbnMudXJsKVx0Ly9qc29ucCBvciBhamF4XG4gICAgICAgICAgICB0aGlzLl9yZXRyaWV2ZURhdGEgPSB0aGlzLm9wdGlvbnMuanNvbnBQYXJhbSA/IHRoaXMuX3JlY29yZHNGcm9tSnNvbnAgOiB0aGlzLl9yZWNvcmRzRnJvbUFqYXg7XG5cbiAgICAgICAgdGhpcy5fY3VyUmVxID0gdGhpcy5fcmV0cmlldmVEYXRhICYmIHRoaXMuX3JldHJpZXZlRGF0YS5jYWxsKHRoaXMsIGlucHV0VGV4dCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRoYXQuX2Zvcm1hdERhdGEuY2FsbCh0aGF0LCByZXNwb25zZSk7XG4gICAgICAgICAgICAvL1RPRE8gcmVmYWN0IVxuICAgICAgICAgICAgaWYodGhhdC5vcHRpb25zLnNvdXJjZURhdGEpXG4gICAgICAgICAgICAgICAgcmVjb3JkcyA9IHRoYXQuX2ZpbHRlckRhdGEoIHRoYXQuX2lucHV0LnZhbHVlLCB0aGF0Ll9yZWNvcmRzQ2FjaGUgKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZWNvcmRzID0gdGhhdC5fcmVjb3Jkc0NhY2hlO1xuICAgICAgICAgICAgdGhhdC5zaG93VG9vbHRpcCggcmVjb3JkcyApO1xuXG4gICAgICAgICAgICBMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhhdC5fY29udGFpbmVyLCAnc2VhcmNoLWxvYWQnKTtcbiAgICAgICAgfSk7XG5cdH0sXG5cdFxuXHRfaGFuZGxlQXV0b3Jlc2l6ZTogZnVuY3Rpb24oKSB7XHQvL2F1dG9yZXNpemUgdGhpcy5faW5wdXRcblx0ICAgIC8vVE9ETyByZWZhY3QgX2hhbmRsZUF1dG9yZXNpemUgbm93IGlzIG5vdCBhY2N1cmF0ZVxuXHQgICAgaWYgKHRoaXMuX2lucHV0LnN0eWxlLm1heFdpZHRoICE9IHRoaXMuX21hcC5fY29udGFpbmVyLm9mZnNldFdpZHRoKSAvL0lmIG1heFdpZHRoIGlzbid0IHRoZSBzYW1lIGFzIHdoZW4gZmlyc3Qgc2V0LCByZXNldCB0byBjdXJyZW50IE1hcCB3aWR0aFxuXHQgICAgICAgIHRoaXMuX2lucHV0LnN0eWxlLm1heFdpZHRoID0gTC5Eb21VdGlsLmdldFN0eWxlKHRoaXMuX21hcC5fY29udGFpbmVyLCAnd2lkdGgnKTtcblxuXHRcdGlmKHRoaXMub3B0aW9ucy5hdXRvUmVzaXplICYmICh0aGlzLl9jb250YWluZXIub2Zmc2V0V2lkdGggKyA0NSA8IHRoaXMuX21hcC5fY29udGFpbmVyLm9mZnNldFdpZHRoKSlcblx0XHRcdHRoaXMuX2lucHV0LnNpemUgPSB0aGlzLl9pbnB1dC52YWx1ZS5sZW5ndGg8dGhpcy5faW5wdXRNaW5TaXplID8gdGhpcy5faW5wdXRNaW5TaXplIDogdGhpcy5faW5wdXQudmFsdWUubGVuZ3RoO1xuXHR9LFxuXG5cdF9oYW5kbGVBcnJvd1NlbGVjdDogZnVuY3Rpb24odmVsb2NpdHkpIHtcblx0XG5cdFx0dmFyIHNlYXJjaFRpcHMgPSB0aGlzLl90b29sdGlwLmhhc0NoaWxkTm9kZXMoKSA/IHRoaXMuX3Rvb2x0aXAuY2hpbGROb2RlcyA6IFtdO1xuICAgICAgICBpZihzZWFyY2hUaXBzLmxlbmd0aCA9PSAwKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXHRcdGZvciAoaT0wOyBpPHNlYXJjaFRpcHMubGVuZ3RoOyBpKyspXG5cdFx0XHRMLkRvbVV0aWwucmVtb3ZlQ2xhc3Moc2VhcmNoVGlwc1tpXSwgJ3NlYXJjaC10aXAtc2VsZWN0Jyk7XG5cdFx0XG5cdFx0aWYgKCh2ZWxvY2l0eSA9PSAxICkgJiYgKHRoaXMuX3Rvb2x0aXAuY3VycmVudFNlbGVjdGlvbiA+PSAoc2VhcmNoVGlwcy5sZW5ndGggLSAxKSkpIHsvLyBJZiBhdCBlbmQgb2YgbGlzdC5cblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyhzZWFyY2hUaXBzW3RoaXMuX3Rvb2x0aXAuY3VycmVudFNlbGVjdGlvbl0sICdzZWFyY2gtdGlwLXNlbGVjdCcpO1xuXHRcdH1cblx0XHRlbHNlIGlmICgodmVsb2NpdHkgPT0gLTEgKSAmJiAodGhpcy5fdG9vbHRpcC5jdXJyZW50U2VsZWN0aW9uIDw9IDApKSB7IC8vIEdvaW5nIGJhY2sgdXAgdG8gdGhlIHNlYXJjaCBib3guXG5cdFx0XHR0aGlzLl90b29sdGlwLmN1cnJlbnRTZWxlY3Rpb24gPSAtMTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodGhpcy5fdG9vbHRpcC5zdHlsZS5kaXNwbGF5ICE9ICdub25lJykge1xuXHRcdFx0dGhpcy5fdG9vbHRpcC5jdXJyZW50U2VsZWN0aW9uICs9IHZlbG9jaXR5O1xuXHRcdFx0XG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3Moc2VhcmNoVGlwc1t0aGlzLl90b29sdGlwLmN1cnJlbnRTZWxlY3Rpb25dLCAnc2VhcmNoLXRpcC1zZWxlY3QnKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5faW5wdXQudmFsdWUgPSBzZWFyY2hUaXBzW3RoaXMuX3Rvb2x0aXAuY3VycmVudFNlbGVjdGlvbl0uX3RleHQ7XG5cblx0XHRcdC8vIHNjcm9sbDpcblx0XHRcdHZhciB0aXBPZmZzZXRUb3AgPSBzZWFyY2hUaXBzW3RoaXMuX3Rvb2x0aXAuY3VycmVudFNlbGVjdGlvbl0ub2Zmc2V0VG9wO1xuXHRcdFx0XG5cdFx0XHRpZiAodGlwT2Zmc2V0VG9wICsgc2VhcmNoVGlwc1t0aGlzLl90b29sdGlwLmN1cnJlbnRTZWxlY3Rpb25dLmNsaWVudEhlaWdodCA+PSB0aGlzLl90b29sdGlwLnNjcm9sbFRvcCArIHRoaXMuX3Rvb2x0aXAuY2xpZW50SGVpZ2h0KSB7XG5cdFx0XHRcdHRoaXMuX3Rvb2x0aXAuc2Nyb2xsVG9wID0gdGlwT2Zmc2V0VG9wIC0gdGhpcy5fdG9vbHRpcC5jbGllbnRIZWlnaHQgKyBzZWFyY2hUaXBzW3RoaXMuX3Rvb2x0aXAuY3VycmVudFNlbGVjdGlvbl0uY2xpZW50SGVpZ2h0O1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAodGlwT2Zmc2V0VG9wIDw9IHRoaXMuX3Rvb2x0aXAuc2Nyb2xsVG9wKSB7XG5cdFx0XHRcdHRoaXMuX3Rvb2x0aXAuc2Nyb2xsVG9wID0gdGlwT2Zmc2V0VG9wO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRfaGFuZGxlU3VibWl0OiBmdW5jdGlvbigpIHtcdC8vYnV0dG9uIGFuZCB0b29sdGlwIGNsaWNrIGFuZCBlbnRlciBzdWJtaXRcbiAgICAgICAgLy/lhYjlsIbnlLXnq5nnsbvliKvpgInmi6npmpDol49cbiAgICAgICAgJChcIi5sZWFmbGV0LWNvbnRyb2wtc2VhcmNoLWZpbHRlciAuaXRlbXNcIikuY3NzKCdkaXNwbGF5Jywnbm9uZScpO1xuXHRcdHRoaXMuX2hpZGVBdXRvVHlwZSgpO1xuXHRcdFxuXHRcdHRoaXMuaGlkZUFsZXJ0KCk7XG5cdFx0dGhpcy5faGlkZVRvb2x0aXAoKTtcblxuXHRcdGlmKHRoaXMuX2lucHV0LnN0eWxlLmRpc3BsYXkgPT0gJ25vbmUnKVx0Ly9vbiBmaXJzdCBjbGljayBzaG93IF9pbnB1dCBvbmx5XG5cdFx0XHR0aGlzLmV4cGFuZCgpO1xuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRpZih0aGlzLl9pbnB1dC52YWx1ZSA9PT0gJycpXHQvL2hpZGUgX2lucHV0IG9ubHlcblx0XHRcdFx0dGhpcy5jb2xsYXBzZSgpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgbG9jID0gdGhpcy5fZ2V0TG9jYXRpb24odGhpcy5faW5wdXQudmFsdWUpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYobG9jPT09ZmFsc2UpXG5cdFx0XHRcdFx0dGhpcy5zaG93QWxlcnQoKTtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5jbGlja0NhbGxiYWNrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jbGlja0NhbGxiYWNrLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblx0XHRcdFx0XHR0aGlzLnNob3dMb2NhdGlvbihsb2MsIHRoaXMuX2lucHV0LnZhbHVlKTtcblx0XHRcdFx0XHR0aGlzLmZpcmUoJ3NlYXJjaDpsb2NhdGlvbmZvdW5kJywge1xuXHRcdFx0XHRcdFx0XHRsYXRsbmc6IGxvYyxcblx0XHRcdFx0XHRcdFx0dGV4dDogdGhpcy5faW5wdXQudmFsdWUsXG5cdFx0XHRcdFx0XHRcdGxheWVyOiBsb2MubGF5ZXIgPyBsb2MubGF5ZXIgOiBudWxsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRfZ2V0TG9jYXRpb246IGZ1bmN0aW9uKGtleSkge1x0Ly9leHRyYWN0IGxhdGxuZyBmcm9tIF9yZWNvcmRzQ2FjaGVcblxuXHRcdGlmKCB0aGlzLl9yZWNvcmRzQ2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSApXG5cdFx0XHRyZXR1cm4gdGhpcy5fcmVjb3Jkc0NhY2hlW2tleV07Ly90aGVuIGFmdGVyIHVzZSAubG9jIGF0dHJpYnV0ZVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRfZGVmYXVsdE1vdmVUb0xvY2F0aW9uOiBmdW5jdGlvbihsYXRsbmcsIHRpdGxlLCBtYXApIHtcblx0XHRpZih0aGlzLm9wdGlvbnMuem9vbSlcbiBcdFx0XHR0aGlzLl9tYXAuc2V0VmlldyhsYXRsbmcsIHRoaXMub3B0aW9ucy56b29tKTtcbiBcdFx0ZWxzZVxuXHRcdFx0dGhpcy5fbWFwLnBhblRvKGxhdGxuZyk7XG5cdH0sXG5cblx0c2hvd0xvY2F0aW9uOiBmdW5jdGlvbihsYXRsbmcsIHRpdGxlKSB7XHQvL3NldCBsb2NhdGlvbiBvbiBtYXAgZnJvbSBfcmVjb3Jkc0NhY2hlXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0c2VsZi5fbWFwLm9uY2UoJ21vdmVlbmQgem9vbWVuZCcsIGZ1bmN0aW9uKGUpIHtcblxuXHRcdFx0aWYoc2VsZi5fbWFya2VyU2VhcmNoKSB7XG5cdFx0XHRcdHNlbGYuX21hcmtlclNlYXJjaC5hZGRUbyhzZWxmLl9tYXApLnNldExhdExuZyhsYXRsbmcpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fSk7XG5cblx0XHRzZWxmLl9tb3ZlVG9Mb2NhdGlvbihsYXRsbmcsIHRpdGxlLCBzZWxmLl9tYXApO1xuXHRcdC8vRklYTUUgYXV0b0NvbGxhcHNlIG9wdGlvbiBoaWRlIHNlbGYuX21hcmtlclNlYXJjaCBiZWZvcmUgdGhhdCB2aXN1YWxpemVkISFcblx0XHRpZihzZWxmLm9wdGlvbnMuYXV0b0NvbGxhcHNlKVxuXHRcdFx0c2VsZi5jb2xsYXBzZSgpO1xuXG5cdFx0cmV0dXJuIHNlbGY7XG5cdH1cbn0pO1xuXG5MLkNvbnRyb2wuU2VhcmNoLk1hcmtlciA9IEwuTWFya2VyLmV4dGVuZCh7XG5cblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxuXHRcblx0b3B0aW9uczoge1xuXHRcdGljb246IG5ldyBMLkljb24uRGVmYXVsdCgpLFxuXHRcdGFuaW1hdGU6IHRydWUsXG5cdFx0Y2lyY2xlOiB7XG5cdFx0XHRyYWRpdXM6IDEwLFxuXHRcdFx0d2VpZ2h0OiAzLFxuXHRcdFx0Y29sb3I6ICcjZTAzJyxcblx0XHRcdHN0cm9rZTogdHJ1ZSxcblx0XHRcdGZpbGw6IGZhbHNlXG5cdFx0fVxuXHR9LFxuXHRcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xuXHRcdEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcblxuXHRcdGlmKG9wdGlvbnMuaWNvbiA9PT0gdHJ1ZSlcblx0XHRcdG9wdGlvbnMuaWNvbiA9IG5ldyBMLkljb24uRGVmYXVsdCgpO1xuXG5cdFx0TC5NYXJrZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBsYXRsbmcsIG9wdGlvbnMpO1xuXHRcdFxuXHRcdGlmKCBfaXNPYmplY3QodGhpcy5vcHRpb25zLmNpcmNsZSkgKVxuXHRcdFx0dGhpcy5fY2lyY2xlTG9jID0gbmV3IEwuQ2lyY2xlTWFya2VyKGxhdGxuZywgdGhpcy5vcHRpb25zLmNpcmNsZSk7XG5cdH0sXG5cblx0b25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcblx0XHRMLk1hcmtlci5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xuXHRcdGlmKHRoaXMuX2NpcmNsZUxvYykge1xuXHRcdFx0bWFwLmFkZExheWVyKHRoaXMuX2NpcmNsZUxvYyk7XG5cdFx0XHRpZih0aGlzLm9wdGlvbnMuYW5pbWF0ZSlcblx0XHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XG5cdFx0TC5NYXJrZXIucHJvdG90eXBlLm9uUmVtb3ZlLmNhbGwodGhpcywgbWFwKTtcblx0XHRpZih0aGlzLl9jaXJjbGVMb2MpXG5cdFx0XHRtYXAucmVtb3ZlTGF5ZXIodGhpcy5fY2lyY2xlTG9jKTtcblx0fSxcblx0XG5cdHNldExhdExuZzogZnVuY3Rpb24gKGxhdGxuZykge1xuXHRcdEwuTWFya2VyLnByb3RvdHlwZS5zZXRMYXRMbmcuY2FsbCh0aGlzLCBsYXRsbmcpO1xuXHRcdGlmKHRoaXMuX2NpcmNsZUxvYylcblx0XHRcdHRoaXMuX2NpcmNsZUxvYy5zZXRMYXRMbmcobGF0bG5nKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0XG5cdF9pbml0SWNvbjogZnVuY3Rpb24gKCkge1xuXHRcdGlmKHRoaXMub3B0aW9ucy5pY29uKVxuXHRcdFx0TC5NYXJrZXIucHJvdG90eXBlLl9pbml0SWNvbi5jYWxsKHRoaXMpO1xuXHR9LFxuXG5cdF9yZW1vdmVJY29uOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYodGhpcy5vcHRpb25zLmljb24pXG5cdFx0XHRMLk1hcmtlci5wcm90b3R5cGUuX3JlbW92ZUljb24uY2FsbCh0aGlzKTtcblx0fSxcblxuXHRhbmltYXRlOiBmdW5jdGlvbigpIHtcblx0Ly9UT0RPIHJlZmFjdCBhbmltYXRlKCkgbW9yZSBzbW9vdGghIGxpa2UgdGhpczogaHR0cDovL2dvby5nbC9ERGxSc1xuXHRcdGlmKHRoaXMuX2NpcmNsZUxvYylcblx0XHR7XG5cdFx0XHR2YXIgY2lyY2xlID0gdGhpcy5fY2lyY2xlTG9jLFxuXHRcdFx0XHR0SW50ID0gMjAwLFx0Ly90aW1lIGludGVydmFsXG5cdFx0XHRcdHNzID0gNSxcdC8vZnJhbWVzXG5cdFx0XHRcdG1yID0gcGFyc2VJbnQoY2lyY2xlLl9yYWRpdXMvc3MpLFxuXHRcdFx0XHRvbGRyYWQgPSB0aGlzLm9wdGlvbnMuY2lyY2xlLnJhZGl1cyxcblx0XHRcdFx0bmV3cmFkID0gY2lyY2xlLl9yYWRpdXMgKiAyLFxuXHRcdFx0XHRhY2MgPSAwO1xuXG5cdFx0XHRjaXJjbGUuX3RpbWVyQW5pbUxvYyA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRhY2MgKz0gMC41O1xuXHRcdFx0XHRtciArPSBhY2M7XHQvL2FkZGluZyBhY2NlbGVyYXRpb25cblx0XHRcdFx0bmV3cmFkIC09IG1yO1xuXHRcdFx0XHRcblx0XHRcdFx0Y2lyY2xlLnNldFJhZGl1cyhuZXdyYWQpO1xuXG5cdFx0XHRcdGlmKG5ld3JhZDxvbGRyYWQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjbGVhckludGVydmFsKGNpcmNsZS5fdGltZXJBbmltTG9jKTtcblx0XHRcdFx0XHRjaXJjbGUuc2V0UmFkaXVzKG9sZHJhZCk7Ly9yZXNldCByYWRpdXNcblx0XHRcdFx0XHQvL2lmKHR5cGVvZiBhZnRlckFuaW1DYWxsID09ICdmdW5jdGlvbicpXG5cdFx0XHRcdFx0XHQvL2FmdGVyQW5pbUNhbGwoKTtcblx0XHRcdFx0XHRcdC8vVE9ETyB1c2UgY3JlYXRlIGV2ZW50ICdhbmltYXRlRW5kJyBpbiBMLkNvbnRyb2wuU2VhcmNoLk1hcmtlciBcblx0XHRcdFx0fVxuXHRcdFx0fSwgdEludCk7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxuTC5NYXAuYWRkSW5pdEhvb2soZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuc2VhcmNoQ29udHJvbCkge1xuICAgICAgICB0aGlzLnNlYXJjaENvbnRyb2wgPSBMLmNvbnRyb2wuc2VhcmNoKHRoaXMub3B0aW9ucy5zZWFyY2hDb250cm9sKTtcbiAgICAgICAgdGhpcy5hZGRDb250cm9sKHRoaXMuc2VhcmNoQ29udHJvbCk7XG4gICAgfVxufSk7XG5cbkwuY29udHJvbC5zZWFyY2ggPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgTC5Db250cm9sLlNlYXJjaChvcHRpb25zKTtcbn07XG5cbnJldHVybiBMLkNvbnRyb2wuU2VhcmNoO1xuXG59KTtcblxuXG4iXSwiZmlsZSI6InBsdWdpbnMvTGVhZmxldC9sZWFmbGV0LnNlYXJjaC5qcyJ9
