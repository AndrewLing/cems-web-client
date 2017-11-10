/*jshint asi:true, expr:true */
/**
 * Plugin Name: Combo Select
 * Author : Vinay@Pebbleroad
 * Date: 23/11/2014
 * Description: 
 * Converts a select box into a searchable and keyboard friendly interface. Fallbacks to native select on mobile and tablets
 */

// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
	'use strict';
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object' && typeof require === 'function') {
		// Browserify
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ( $, undefined ) {

	var pluginName = "comboSelect",
		dataKey = 'comboselect';
	var defaults = {			
		comboClass         : 'combo-select',
		comboArrowClass    : 'combo-arrow',
		comboDropDownClass : 'combo-dropdown',
		inputClass         : 'combo-input text-input',
		disabledClass      : 'option-disabled',
		hoverClass         : 'option-hover',
		selectedClass      : 'option-selected',
		markerClass        : 'combo-marker',
		themeClass         : '',
		maxHeight          : 200,
		extendStyle        : true,
		focusInput         : true
	};

	/**
	 * Utility functions
	 */

	var keys = {
		ESC: 27,
		TAB: 9,
		RETURN: 13,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		ENTER: 13,
		SHIFT: 16
	},	
	isMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));

	/**
	 * Constructor
	 * @param {[Node]} element [Select element]
	 * @param {[Object]} options [Option object]
	 */
	function Plugin ( element, options ) {
			
		/* Name of the plugin */

		this._name = pluginName;

		/* Reverse lookup */

		this.el = element

		/* Element */

		this.$el = $(element)

		/* If multiple select: stop */
		
		if(this.$el.prop('multiple')) return;

		/* Settings */

		this.settings = $.extend( {}, defaults, options, this.$el.data() );

		/* Defaults */

		this._defaults = defaults;

		/* Options */

		this.$options = this.$el.find('option, optgroup')

		/* Initialize */

		this.init();

		/* Instances */

		$.fn[ pluginName ].instances.push(this);

	}

	$.extend(Plugin.prototype, {
		init: function () {

			/* Construct the comboselect */

			this._construct();


			/* Add event bindings */          

			this._events();


		},
		_construct: function(){

			var self = this

			/**
			 * Add negative TabIndex to `select`
			 * Preserves previous tabindex
			 */
			
			this.$el.data('plugin_'+ dataKey + '_tabindex', this.$el.prop('tabindex'))

			/* Add a tab index for desktop browsers */

			!isMobile && this.$el.prop("tabIndex", -1)

			/**
			 * Wrap the Select
			 */

			this.$container = this.$el.wrapAll('<div class="' + this.settings.comboClass + ' '+ this.settings.themeClass + '" />').parent();
			
			/**
			 * Check if select has a width attribute
			 */
			if(this.settings.extendStyle && this.$el.attr('style')){

				this.$container.attr('style', this.$el.attr("style"))
				
			}
			

			/**
			 * Append dropdown arrow
			 */

			this.$arrow = $('<div class="'+ this.settings.comboArrowClass+ '" />').appendTo(this.$container)


			/**
			 * Append dropdown
			 */

			this.$dropdown = $('<ul class="'+this.settings.comboDropDownClass+'" />').appendTo(this.$container)


			/**
			 * Create dropdown options
			 */

			var o = '', k = 0, p = '';

			this.selectedIndex = this.$el.prop('selectedIndex')

			this.$options.each(function(i, e){

				if(e.nodeName.toLowerCase() == 'optgroup'){

					return o+='<li class="option-group">'+this.label+'</li>'
				}

				if(!e.value) p = e.innerHTML

				o+='<li class="'+(this.disabled? self.settings.disabledClass : "option-item") + ' ' +(k == self.selectedIndex? self.settings.selectedClass : '')+ '" data-index="'+(k)+'" data-value="'+this.value+'">'+ (this.innerHTML) + '</li>'

				k++;
			})

			this.$dropdown.html(o)

			/**
			 * Items
			 */

			this.$items = this.$dropdown.children();


			/**
			 * Append Input
			 */

			this.$input = $('<input type="text"' + (isMobile? 'tabindex="-1"': '') + ' placeholder="'+p+'" class="'+ this.settings.inputClass + '">').appendTo(this.$container)

			/* Update input text */

			this._updateInput()

		},

		_events: function(){

			/* Input: focus */

			this.$container.on('focus.input', 'input', $.proxy(this._focus, this))

			/**
			 * Input: mouseup
			 * For input select() event to function correctly
			 */
			this.$container.on('mouseup.input', 'input', function(e){
				e.preventDefault()
			})

			/* Input: blur */

			this.$container.on('blur.input', 'input', $.proxy(this._blur, this))

			/* Select: change */

			this.$el.on('change.select', $.proxy(this._change, this))

			/* Select: focus */

			this.$el.on('focus.select', $.proxy(this._focus, this))

			/* Select: blur */

			this.$el.on('blur.select', $.proxy(this._blurSelect, this))

			/* Dropdown Arrow: click */

			this.$container.on('click.arrow', '.'+this.settings.comboArrowClass , $.proxy(this._toggle, this))

			/* Dropdown: close */

			this.$container.on('comboselect:close', $.proxy(this._close, this))

			/* Dropdown: open */

			this.$container.on('comboselect:open', $.proxy(this._open, this))


			/* HTML Click */

			$('html').off('click.comboselect').on('click.comboselect', function(){
				
				$.each($.fn[ pluginName ].instances, function(i, plugin){

					plugin.$container.trigger('comboselect:close')

				})
			});

			/* Stop `event:click` bubbling */

			this.$container.on('click.comboselect', function(e){
				e.stopPropagation();
			})


			/* Input: keydown */

			this.$container.on('keydown', 'input', $.proxy(this._keydown, this))

			/* Input: keyup */
			
			this.$container.on('keyup', 'input', $.proxy(this._keyup, this))

			/* Dropdown item: click */

			this.$container.on('click.item', '.option-item', $.proxy(this._select, this))

		},

		_keydown: function(event){

			

			switch(event.which){

				case keys.UP:
					this._move('up', event)
					break;

				case keys.DOWN:
					this._move('down', event)
					break;
				
				case keys.TAB:
					this._enter(event)
					break;

				case keys.RIGHT:
					this._autofill(event);
					break;

				case keys.ENTER:
					this._enter(event);
					break;

				default:							
					break;


			}

		},
		

		_keyup: function(event){
			
			switch(event.which){
				case keys.ESC:													
					this.$container.trigger('comboselect:close')
					break;

				case keys.ENTER:
				case keys.UP:
				case keys.DOWN:
				case keys.LEFT:
				case keys.RIGHT:
				case keys.TAB:
				case keys.SHIFT:							
					break;
				
				default:							
					this._filter(event.target.value)
					break;
			}
		},
		
		_enter: function(event){

			var item = this._getHovered()

			item.length && this._select(item);

			/* Check if it enter key */
			if(event && event.which == keys.ENTER){

				if(!item.length) {
					
					/* Check if its illegal value */

					this._blur();

					return true;
				}

				event.preventDefault();
			}
			

		},
		_move: function(dir){

			var items = this._getVisible(),
				current = this._getHovered(),
				index = current.prevAll('.option-item').filter(':visible').length,
				total = items.length

			
			switch(dir){
				case 'up':
					index--;
					(index < 0) && (index = (total - 1));
					break;

				case 'down':							
					index++;
					(index >= total) && (index = 0);							
					break;
			}

			
			items
				.removeClass(this.settings.hoverClass)
				.eq(index)
				.addClass(this.settings.hoverClass)


			if(!this.opened) this.$container.trigger('comboselect:open');

			this._fixScroll()
		},

		_select: function(event){

			var item = event.currentTarget? $(event.currentTarget) : $(event);

			if(!item.length) return;

			/**
			 * 1. get Index
			 */
			
			var index = item.data('index');

			this._selectByIndex(index);

			this.$container.trigger('comboselect:close')					

		},

		_selectByIndex: function(index){

			/**
			 * Set selected index and trigger change
			 * @type {[type]}
			 */
			if(typeof index == 'undefined'){
				
				index = 0

			}
			
			if(this.$el.prop('selectedIndex') != index){

				this.$el.prop('selectedIndex', index).trigger('change');
			}

		},

		_autofill: function(){

			var item = this._getHovered();

			if(item.length){

				var index = item.data('index')

				this._selectByIndex(index)

			}

		},
		

		_filter: function(search){

			var self = this,
				items = this._getAll();
				needle = $.trim(search).toLowerCase(),
				reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g'),
				pattern = '(' + search.replace(reEscape, '\\$1') + ')';


			/**
			 * Unwrap all markers
			 */
			
			$('.'+self.settings.markerClass, items).contents().unwrap();

			/* Search */
			
			if(needle){

				/* Hide Disabled and optgroups */

				this.$items.filter('.option-group, .option-disabled').hide();
			
				
				items							
					.hide()
					.filter(function(){

						var $this = $(this),
							text = $.trim($this.text()).toLowerCase();
						
						/* Found */
						if(text.toString().indexOf(needle) != -1){
																
							/**
							 * Wrap the selection
							 */									
							
							$this
								.html(function(index, oldhtml){
								return oldhtml.replace(new RegExp(pattern, 'gi'), '<span class="'+self.settings.markerClass+'">$1</span>')
							})									

							return true
						}

					})
					.show()
			}else{

								
				this.$items.show();
			}

			/* Open the comboselect */

			this.$container.trigger('comboselect:open')
			

		},

		_highlight: function(){

			/* 
			1. Check if there is a selected item 
			2. Add hover class to it
			3. If not add hover class to first item
			*/
		
			var visible = this._getVisible().removeClass(this.settings.hoverClass),
				$selected = visible.filter('.'+this.settings.selectedClass)

			if($selected.length){
				
				$selected.addClass(this.settings.hoverClass);

			}else{

				visible
					.removeClass(this.settings.hoverClass)
					.first()
					.addClass(this.settings.hoverClass)
			}

		},

		_updateInput: function(){

			var selected = this.$el.prop('selectedIndex')
			
			if(this.$el.val()){
				
				text = this.$el.find('option').eq(selected).text()

				this.$input.val(text)

			}else{
				
				this.$input.val('')

			}

			return this._getAll()
				.removeClass(this.settings.selectedClass)
				.filter(function(){

					return $(this).data('index') == selected
				})
				.addClass(this.settings.selectedClass)
		
		},
		_blurSelect: function(){

			this.$container.removeClass('combo-focus');

		},
		_focus: function(event){
			
			/* Toggle focus class */

			this.$container.toggleClass('combo-focus', !this.opened);

			/* If mobile: stop */
			
			if(isMobile) return;

			/* Open combo */

			if(!this.opened) this.$container.trigger('comboselect:open');
			
			/* Select the input */
			
			this.settings.focusInput && event && event.currentTarget && event.currentTarget.nodeName == 'INPUT' && event.currentTarget.select()
		},

		_blur: function(){

			/**
			 * 1. Get hovered item
			 * 2. If not check if input value == select option
			 * 3. If none
			 */
			
			var val = $.trim(this.$input.val().toLowerCase()),
				isNumber = !isNaN(val);
			
			var index = this.$options.filter(function(){
				
				if(isNumber){
					return parseInt($.trim(this.innerHTML).toLowerCase()) == val
				}

				return $.trim(this.innerHTML).toLowerCase() == val

			}).prop('index')
		
			/* Select by Index */
						
			this._selectByIndex(index)
			
		},

		_change: function(){


			this._updateInput();

		},

		_getAll: function(){

			return this.$items.filter('.option-item')

		},
		_getVisible: function(){

			return this.$items.filter('.option-item').filter(':visible')

		},

		_getHovered: function(){

			return this._getVisible().filter('.' + this.settings.hoverClass);

		},

		_open: function(){

			var self = this

			this.$container.addClass('combo-open')			

			this.opened = true
			
			/* Focus input field */			

			this.settings.focusInput && setTimeout(function(){ !self.$input.is(':focus') && self.$input.focus(); });

			/* Highligh the items */

			this._highlight()

			/* Fix scroll */

			this._fixScroll()

			/* Close all others */


			$.each($.fn[ pluginName ].instances, function(i, plugin){

				if(plugin != self && plugin.opened) plugin.$container.trigger('comboselect:close')
			})

		},

		_toggle: function(){

			this.opened? this._close.call(this) : this._open.call(this)
		},

		_close: function(){				

			this.$container.removeClass('combo-open combo-focus')

			this.$container.trigger('comboselect:closed')

			this.opened = false

			/* Show all items */

			this.$items.show();

		},
		_fixScroll: function(){
	
			/**
			 * If dropdown is hidden
			 */
			if(this.$dropdown.is(':hidden')) return;

			
			/**
			 * Else					 
			 */
			var item = this._getHovered();

			if(!item.length) return;					

			/**
			 * Scroll
			 */
			
			var offsetTop,
				upperBound,
				lowerBound,
				heightDelta = item.outerHeight()

			offsetTop = item[0].offsetTop;
			
			upperBound = this.$dropdown.scrollTop();

			lowerBound = upperBound + this.settings.maxHeight - heightDelta;
			
			if (offsetTop < upperBound) {
					
				this.$dropdown.scrollTop(offsetTop);

			} else if (offsetTop > lowerBound) {
					
				this.$dropdown.scrollTop(offsetTop - this.settings.maxHeight + heightDelta);
			}

		},
		/**
		 * Destroy API
		 */
		
		dispose: function(){

			/* Remove combo arrow, input, dropdown */

			this.$arrow.remove()

			this.$input.remove()

			this.$dropdown.remove()

			/* Remove tabindex property */
			this.$el
				.removeAttr("tabindex")

			/* Check if there is a tabindex set before */

			if(!!this.$el.data('plugin_'+ dataKey + '_tabindex')){
				this.$el.prop('tabindex', this.$el.data('plugin_'+ dataKey + '_tabindex'))
			}

			/* Unwrap */

			this.$el.unwrap()

			/* Remove data */

			this.$el.removeData('plugin_'+dataKey)

			/* Remove tabindex data */

			this.$el.removeData('plugin_'+dataKey + '_tabindex')

			/* Remove change event on select */

			this.$el.off('change.select focus.select blur.select');

		}	
	});



	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( options, args ) {

		this.each(function() {

			var $e = $(this),
				instance = $e.data('plugin_'+dataKey)

			if (typeof options === 'string') {
				
				if (instance && typeof instance[options] === 'function') {
						instance[options](args);
				}

			}else{

				if (instance && instance.dispose) {
						instance.dispose();
				}

				$.data( this, "plugin_" + dataKey, new Plugin( this, options ) );

			}

		});

		// chain jQuery functions
		return this;
	};

	$.fn[ pluginName ].instances = [];

}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL2NvbWJvU2VsZWN0L2pxdWVyeS5jb21iby5zZWxlY3QuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypqc2hpbnQgYXNpOnRydWUsIGV4cHI6dHJ1ZSAqL1xuLyoqXG4gKiBQbHVnaW4gTmFtZTogQ29tYm8gU2VsZWN0XG4gKiBBdXRob3IgOiBWaW5heUBQZWJibGVyb2FkXG4gKiBEYXRlOiAyMy8xMS8yMDE0XG4gKiBEZXNjcmlwdGlvbjogXG4gKiBDb252ZXJ0cyBhIHNlbGVjdCBib3ggaW50byBhIHNlYXJjaGFibGUgYW5kIGtleWJvYXJkIGZyaWVuZGx5IGludGVyZmFjZS4gRmFsbGJhY2tzIHRvIG5hdGl2ZSBzZWxlY3Qgb24gbW9iaWxlIGFuZCB0YWJsZXRzXG4gKi9cblxuLy8gRXhwb3NlIHBsdWdpbiBhcyBhbiBBTUQgbW9kdWxlIGlmIEFNRCBsb2FkZXIgaXMgcHJlc2VudDpcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuXHQndXNlIHN0cmljdCc7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdC8vIEJyb3dzZXJpZnlcblx0XHRmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpKTtcblx0fSBlbHNlIHtcblx0XHQvLyBCcm93c2VyIGdsb2JhbHNcblx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdH1cbn0oZnVuY3Rpb24gKCAkLCB1bmRlZmluZWQgKSB7XG5cblx0dmFyIHBsdWdpbk5hbWUgPSBcImNvbWJvU2VsZWN0XCIsXG5cdFx0ZGF0YUtleSA9ICdjb21ib3NlbGVjdCc7XG5cdHZhciBkZWZhdWx0cyA9IHtcdFx0XHRcblx0XHRjb21ib0NsYXNzICAgICAgICAgOiAnY29tYm8tc2VsZWN0Jyxcblx0XHRjb21ib0Fycm93Q2xhc3MgICAgOiAnY29tYm8tYXJyb3cnLFxuXHRcdGNvbWJvRHJvcERvd25DbGFzcyA6ICdjb21iby1kcm9wZG93bicsXG5cdFx0aW5wdXRDbGFzcyAgICAgICAgIDogJ2NvbWJvLWlucHV0IHRleHQtaW5wdXQnLFxuXHRcdGRpc2FibGVkQ2xhc3MgICAgICA6ICdvcHRpb24tZGlzYWJsZWQnLFxuXHRcdGhvdmVyQ2xhc3MgICAgICAgICA6ICdvcHRpb24taG92ZXInLFxuXHRcdHNlbGVjdGVkQ2xhc3MgICAgICA6ICdvcHRpb24tc2VsZWN0ZWQnLFxuXHRcdG1hcmtlckNsYXNzICAgICAgICA6ICdjb21iby1tYXJrZXInLFxuXHRcdHRoZW1lQ2xhc3MgICAgICAgICA6ICcnLFxuXHRcdG1heEhlaWdodCAgICAgICAgICA6IDIwMCxcblx0XHRleHRlbmRTdHlsZSAgICAgICAgOiB0cnVlLFxuXHRcdGZvY3VzSW5wdXQgICAgICAgICA6IHRydWVcblx0fTtcblxuXHQvKipcblx0ICogVXRpbGl0eSBmdW5jdGlvbnNcblx0ICovXG5cblx0dmFyIGtleXMgPSB7XG5cdFx0RVNDOiAyNyxcblx0XHRUQUI6IDksXG5cdFx0UkVUVVJOOiAxMyxcblx0XHRMRUZUOiAzNyxcblx0XHRVUDogMzgsXG5cdFx0UklHSFQ6IDM5LFxuXHRcdERPV046IDQwLFxuXHRcdEVOVEVSOiAxMyxcblx0XHRTSElGVDogMTZcblx0fSxcdFxuXHRpc01vYmlsZSA9ICgvYW5kcm9pZHx3ZWJvc3xpcGhvbmV8aXBhZHxpcG9kfGJsYWNrYmVycnl8aWVtb2JpbGV8b3BlcmEgbWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpKSk7XG5cblx0LyoqXG5cdCAqIENvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7W05vZGVdfSBlbGVtZW50IFtTZWxlY3QgZWxlbWVudF1cblx0ICogQHBhcmFtIHtbT2JqZWN0XX0gb3B0aW9ucyBbT3B0aW9uIG9iamVjdF1cblx0ICovXG5cdGZ1bmN0aW9uIFBsdWdpbiAoIGVsZW1lbnQsIG9wdGlvbnMgKSB7XG5cdFx0XHRcblx0XHQvKiBOYW1lIG9mIHRoZSBwbHVnaW4gKi9cblxuXHRcdHRoaXMuX25hbWUgPSBwbHVnaW5OYW1lO1xuXG5cdFx0LyogUmV2ZXJzZSBsb29rdXAgKi9cblxuXHRcdHRoaXMuZWwgPSBlbGVtZW50XG5cblx0XHQvKiBFbGVtZW50ICovXG5cblx0XHR0aGlzLiRlbCA9ICQoZWxlbWVudClcblxuXHRcdC8qIElmIG11bHRpcGxlIHNlbGVjdDogc3RvcCAqL1xuXHRcdFxuXHRcdGlmKHRoaXMuJGVsLnByb3AoJ211bHRpcGxlJykpIHJldHVybjtcblxuXHRcdC8qIFNldHRpbmdzICovXG5cblx0XHR0aGlzLnNldHRpbmdzID0gJC5leHRlbmQoIHt9LCBkZWZhdWx0cywgb3B0aW9ucywgdGhpcy4kZWwuZGF0YSgpICk7XG5cblx0XHQvKiBEZWZhdWx0cyAqL1xuXG5cdFx0dGhpcy5fZGVmYXVsdHMgPSBkZWZhdWx0cztcblxuXHRcdC8qIE9wdGlvbnMgKi9cblxuXHRcdHRoaXMuJG9wdGlvbnMgPSB0aGlzLiRlbC5maW5kKCdvcHRpb24sIG9wdGdyb3VwJylcblxuXHRcdC8qIEluaXRpYWxpemUgKi9cblxuXHRcdHRoaXMuaW5pdCgpO1xuXG5cdFx0LyogSW5zdGFuY2VzICovXG5cblx0XHQkLmZuWyBwbHVnaW5OYW1lIF0uaW5zdGFuY2VzLnB1c2godGhpcyk7XG5cblx0fVxuXG5cdCQuZXh0ZW5kKFBsdWdpbi5wcm90b3R5cGUsIHtcblx0XHRpbml0OiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdC8qIENvbnN0cnVjdCB0aGUgY29tYm9zZWxlY3QgKi9cblxuXHRcdFx0dGhpcy5fY29uc3RydWN0KCk7XG5cblxuXHRcdFx0LyogQWRkIGV2ZW50IGJpbmRpbmdzICovICAgICAgICAgIFxuXG5cdFx0XHR0aGlzLl9ldmVudHMoKTtcblxuXG5cdFx0fSxcblx0XHRfY29uc3RydWN0OiBmdW5jdGlvbigpe1xuXG5cdFx0XHR2YXIgc2VsZiA9IHRoaXNcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBBZGQgbmVnYXRpdmUgVGFiSW5kZXggdG8gYHNlbGVjdGBcblx0XHRcdCAqIFByZXNlcnZlcyBwcmV2aW91cyB0YWJpbmRleFxuXHRcdFx0ICovXG5cdFx0XHRcblx0XHRcdHRoaXMuJGVsLmRhdGEoJ3BsdWdpbl8nKyBkYXRhS2V5ICsgJ190YWJpbmRleCcsIHRoaXMuJGVsLnByb3AoJ3RhYmluZGV4JykpXG5cblx0XHRcdC8qIEFkZCBhIHRhYiBpbmRleCBmb3IgZGVza3RvcCBicm93c2VycyAqL1xuXG5cdFx0XHQhaXNNb2JpbGUgJiYgdGhpcy4kZWwucHJvcChcInRhYkluZGV4XCIsIC0xKVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIFdyYXAgdGhlIFNlbGVjdFxuXHRcdFx0ICovXG5cblx0XHRcdHRoaXMuJGNvbnRhaW5lciA9IHRoaXMuJGVsLndyYXBBbGwoJzxkaXYgY2xhc3M9XCInICsgdGhpcy5zZXR0aW5ncy5jb21ib0NsYXNzICsgJyAnKyB0aGlzLnNldHRpbmdzLnRoZW1lQ2xhc3MgKyAnXCIgLz4nKS5wYXJlbnQoKTtcblx0XHRcdFxuXHRcdFx0LyoqXG5cdFx0XHQgKiBDaGVjayBpZiBzZWxlY3QgaGFzIGEgd2lkdGggYXR0cmlidXRlXG5cdFx0XHQgKi9cblx0XHRcdGlmKHRoaXMuc2V0dGluZ3MuZXh0ZW5kU3R5bGUgJiYgdGhpcy4kZWwuYXR0cignc3R5bGUnKSl7XG5cblx0XHRcdFx0dGhpcy4kY29udGFpbmVyLmF0dHIoJ3N0eWxlJywgdGhpcy4kZWwuYXR0cihcInN0eWxlXCIpKVxuXHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdFxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEFwcGVuZCBkcm9wZG93biBhcnJvd1xuXHRcdFx0ICovXG5cblx0XHRcdHRoaXMuJGFycm93ID0gJCgnPGRpdiBjbGFzcz1cIicrIHRoaXMuc2V0dGluZ3MuY29tYm9BcnJvd0NsYXNzKyAnXCIgLz4nKS5hcHBlbmRUbyh0aGlzLiRjb250YWluZXIpXG5cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBBcHBlbmQgZHJvcGRvd25cblx0XHRcdCAqL1xuXG5cdFx0XHR0aGlzLiRkcm9wZG93biA9ICQoJzx1bCBjbGFzcz1cIicrdGhpcy5zZXR0aW5ncy5jb21ib0Ryb3BEb3duQ2xhc3MrJ1wiIC8+JykuYXBwZW5kVG8odGhpcy4kY29udGFpbmVyKVxuXG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQ3JlYXRlIGRyb3Bkb3duIG9wdGlvbnNcblx0XHRcdCAqL1xuXG5cdFx0XHR2YXIgbyA9ICcnLCBrID0gMCwgcCA9ICcnO1xuXG5cdFx0XHR0aGlzLnNlbGVjdGVkSW5kZXggPSB0aGlzLiRlbC5wcm9wKCdzZWxlY3RlZEluZGV4JylcblxuXHRcdFx0dGhpcy4kb3B0aW9ucy5lYWNoKGZ1bmN0aW9uKGksIGUpe1xuXG5cdFx0XHRcdGlmKGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnb3B0Z3JvdXAnKXtcblxuXHRcdFx0XHRcdHJldHVybiBvKz0nPGxpIGNsYXNzPVwib3B0aW9uLWdyb3VwXCI+Jyt0aGlzLmxhYmVsKyc8L2xpPidcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCFlLnZhbHVlKSBwID0gZS5pbm5lckhUTUxcblxuXHRcdFx0XHRvKz0nPGxpIGNsYXNzPVwiJysodGhpcy5kaXNhYmxlZD8gc2VsZi5zZXR0aW5ncy5kaXNhYmxlZENsYXNzIDogXCJvcHRpb24taXRlbVwiKSArICcgJyArKGsgPT0gc2VsZi5zZWxlY3RlZEluZGV4PyBzZWxmLnNldHRpbmdzLnNlbGVjdGVkQ2xhc3MgOiAnJykrICdcIiBkYXRhLWluZGV4PVwiJysoaykrJ1wiIGRhdGEtdmFsdWU9XCInK3RoaXMudmFsdWUrJ1wiPicrICh0aGlzLmlubmVySFRNTCkgKyAnPC9saT4nXG5cblx0XHRcdFx0aysrO1xuXHRcdFx0fSlcblxuXHRcdFx0dGhpcy4kZHJvcGRvd24uaHRtbChvKVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEl0ZW1zXG5cdFx0XHQgKi9cblxuXHRcdFx0dGhpcy4kaXRlbXMgPSB0aGlzLiRkcm9wZG93bi5jaGlsZHJlbigpO1xuXG5cblx0XHRcdC8qKlxuXHRcdFx0ICogQXBwZW5kIElucHV0XG5cdFx0XHQgKi9cblxuXHRcdFx0dGhpcy4kaW5wdXQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIicgKyAoaXNNb2JpbGU/ICd0YWJpbmRleD1cIi0xXCInOiAnJykgKyAnIHBsYWNlaG9sZGVyPVwiJytwKydcIiBjbGFzcz1cIicrIHRoaXMuc2V0dGluZ3MuaW5wdXRDbGFzcyArICdcIj4nKS5hcHBlbmRUbyh0aGlzLiRjb250YWluZXIpXG5cblx0XHRcdC8qIFVwZGF0ZSBpbnB1dCB0ZXh0ICovXG5cblx0XHRcdHRoaXMuX3VwZGF0ZUlucHV0KClcblxuXHRcdH0sXG5cblx0XHRfZXZlbnRzOiBmdW5jdGlvbigpe1xuXG5cdFx0XHQvKiBJbnB1dDogZm9jdXMgKi9cblxuXHRcdFx0dGhpcy4kY29udGFpbmVyLm9uKCdmb2N1cy5pbnB1dCcsICdpbnB1dCcsICQucHJveHkodGhpcy5fZm9jdXMsIHRoaXMpKVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIElucHV0OiBtb3VzZXVwXG5cdFx0XHQgKiBGb3IgaW5wdXQgc2VsZWN0KCkgZXZlbnQgdG8gZnVuY3Rpb24gY29ycmVjdGx5XG5cdFx0XHQgKi9cblx0XHRcdHRoaXMuJGNvbnRhaW5lci5vbignbW91c2V1cC5pbnB1dCcsICdpbnB1dCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdH0pXG5cblx0XHRcdC8qIElucHV0OiBibHVyICovXG5cblx0XHRcdHRoaXMuJGNvbnRhaW5lci5vbignYmx1ci5pbnB1dCcsICdpbnB1dCcsICQucHJveHkodGhpcy5fYmx1ciwgdGhpcykpXG5cblx0XHRcdC8qIFNlbGVjdDogY2hhbmdlICovXG5cblx0XHRcdHRoaXMuJGVsLm9uKCdjaGFuZ2Uuc2VsZWN0JywgJC5wcm94eSh0aGlzLl9jaGFuZ2UsIHRoaXMpKVxuXG5cdFx0XHQvKiBTZWxlY3Q6IGZvY3VzICovXG5cblx0XHRcdHRoaXMuJGVsLm9uKCdmb2N1cy5zZWxlY3QnLCAkLnByb3h5KHRoaXMuX2ZvY3VzLCB0aGlzKSlcblxuXHRcdFx0LyogU2VsZWN0OiBibHVyICovXG5cblx0XHRcdHRoaXMuJGVsLm9uKCdibHVyLnNlbGVjdCcsICQucHJveHkodGhpcy5fYmx1clNlbGVjdCwgdGhpcykpXG5cblx0XHRcdC8qIERyb3Bkb3duIEFycm93OiBjbGljayAqL1xuXG5cdFx0XHR0aGlzLiRjb250YWluZXIub24oJ2NsaWNrLmFycm93JywgJy4nK3RoaXMuc2V0dGluZ3MuY29tYm9BcnJvd0NsYXNzICwgJC5wcm94eSh0aGlzLl90b2dnbGUsIHRoaXMpKVxuXG5cdFx0XHQvKiBEcm9wZG93bjogY2xvc2UgKi9cblxuXHRcdFx0dGhpcy4kY29udGFpbmVyLm9uKCdjb21ib3NlbGVjdDpjbG9zZScsICQucHJveHkodGhpcy5fY2xvc2UsIHRoaXMpKVxuXG5cdFx0XHQvKiBEcm9wZG93bjogb3BlbiAqL1xuXG5cdFx0XHR0aGlzLiRjb250YWluZXIub24oJ2NvbWJvc2VsZWN0Om9wZW4nLCAkLnByb3h5KHRoaXMuX29wZW4sIHRoaXMpKVxuXG5cblx0XHRcdC8qIEhUTUwgQ2xpY2sgKi9cblxuXHRcdFx0JCgnaHRtbCcpLm9mZignY2xpY2suY29tYm9zZWxlY3QnKS5vbignY2xpY2suY29tYm9zZWxlY3QnLCBmdW5jdGlvbigpe1xuXHRcdFx0XHRcblx0XHRcdFx0JC5lYWNoKCQuZm5bIHBsdWdpbk5hbWUgXS5pbnN0YW5jZXMsIGZ1bmN0aW9uKGksIHBsdWdpbil7XG5cblx0XHRcdFx0XHRwbHVnaW4uJGNvbnRhaW5lci50cmlnZ2VyKCdjb21ib3NlbGVjdDpjbG9zZScpXG5cblx0XHRcdFx0fSlcblx0XHRcdH0pO1xuXG5cdFx0XHQvKiBTdG9wIGBldmVudDpjbGlja2AgYnViYmxpbmcgKi9cblxuXHRcdFx0dGhpcy4kY29udGFpbmVyLm9uKCdjbGljay5jb21ib3NlbGVjdCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSlcblxuXG5cdFx0XHQvKiBJbnB1dDoga2V5ZG93biAqL1xuXG5cdFx0XHR0aGlzLiRjb250YWluZXIub24oJ2tleWRvd24nLCAnaW5wdXQnLCAkLnByb3h5KHRoaXMuX2tleWRvd24sIHRoaXMpKVxuXG5cdFx0XHQvKiBJbnB1dDoga2V5dXAgKi9cblx0XHRcdFxuXHRcdFx0dGhpcy4kY29udGFpbmVyLm9uKCdrZXl1cCcsICdpbnB1dCcsICQucHJveHkodGhpcy5fa2V5dXAsIHRoaXMpKVxuXG5cdFx0XHQvKiBEcm9wZG93biBpdGVtOiBjbGljayAqL1xuXG5cdFx0XHR0aGlzLiRjb250YWluZXIub24oJ2NsaWNrLml0ZW0nLCAnLm9wdGlvbi1pdGVtJywgJC5wcm94eSh0aGlzLl9zZWxlY3QsIHRoaXMpKVxuXG5cdFx0fSxcblxuXHRcdF9rZXlkb3duOiBmdW5jdGlvbihldmVudCl7XG5cblx0XHRcdFxuXG5cdFx0XHRzd2l0Y2goZXZlbnQud2hpY2gpe1xuXG5cdFx0XHRcdGNhc2Uga2V5cy5VUDpcblx0XHRcdFx0XHR0aGlzLl9tb3ZlKCd1cCcsIGV2ZW50KVxuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2Uga2V5cy5ET1dOOlxuXHRcdFx0XHRcdHRoaXMuX21vdmUoJ2Rvd24nLCBldmVudClcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XG5cdFx0XHRcdGNhc2Uga2V5cy5UQUI6XG5cdFx0XHRcdFx0dGhpcy5fZW50ZXIoZXZlbnQpXG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSBrZXlzLlJJR0hUOlxuXHRcdFx0XHRcdHRoaXMuX2F1dG9maWxsKGV2ZW50KTtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlIGtleXMuRU5URVI6XG5cdFx0XHRcdFx0dGhpcy5fZW50ZXIoZXZlbnQpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGRlZmF1bHQ6XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRicmVhaztcblxuXG5cdFx0XHR9XG5cblx0XHR9LFxuXHRcdFxuXG5cdFx0X2tleXVwOiBmdW5jdGlvbihldmVudCl7XG5cdFx0XHRcblx0XHRcdHN3aXRjaChldmVudC53aGljaCl7XG5cdFx0XHRcdGNhc2Uga2V5cy5FU0M6XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR0aGlzLiRjb250YWluZXIudHJpZ2dlcignY29tYm9zZWxlY3Q6Y2xvc2UnKVxuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2Uga2V5cy5FTlRFUjpcblx0XHRcdFx0Y2FzZSBrZXlzLlVQOlxuXHRcdFx0XHRjYXNlIGtleXMuRE9XTjpcblx0XHRcdFx0Y2FzZSBrZXlzLkxFRlQ6XG5cdFx0XHRcdGNhc2Uga2V5cy5SSUdIVDpcblx0XHRcdFx0Y2FzZSBrZXlzLlRBQjpcblx0XHRcdFx0Y2FzZSBrZXlzLlNISUZUOlx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFxuXHRcdFx0XHRkZWZhdWx0Olx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0dGhpcy5fZmlsdGVyKGV2ZW50LnRhcmdldC52YWx1ZSlcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9LFxuXHRcdFxuXHRcdF9lbnRlcjogZnVuY3Rpb24oZXZlbnQpe1xuXG5cdFx0XHR2YXIgaXRlbSA9IHRoaXMuX2dldEhvdmVyZWQoKVxuXG5cdFx0XHRpdGVtLmxlbmd0aCAmJiB0aGlzLl9zZWxlY3QoaXRlbSk7XG5cblx0XHRcdC8qIENoZWNrIGlmIGl0IGVudGVyIGtleSAqL1xuXHRcdFx0aWYoZXZlbnQgJiYgZXZlbnQud2hpY2ggPT0ga2V5cy5FTlRFUil7XG5cblx0XHRcdFx0aWYoIWl0ZW0ubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0LyogQ2hlY2sgaWYgaXRzIGlsbGVnYWwgdmFsdWUgKi9cblxuXHRcdFx0XHRcdHRoaXMuX2JsdXIoKTtcblxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblx0XHRcdFxuXG5cdFx0fSxcblx0XHRfbW92ZTogZnVuY3Rpb24oZGlyKXtcblxuXHRcdFx0dmFyIGl0ZW1zID0gdGhpcy5fZ2V0VmlzaWJsZSgpLFxuXHRcdFx0XHRjdXJyZW50ID0gdGhpcy5fZ2V0SG92ZXJlZCgpLFxuXHRcdFx0XHRpbmRleCA9IGN1cnJlbnQucHJldkFsbCgnLm9wdGlvbi1pdGVtJykuZmlsdGVyKCc6dmlzaWJsZScpLmxlbmd0aCxcblx0XHRcdFx0dG90YWwgPSBpdGVtcy5sZW5ndGhcblxuXHRcdFx0XG5cdFx0XHRzd2l0Y2goZGlyKXtcblx0XHRcdFx0Y2FzZSAndXAnOlxuXHRcdFx0XHRcdGluZGV4LS07XG5cdFx0XHRcdFx0KGluZGV4IDwgMCkgJiYgKGluZGV4ID0gKHRvdGFsIC0gMSkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgJ2Rvd24nOlx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0aW5kZXgrKztcblx0XHRcdFx0XHQoaW5kZXggPj0gdG90YWwpICYmIChpbmRleCA9IDApO1x0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdFxuXHRcdFx0aXRlbXNcblx0XHRcdFx0LnJlbW92ZUNsYXNzKHRoaXMuc2V0dGluZ3MuaG92ZXJDbGFzcylcblx0XHRcdFx0LmVxKGluZGV4KVxuXHRcdFx0XHQuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5ob3ZlckNsYXNzKVxuXG5cblx0XHRcdGlmKCF0aGlzLm9wZW5lZCkgdGhpcy4kY29udGFpbmVyLnRyaWdnZXIoJ2NvbWJvc2VsZWN0Om9wZW4nKTtcblxuXHRcdFx0dGhpcy5fZml4U2Nyb2xsKClcblx0XHR9LFxuXG5cdFx0X3NlbGVjdDogZnVuY3Rpb24oZXZlbnQpe1xuXG5cdFx0XHR2YXIgaXRlbSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ/ICQoZXZlbnQuY3VycmVudFRhcmdldCkgOiAkKGV2ZW50KTtcblxuXHRcdFx0aWYoIWl0ZW0ubGVuZ3RoKSByZXR1cm47XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogMS4gZ2V0IEluZGV4XG5cdFx0XHQgKi9cblx0XHRcdFxuXHRcdFx0dmFyIGluZGV4ID0gaXRlbS5kYXRhKCdpbmRleCcpO1xuXG5cdFx0XHR0aGlzLl9zZWxlY3RCeUluZGV4KGluZGV4KTtcblxuXHRcdFx0dGhpcy4kY29udGFpbmVyLnRyaWdnZXIoJ2NvbWJvc2VsZWN0OmNsb3NlJylcdFx0XHRcdFx0XG5cblx0XHR9LFxuXG5cdFx0X3NlbGVjdEJ5SW5kZXg6IGZ1bmN0aW9uKGluZGV4KXtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBTZXQgc2VsZWN0ZWQgaW5kZXggYW5kIHRyaWdnZXIgY2hhbmdlXG5cdFx0XHQgKiBAdHlwZSB7W3R5cGVdfVxuXHRcdFx0ICovXG5cdFx0XHRpZih0eXBlb2YgaW5kZXggPT0gJ3VuZGVmaW5lZCcpe1xuXHRcdFx0XHRcblx0XHRcdFx0aW5kZXggPSAwXG5cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYodGhpcy4kZWwucHJvcCgnc2VsZWN0ZWRJbmRleCcpICE9IGluZGV4KXtcblxuXHRcdFx0XHR0aGlzLiRlbC5wcm9wKCdzZWxlY3RlZEluZGV4JywgaW5kZXgpLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0fVxuXG5cdFx0fSxcblxuXHRcdF9hdXRvZmlsbDogZnVuY3Rpb24oKXtcblxuXHRcdFx0dmFyIGl0ZW0gPSB0aGlzLl9nZXRIb3ZlcmVkKCk7XG5cblx0XHRcdGlmKGl0ZW0ubGVuZ3RoKXtcblxuXHRcdFx0XHR2YXIgaW5kZXggPSBpdGVtLmRhdGEoJ2luZGV4JylcblxuXHRcdFx0XHR0aGlzLl9zZWxlY3RCeUluZGV4KGluZGV4KVxuXG5cdFx0XHR9XG5cblx0XHR9LFxuXHRcdFxuXG5cdFx0X2ZpbHRlcjogZnVuY3Rpb24oc2VhcmNoKXtcblxuXHRcdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0XHRpdGVtcyA9IHRoaXMuX2dldEFsbCgpO1xuXHRcdFx0XHRuZWVkbGUgPSAkLnRyaW0oc2VhcmNoKS50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0XHRyZUVzY2FwZSA9IG5ldyBSZWdFeHAoJyhcXFxcJyArIFsnLycsICcuJywgJyonLCAnKycsICc/JywgJ3wnLCAnKCcsICcpJywgJ1snLCAnXScsICd7JywgJ30nLCAnXFxcXCddLmpvaW4oJ3xcXFxcJykgKyAnKScsICdnJyksXG5cdFx0XHRcdHBhdHRlcm4gPSAnKCcgKyBzZWFyY2gucmVwbGFjZShyZUVzY2FwZSwgJ1xcXFwkMScpICsgJyknO1xuXG5cblx0XHRcdC8qKlxuXHRcdFx0ICogVW53cmFwIGFsbCBtYXJrZXJzXG5cdFx0XHQgKi9cblx0XHRcdFxuXHRcdFx0JCgnLicrc2VsZi5zZXR0aW5ncy5tYXJrZXJDbGFzcywgaXRlbXMpLmNvbnRlbnRzKCkudW53cmFwKCk7XG5cblx0XHRcdC8qIFNlYXJjaCAqL1xuXHRcdFx0XG5cdFx0XHRpZihuZWVkbGUpe1xuXG5cdFx0XHRcdC8qIEhpZGUgRGlzYWJsZWQgYW5kIG9wdGdyb3VwcyAqL1xuXG5cdFx0XHRcdHRoaXMuJGl0ZW1zLmZpbHRlcignLm9wdGlvbi1ncm91cCwgLm9wdGlvbi1kaXNhYmxlZCcpLmhpZGUoKTtcblx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdFx0aXRlbXNcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdC5oaWRlKClcblx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKCl7XG5cblx0XHRcdFx0XHRcdHZhciAkdGhpcyA9ICQodGhpcyksXG5cdFx0XHRcdFx0XHRcdHRleHQgPSAkLnRyaW0oJHRoaXMudGV4dCgpKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvKiBGb3VuZCAqL1xuXHRcdFx0XHRcdFx0aWYodGV4dC50b1N0cmluZygpLmluZGV4T2YobmVlZGxlKSAhPSAtMSl7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICogV3JhcCB0aGUgc2VsZWN0aW9uXG5cdFx0XHRcdFx0XHRcdCAqL1x0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0JHRoaXNcblx0XHRcdFx0XHRcdFx0XHQuaHRtbChmdW5jdGlvbihpbmRleCwgb2xkaHRtbCl7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG9sZGh0bWwucmVwbGFjZShuZXcgUmVnRXhwKHBhdHRlcm4sICdnaScpLCAnPHNwYW4gY2xhc3M9XCInK3NlbGYuc2V0dGluZ3MubWFya2VyQ2xhc3MrJ1wiPiQxPC9zcGFuPicpXG5cdFx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFx0XHRcdFx0XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LnNob3coKVxuXHRcdFx0fWVsc2V7XG5cblx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0dGhpcy4kaXRlbXMuc2hvdygpO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBPcGVuIHRoZSBjb21ib3NlbGVjdCAqL1xuXG5cdFx0XHR0aGlzLiRjb250YWluZXIudHJpZ2dlcignY29tYm9zZWxlY3Q6b3BlbicpXG5cdFx0XHRcblxuXHRcdH0sXG5cblx0XHRfaGlnaGxpZ2h0OiBmdW5jdGlvbigpe1xuXG5cdFx0XHQvKiBcblx0XHRcdDEuIENoZWNrIGlmIHRoZXJlIGlzIGEgc2VsZWN0ZWQgaXRlbSBcblx0XHRcdDIuIEFkZCBob3ZlciBjbGFzcyB0byBpdFxuXHRcdFx0My4gSWYgbm90IGFkZCBob3ZlciBjbGFzcyB0byBmaXJzdCBpdGVtXG5cdFx0XHQqL1xuXHRcdFxuXHRcdFx0dmFyIHZpc2libGUgPSB0aGlzLl9nZXRWaXNpYmxlKCkucmVtb3ZlQ2xhc3ModGhpcy5zZXR0aW5ncy5ob3ZlckNsYXNzKSxcblx0XHRcdFx0JHNlbGVjdGVkID0gdmlzaWJsZS5maWx0ZXIoJy4nK3RoaXMuc2V0dGluZ3Muc2VsZWN0ZWRDbGFzcylcblxuXHRcdFx0aWYoJHNlbGVjdGVkLmxlbmd0aCl7XG5cdFx0XHRcdFxuXHRcdFx0XHQkc2VsZWN0ZWQuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5ob3ZlckNsYXNzKTtcblxuXHRcdFx0fWVsc2V7XG5cblx0XHRcdFx0dmlzaWJsZVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyh0aGlzLnNldHRpbmdzLmhvdmVyQ2xhc3MpXG5cdFx0XHRcdFx0LmZpcnN0KClcblx0XHRcdFx0XHQuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5ob3ZlckNsYXNzKVxuXHRcdFx0fVxuXG5cdFx0fSxcblxuXHRcdF91cGRhdGVJbnB1dDogZnVuY3Rpb24oKXtcblxuXHRcdFx0dmFyIHNlbGVjdGVkID0gdGhpcy4kZWwucHJvcCgnc2VsZWN0ZWRJbmRleCcpXG5cdFx0XHRcblx0XHRcdGlmKHRoaXMuJGVsLnZhbCgpKXtcblx0XHRcdFx0XG5cdFx0XHRcdHRleHQgPSB0aGlzLiRlbC5maW5kKCdvcHRpb24nKS5lcShzZWxlY3RlZCkudGV4dCgpXG5cblx0XHRcdFx0dGhpcy4kaW5wdXQudmFsKHRleHQpXG5cblx0XHRcdH1lbHNle1xuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy4kaW5wdXQudmFsKCcnKVxuXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzLl9nZXRBbGwoKVxuXHRcdFx0XHQucmVtb3ZlQ2xhc3ModGhpcy5zZXR0aW5ncy5zZWxlY3RlZENsYXNzKVxuXHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKCl7XG5cblx0XHRcdFx0XHRyZXR1cm4gJCh0aGlzKS5kYXRhKCdpbmRleCcpID09IHNlbGVjdGVkXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLnNlbGVjdGVkQ2xhc3MpXG5cdFx0XG5cdFx0fSxcblx0XHRfYmx1clNlbGVjdDogZnVuY3Rpb24oKXtcblxuXHRcdFx0dGhpcy4kY29udGFpbmVyLnJlbW92ZUNsYXNzKCdjb21iby1mb2N1cycpO1xuXG5cdFx0fSxcblx0XHRfZm9jdXM6IGZ1bmN0aW9uKGV2ZW50KXtcblx0XHRcdFxuXHRcdFx0LyogVG9nZ2xlIGZvY3VzIGNsYXNzICovXG5cblx0XHRcdHRoaXMuJGNvbnRhaW5lci50b2dnbGVDbGFzcygnY29tYm8tZm9jdXMnLCAhdGhpcy5vcGVuZWQpO1xuXG5cdFx0XHQvKiBJZiBtb2JpbGU6IHN0b3AgKi9cblx0XHRcdFxuXHRcdFx0aWYoaXNNb2JpbGUpIHJldHVybjtcblxuXHRcdFx0LyogT3BlbiBjb21ibyAqL1xuXG5cdFx0XHRpZighdGhpcy5vcGVuZWQpIHRoaXMuJGNvbnRhaW5lci50cmlnZ2VyKCdjb21ib3NlbGVjdDpvcGVuJyk7XG5cdFx0XHRcblx0XHRcdC8qIFNlbGVjdCB0aGUgaW5wdXQgKi9cblx0XHRcdFxuXHRcdFx0dGhpcy5zZXR0aW5ncy5mb2N1c0lucHV0ICYmIGV2ZW50ICYmIGV2ZW50LmN1cnJlbnRUYXJnZXQgJiYgZXZlbnQuY3VycmVudFRhcmdldC5ub2RlTmFtZSA9PSAnSU5QVVQnICYmIGV2ZW50LmN1cnJlbnRUYXJnZXQuc2VsZWN0KClcblx0XHR9LFxuXG5cdFx0X2JsdXI6IGZ1bmN0aW9uKCl7XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogMS4gR2V0IGhvdmVyZWQgaXRlbVxuXHRcdFx0ICogMi4gSWYgbm90IGNoZWNrIGlmIGlucHV0IHZhbHVlID09IHNlbGVjdCBvcHRpb25cblx0XHRcdCAqIDMuIElmIG5vbmVcblx0XHRcdCAqL1xuXHRcdFx0XG5cdFx0XHR2YXIgdmFsID0gJC50cmltKHRoaXMuJGlucHV0LnZhbCgpLnRvTG93ZXJDYXNlKCkpLFxuXHRcdFx0XHRpc051bWJlciA9ICFpc05hTih2YWwpO1xuXHRcdFx0XG5cdFx0XHR2YXIgaW5kZXggPSB0aGlzLiRvcHRpb25zLmZpbHRlcihmdW5jdGlvbigpe1xuXHRcdFx0XHRcblx0XHRcdFx0aWYoaXNOdW1iZXIpe1xuXHRcdFx0XHRcdHJldHVybiBwYXJzZUludCgkLnRyaW0odGhpcy5pbm5lckhUTUwpLnRvTG93ZXJDYXNlKCkpID09IHZhbFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuICQudHJpbSh0aGlzLmlubmVySFRNTCkudG9Mb3dlckNhc2UoKSA9PSB2YWxcblxuXHRcdFx0fSkucHJvcCgnaW5kZXgnKVxuXHRcdFxuXHRcdFx0LyogU2VsZWN0IGJ5IEluZGV4ICovXG5cdFx0XHRcdFx0XHRcblx0XHRcdHRoaXMuX3NlbGVjdEJ5SW5kZXgoaW5kZXgpXG5cdFx0XHRcblx0XHR9LFxuXG5cdFx0X2NoYW5nZTogZnVuY3Rpb24oKXtcblxuXG5cdFx0XHR0aGlzLl91cGRhdGVJbnB1dCgpO1xuXG5cdFx0fSxcblxuXHRcdF9nZXRBbGw6IGZ1bmN0aW9uKCl7XG5cblx0XHRcdHJldHVybiB0aGlzLiRpdGVtcy5maWx0ZXIoJy5vcHRpb24taXRlbScpXG5cblx0XHR9LFxuXHRcdF9nZXRWaXNpYmxlOiBmdW5jdGlvbigpe1xuXG5cdFx0XHRyZXR1cm4gdGhpcy4kaXRlbXMuZmlsdGVyKCcub3B0aW9uLWl0ZW0nKS5maWx0ZXIoJzp2aXNpYmxlJylcblxuXHRcdH0sXG5cblx0XHRfZ2V0SG92ZXJlZDogZnVuY3Rpb24oKXtcblxuXHRcdFx0cmV0dXJuIHRoaXMuX2dldFZpc2libGUoKS5maWx0ZXIoJy4nICsgdGhpcy5zZXR0aW5ncy5ob3ZlckNsYXNzKTtcblxuXHRcdH0sXG5cblx0XHRfb3BlbjogZnVuY3Rpb24oKXtcblxuXHRcdFx0dmFyIHNlbGYgPSB0aGlzXG5cblx0XHRcdHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcygnY29tYm8tb3BlbicpXHRcdFx0XG5cblx0XHRcdHRoaXMub3BlbmVkID0gdHJ1ZVxuXHRcdFx0XG5cdFx0XHQvKiBGb2N1cyBpbnB1dCBmaWVsZCAqL1x0XHRcdFxuXG5cdFx0XHR0aGlzLnNldHRpbmdzLmZvY3VzSW5wdXQgJiYgc2V0VGltZW91dChmdW5jdGlvbigpeyAhc2VsZi4kaW5wdXQuaXMoJzpmb2N1cycpICYmIHNlbGYuJGlucHV0LmZvY3VzKCk7IH0pO1xuXG5cdFx0XHQvKiBIaWdobGlnaCB0aGUgaXRlbXMgKi9cblxuXHRcdFx0dGhpcy5faGlnaGxpZ2h0KClcblxuXHRcdFx0LyogRml4IHNjcm9sbCAqL1xuXG5cdFx0XHR0aGlzLl9maXhTY3JvbGwoKVxuXG5cdFx0XHQvKiBDbG9zZSBhbGwgb3RoZXJzICovXG5cblxuXHRcdFx0JC5lYWNoKCQuZm5bIHBsdWdpbk5hbWUgXS5pbnN0YW5jZXMsIGZ1bmN0aW9uKGksIHBsdWdpbil7XG5cblx0XHRcdFx0aWYocGx1Z2luICE9IHNlbGYgJiYgcGx1Z2luLm9wZW5lZCkgcGx1Z2luLiRjb250YWluZXIudHJpZ2dlcignY29tYm9zZWxlY3Q6Y2xvc2UnKVxuXHRcdFx0fSlcblxuXHRcdH0sXG5cblx0XHRfdG9nZ2xlOiBmdW5jdGlvbigpe1xuXG5cdFx0XHR0aGlzLm9wZW5lZD8gdGhpcy5fY2xvc2UuY2FsbCh0aGlzKSA6IHRoaXMuX29wZW4uY2FsbCh0aGlzKVxuXHRcdH0sXG5cblx0XHRfY2xvc2U6IGZ1bmN0aW9uKCl7XHRcdFx0XHRcblxuXHRcdFx0dGhpcy4kY29udGFpbmVyLnJlbW92ZUNsYXNzKCdjb21iby1vcGVuIGNvbWJvLWZvY3VzJylcblxuXHRcdFx0dGhpcy4kY29udGFpbmVyLnRyaWdnZXIoJ2NvbWJvc2VsZWN0OmNsb3NlZCcpXG5cblx0XHRcdHRoaXMub3BlbmVkID0gZmFsc2VcblxuXHRcdFx0LyogU2hvdyBhbGwgaXRlbXMgKi9cblxuXHRcdFx0dGhpcy4kaXRlbXMuc2hvdygpO1xuXG5cdFx0fSxcblx0XHRfZml4U2Nyb2xsOiBmdW5jdGlvbigpe1xuXHRcblx0XHRcdC8qKlxuXHRcdFx0ICogSWYgZHJvcGRvd24gaXMgaGlkZGVuXG5cdFx0XHQgKi9cblx0XHRcdGlmKHRoaXMuJGRyb3Bkb3duLmlzKCc6aGlkZGVuJykpIHJldHVybjtcblxuXHRcdFx0XG5cdFx0XHQvKipcblx0XHRcdCAqIEVsc2VcdFx0XHRcdFx0IFxuXHRcdFx0ICovXG5cdFx0XHR2YXIgaXRlbSA9IHRoaXMuX2dldEhvdmVyZWQoKTtcblxuXHRcdFx0aWYoIWl0ZW0ubGVuZ3RoKSByZXR1cm47XHRcdFx0XHRcdFxuXG5cdFx0XHQvKipcblx0XHRcdCAqIFNjcm9sbFxuXHRcdFx0ICovXG5cdFx0XHRcblx0XHRcdHZhciBvZmZzZXRUb3AsXG5cdFx0XHRcdHVwcGVyQm91bmQsXG5cdFx0XHRcdGxvd2VyQm91bmQsXG5cdFx0XHRcdGhlaWdodERlbHRhID0gaXRlbS5vdXRlckhlaWdodCgpXG5cblx0XHRcdG9mZnNldFRvcCA9IGl0ZW1bMF0ub2Zmc2V0VG9wO1xuXHRcdFx0XG5cdFx0XHR1cHBlckJvdW5kID0gdGhpcy4kZHJvcGRvd24uc2Nyb2xsVG9wKCk7XG5cblx0XHRcdGxvd2VyQm91bmQgPSB1cHBlckJvdW5kICsgdGhpcy5zZXR0aW5ncy5tYXhIZWlnaHQgLSBoZWlnaHREZWx0YTtcblx0XHRcdFxuXHRcdFx0aWYgKG9mZnNldFRvcCA8IHVwcGVyQm91bmQpIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0dGhpcy4kZHJvcGRvd24uc2Nyb2xsVG9wKG9mZnNldFRvcCk7XG5cblx0XHRcdH0gZWxzZSBpZiAob2Zmc2V0VG9wID4gbG93ZXJCb3VuZCkge1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR0aGlzLiRkcm9wZG93bi5zY3JvbGxUb3Aob2Zmc2V0VG9wIC0gdGhpcy5zZXR0aW5ncy5tYXhIZWlnaHQgKyBoZWlnaHREZWx0YSk7XG5cdFx0XHR9XG5cblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIERlc3Ryb3kgQVBJXG5cdFx0ICovXG5cdFx0XG5cdFx0ZGlzcG9zZTogZnVuY3Rpb24oKXtcblxuXHRcdFx0LyogUmVtb3ZlIGNvbWJvIGFycm93LCBpbnB1dCwgZHJvcGRvd24gKi9cblxuXHRcdFx0dGhpcy4kYXJyb3cucmVtb3ZlKClcblxuXHRcdFx0dGhpcy4kaW5wdXQucmVtb3ZlKClcblxuXHRcdFx0dGhpcy4kZHJvcGRvd24ucmVtb3ZlKClcblxuXHRcdFx0LyogUmVtb3ZlIHRhYmluZGV4IHByb3BlcnR5ICovXG5cdFx0XHR0aGlzLiRlbFxuXHRcdFx0XHQucmVtb3ZlQXR0cihcInRhYmluZGV4XCIpXG5cblx0XHRcdC8qIENoZWNrIGlmIHRoZXJlIGlzIGEgdGFiaW5kZXggc2V0IGJlZm9yZSAqL1xuXG5cdFx0XHRpZighIXRoaXMuJGVsLmRhdGEoJ3BsdWdpbl8nKyBkYXRhS2V5ICsgJ190YWJpbmRleCcpKXtcblx0XHRcdFx0dGhpcy4kZWwucHJvcCgndGFiaW5kZXgnLCB0aGlzLiRlbC5kYXRhKCdwbHVnaW5fJysgZGF0YUtleSArICdfdGFiaW5kZXgnKSlcblx0XHRcdH1cblxuXHRcdFx0LyogVW53cmFwICovXG5cblx0XHRcdHRoaXMuJGVsLnVud3JhcCgpXG5cblx0XHRcdC8qIFJlbW92ZSBkYXRhICovXG5cblx0XHRcdHRoaXMuJGVsLnJlbW92ZURhdGEoJ3BsdWdpbl8nK2RhdGFLZXkpXG5cblx0XHRcdC8qIFJlbW92ZSB0YWJpbmRleCBkYXRhICovXG5cblx0XHRcdHRoaXMuJGVsLnJlbW92ZURhdGEoJ3BsdWdpbl8nK2RhdGFLZXkgKyAnX3RhYmluZGV4JylcblxuXHRcdFx0LyogUmVtb3ZlIGNoYW5nZSBldmVudCBvbiBzZWxlY3QgKi9cblxuXHRcdFx0dGhpcy4kZWwub2ZmKCdjaGFuZ2Uuc2VsZWN0IGZvY3VzLnNlbGVjdCBibHVyLnNlbGVjdCcpO1xuXG5cdFx0fVx0XG5cdH0pO1xuXG5cblxuXHQvLyBBIHJlYWxseSBsaWdodHdlaWdodCBwbHVnaW4gd3JhcHBlciBhcm91bmQgdGhlIGNvbnN0cnVjdG9yLFxuXHQvLyBwcmV2ZW50aW5nIGFnYWluc3QgbXVsdGlwbGUgaW5zdGFudGlhdGlvbnNcblx0JC5mblsgcGx1Z2luTmFtZSBdID0gZnVuY3Rpb24gKCBvcHRpb25zLCBhcmdzICkge1xuXG5cdFx0dGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgJGUgPSAkKHRoaXMpLFxuXHRcdFx0XHRpbnN0YW5jZSA9ICRlLmRhdGEoJ3BsdWdpbl8nK2RhdGFLZXkpXG5cblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChpbnN0YW5jZSAmJiB0eXBlb2YgaW5zdGFuY2Vbb3B0aW9uc10gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdGluc3RhbmNlW29wdGlvbnNdKGFyZ3MpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1lbHNle1xuXG5cdFx0XHRcdGlmIChpbnN0YW5jZSAmJiBpbnN0YW5jZS5kaXNwb3NlKSB7XG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5kaXNwb3NlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkLmRhdGEoIHRoaXMsIFwicGx1Z2luX1wiICsgZGF0YUtleSwgbmV3IFBsdWdpbiggdGhpcywgb3B0aW9ucyApICk7XG5cblx0XHRcdH1cblxuXHRcdH0pO1xuXG5cdFx0Ly8gY2hhaW4galF1ZXJ5IGZ1bmN0aW9uc1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdCQuZm5bIHBsdWdpbk5hbWUgXS5pbnN0YW5jZXMgPSBbXTtcblxufSkpO1xuIl0sImZpbGUiOiJwbHVnaW5zL2NvbWJvU2VsZWN0L2pxdWVyeS5jb21iby5zZWxlY3QuanMifQ==
