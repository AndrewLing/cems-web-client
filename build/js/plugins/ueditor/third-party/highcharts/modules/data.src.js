/**
 * @license Data plugin for Highcharts
 *
 * (c) 2012-2013 Torstein Hønsi
 * Last revision 2013-06-07
 *
 * License: www.highcharts.com/license
 */

/*
 * The Highcharts Data plugin is a utility to ease parsing of input sources like
 * CSV, HTML tables or grid views into basic configuration options for use 
 * directly in the Highcharts constructor.
 *
 * Demo: http://jsfiddle.net/highcharts/SnLFj/
 *
 * --- OPTIONS ---
 *
 * - columns : Array<Array<Mixed>>
 * A two-dimensional array representing the input data on tabular form. This input can
 * be used when the data is already parsed, for example from a grid view component.
 * Each cell can be a string or number. If not switchRowsAndColumns is set, the columns
 * are interpreted as series. See also the rows option.
 *
 * - complete : Function(chartOptions)
 * The callback that is evaluated when the data is finished loading, optionally from an 
 * external source, and parsed. The first argument passed is a finished chart options
 * object, containing series and an xAxis with categories if applicable. Thise options
 * can be extended with additional options and passed directly to the chart constructor.
 *
 * - csv : String
 * A comma delimited string to be parsed. Related options are startRow, endRow, startColumn
 * and endColumn to delimit what part of the table is used. The lineDelimiter and 
 * itemDelimiter options define the CSV delimiter formats.
 * 
 * - endColumn : Integer
 * In tabular input data, the first row (indexed by 0) to use. Defaults to the last 
 * column containing data.
 *
 * - endRow : Integer
 * In tabular input data, the last row (indexed by 0) to use. Defaults to the last row
 * containing data.
 *
 * - googleSpreadsheetKey : String 
 * A Google Spreadsheet key. See https://developers.google.com/gdata/samples/spreadsheet_sample
 * for general information on GS.
 *
 * - googleSpreadsheetWorksheet : String 
 * The Google Spreadsheet worksheet. The available id's can be read from 
 * https://spreadsheets.google.com/feeds/worksheets/{key}/public/basic
 *
 * - itemDelimiter : String
 * Item or cell delimiter for parsing CSV. Defaults to ",".
 *
 * - lineDelimiter : String
 * Line delimiter for parsing CSV. Defaults to "\n".
 *
 * - parsed : Function
 * A callback function to access the parsed columns, the two-dimentional input data
 * array directly, before they are interpreted into series data and categories.
 *
 * - parseDate : Function
 * A callback function to parse string representations of dates into JavaScript timestamps.
 * Return an integer on success.
 *
 * - rows : Array<Array<Mixed>>
 * The same as the columns input option, but defining rows intead of columns.
 *
 * - startColumn : Integer
 * In tabular input data, the first column (indexed by 0) to use. 
 *
 * - startRow : Integer
 * In tabular input data, the first row (indexed by 0) to use.
 *
 * - table : String|HTMLElement
 * A HTML table or the id of such to be parsed as input data. Related options ara startRow,
 * endRow, startColumn and endColumn to delimit what part of the table is used.
 */

// JSLint options:
/*global jQuery */

(function (Highcharts) {	
	
	// Utilities
	var each = Highcharts.each;
	
	
	// The Data constructor
	var Data = function (dataOptions, chartOptions) {
		this.init(dataOptions, chartOptions);
	};
	
	// Set the prototype properties
	Highcharts.extend(Data.prototype, {
		
	/**
	 * Initialize the Data object with the given options
	 */
	init: function (options, chartOptions) {
		this.options = options;
		this.chartOptions = chartOptions;
		this.columns = options.columns || this.rowsToColumns(options.rows) || [];

		// No need to parse or interpret anything
		if (this.columns.length) {
			this.dataFound();

		// Parse and interpret
		} else {

			// Parse a CSV string if options.csv is given
			this.parseCSV();
			
			// Parse a HTML table if options.table is given
			this.parseTable();

			// Parse a Google Spreadsheet 
			this.parseGoogleSpreadsheet();	
		}

	},

	/**
	 * Get the column distribution. For example, a line series takes a single column for 
	 * Y values. A range series takes two columns for low and high values respectively,
	 * and an OHLC series takes four columns.
	 */
	getColumnDistribution: function () {
		var chartOptions = this.chartOptions,
			getValueCount = function (type) {
				return (Highcharts.seriesTypes[type || 'line'].prototype.pointArrayMap || [0]).length;
			},
			globalType = chartOptions && chartOptions.chart && chartOptions.chart.type,
			individualCounts = [];

		each((chartOptions && chartOptions.series) || [], function (series) {
			individualCounts.push(getValueCount(series.type || globalType));
		});

		this.valueCount = {
			global: getValueCount(globalType),
			individual: individualCounts
		};
	},


	dataFound: function () {
		// Interpret the values into right types
		this.parseTypes();
		
		// Use first row for series names?
		this.findHeaderRow();
		
		// Handle columns if a handleColumns callback is given
		this.parsed();
		
		// Complete if a complete callback is given
		this.complete();
		
	},
	
	/**
	 * Parse a CSV input string
	 */
	parseCSV: function () {
		var self = this,
			options = this.options,
			csv = options.csv,
			columns = this.columns,
			startRow = options.startRow || 0,
			endRow = options.endRow || Number.MAX_VALUE,
			startColumn = options.startColumn || 0,
			endColumn = options.endColumn || Number.MAX_VALUE,
			lines,
			activeRowNo = 0;
			
		if (csv) {
			
			lines = csv
				.replace(/\r\n/g, "\n") // Unix
				.replace(/\r/g, "\n") // Mac
				.split(options.lineDelimiter || "\n");
			
			each(lines, function (line, rowNo) {
				var trimmed = self.trim(line),
					isComment = trimmed.indexOf('#') === 0,
					isBlank = trimmed === '',
					items;
				
				if (rowNo >= startRow && rowNo <= endRow && !isComment && !isBlank) {
					items = line.split(options.itemDelimiter || ',');
					each(items, function (item, colNo) {
						if (colNo >= startColumn && colNo <= endColumn) {
							if (!columns[colNo - startColumn]) {
								columns[colNo - startColumn] = [];					
							}
							
							columns[colNo - startColumn][activeRowNo] = item;
						}
					});
					activeRowNo += 1;
				}
			});

			this.dataFound();
		}
	},
	
	/**
	 * Parse a HTML table
	 */
	parseTable: function () {
		var options = this.options,
			table = options.table,
			columns = this.columns,
			startRow = options.startRow || 0,
			endRow = options.endRow || Number.MAX_VALUE,
			startColumn = options.startColumn || 0,
			endColumn = options.endColumn || Number.MAX_VALUE,
			colNo;
			
		if (table) {
			
			if (typeof table === 'string') {
				table = document.getElementById(table);
			}
			
			each(table.getElementsByTagName('tr'), function (tr, rowNo) {
				colNo = 0; 
				if (rowNo >= startRow && rowNo <= endRow) {
					each(tr.childNodes, function (item) {
						if ((item.tagName === 'TD' || item.tagName === 'TH') && colNo >= startColumn && colNo <= endColumn) {
							if (!columns[colNo]) {
								columns[colNo] = [];					
							}
							columns[colNo][rowNo - startRow] = item.innerHTML;
							
							colNo += 1;
						}
					});
				}
			});

			this.dataFound(); // continue
		}
	},

	/**
	 * TODO: 
	 * - switchRowsAndColumns
	 */
	parseGoogleSpreadsheet: function () {
		var self = this,
			options = this.options,
			googleSpreadsheetKey = options.googleSpreadsheetKey,
			columns = this.columns,
			startRow = options.startRow || 0,
			endRow = options.endRow || Number.MAX_VALUE,
			startColumn = options.startColumn || 0,
			endColumn = options.endColumn || Number.MAX_VALUE,
			gr, // google row
			gc; // google column

		if (googleSpreadsheetKey) {
			jQuery.getJSON('https://spreadsheets.google.com/feeds/cells/' + 
				  googleSpreadsheetKey + '/' + (options.googleSpreadsheetWorksheet || 'od6') +
					  '/public/values?alt=json-in-script&callback=?',
					  function (json) {
					
				// Prepare the data from the spreadsheat
				var cells = json.feed.entry,
					cell,
					cellCount = cells.length,
					colCount = 0,
					rowCount = 0,
					i;
			
				// First, find the total number of columns and rows that 
				// are actually filled with data
				for (i = 0; i < cellCount; i++) {
					cell = cells[i];
					colCount = Math.max(colCount, cell.gs$cell.col);
					rowCount = Math.max(rowCount, cell.gs$cell.row);			
				}
			
				// Set up arrays containing the column data
				for (i = 0; i < colCount; i++) {
					if (i >= startColumn && i <= endColumn) {
						// Create new columns with the length of either end-start or rowCount
						columns[i - startColumn] = [];

						// Setting the length to avoid jslint warning
						columns[i - startColumn].length = Math.min(rowCount, endRow - startRow);
					}
				}
				
				// Loop over the cells and assign the value to the right
				// place in the column arrays
				for (i = 0; i < cellCount; i++) {
					cell = cells[i];
					gr = cell.gs$cell.row - 1; // rows start at 1
					gc = cell.gs$cell.col - 1; // columns start at 1

					// If both row and col falls inside start and end
					// set the transposed cell value in the newly created columns
					if (gc >= startColumn && gc <= endColumn &&
						gr >= startRow && gr <= endRow) {
						columns[gc - startColumn][gr - startRow] = cell.content.$t;
					}
				}
				self.dataFound();
			});
		}
	},
	
	/**
	 * Find the header row. For now, we just check whether the first row contains
	 * numbers or strings. Later we could loop down and find the first row with 
	 * numbers.
	 */
	findHeaderRow: function () {
		var headerRow = 0;
		each(this.columns, function (column) {
			if (typeof column[0] !== 'string') {
				headerRow = null;
			}
		});
		this.headerRow = 0;			
	},
	
	/**
	 * Trim a string from whitespace
	 */
	trim: function (str) {
		return typeof str === 'string' ? str.replace(/^\s+|\s+$/g, '') : str;
	},
	
	/**
	 * Parse numeric cells in to number types and date types in to true dates.
	 * @param {Object} columns
	 */
	parseTypes: function () {
		var columns = this.columns,
			col = columns.length, 
			row,
			val,
			floatVal,
			trimVal,
			dateVal;
			
		while (col--) {
			row = columns[col].length;
			while (row--) {
				val = columns[col][row];
				floatVal = parseFloat(val);
				trimVal = this.trim(val);

				/*jslint eqeq: true*/
				if (trimVal == floatVal) { // is numeric
				/*jslint eqeq: false*/
					columns[col][row] = floatVal;
					
					// If the number is greater than milliseconds in a year, assume datetime
					if (floatVal > 365 * 24 * 3600 * 1000) {
						columns[col].isDatetime = true;
					} else {
						columns[col].isNumeric = true;
					}					
				
				} else { // string, continue to determine if it is a date string or really a string
					dateVal = this.parseDate(val);
					
					if (col === 0 && typeof dateVal === 'number' && !isNaN(dateVal)) { // is date
						columns[col][row] = dateVal;
						columns[col].isDatetime = true;
					
					} else { // string
						columns[col][row] = trimVal === '' ? null : trimVal;
					}
				}
				
			}
		}
	},
	//*
	dateFormats: {
		'YYYY-mm-dd': {
			regex: '^([0-9]{4})-([0-9]{2})-([0-9]{2})$',
			parser: function (match) {
				return Date.UTC(+match[1], match[2] - 1, +match[3]);
			}
		}
	},
	// */
	/**
	 * Parse a date and return it as a number. Overridable through options.parseDate.
	 */
	parseDate: function (val) {
		var parseDate = this.options.parseDate,
			ret,
			key,
			format,
			match;

		if (parseDate) {
			ret = parseDate(val);
		}
			
		if (typeof val === 'string') {
			for (key in this.dateFormats) {
				format = this.dateFormats[key];
				match = val.match(format.regex);
				if (match) {
					ret = format.parser(match);
				}
			}
		}
		return ret;
	},
	
	/**
	 * Reorganize rows into columns
	 */
	rowsToColumns: function (rows) {
		var row,
			rowsLength,
			col,
			colsLength,
			columns;

		if (rows) {
			columns = [];
			rowsLength = rows.length;
			for (row = 0; row < rowsLength; row++) {
				colsLength = rows[row].length;
				for (col = 0; col < colsLength; col++) {
					if (!columns[col]) {
						columns[col] = [];
					}
					columns[col][row] = rows[row][col];
				}
			}
		}
		return columns;
	},
	
	/**
	 * A hook for working directly on the parsed columns
	 */
	parsed: function () {
		if (this.options.parsed) {
			this.options.parsed.call(this, this.columns);
		}
	},
	
	/**
	 * If a complete callback function is provided in the options, interpret the 
	 * columns into a Highcharts options object.
	 */
	complete: function () {
		
		var columns = this.columns,
			firstCol,
			type,
			options = this.options,
			valueCount,
			series,
			data,
			i,
			j,
			seriesIndex;
			
		
		if (options.complete) {

			this.getColumnDistribution();
			
			// Use first column for X data or categories?
			if (columns.length > 1) {
				firstCol = columns.shift();
				if (this.headerRow === 0) {
					firstCol.shift(); // remove the first cell
				}
				
				
				if (firstCol.isDatetime) {
					type = 'datetime';
				} else if (!firstCol.isNumeric) {
					type = 'category';
				}
			}

			// Get the names and shift the top row
			for (i = 0; i < columns.length; i++) {
				if (this.headerRow === 0) {
					columns[i].name = columns[i].shift();
				}
			}
			
			// Use the next columns for series
			series = [];
			for (i = 0, seriesIndex = 0; i < columns.length; seriesIndex++) {

				// This series' value count
				valueCount = Highcharts.pick(this.valueCount.individual[seriesIndex], this.valueCount.global);
				
				// Iterate down the cells of each column and add data to the series
				data = [];
				for (j = 0; j < columns[i].length; j++) {
					data[j] = [
						firstCol[j], 
						columns[i][j] !== undefined ? columns[i][j] : null
					];
					if (valueCount > 1) {
						data[j].push(columns[i + 1][j] !== undefined ? columns[i + 1][j] : null);
					}
					if (valueCount > 2) {
						data[j].push(columns[i + 2][j] !== undefined ? columns[i + 2][j] : null);
					}
					if (valueCount > 3) {
						data[j].push(columns[i + 3][j] !== undefined ? columns[i + 3][j] : null);
					}
					if (valueCount > 4) {
						data[j].push(columns[i + 4][j] !== undefined ? columns[i + 4][j] : null);
					}
				}

				// Add the series
				series[seriesIndex] = {
					name: columns[i].name,
					data: data
				};

				i += valueCount;
			}
			
			// Do the callback
			options.complete({
				xAxis: {
					type: type
				},
				series: series
			});
		}
	}
	});
	
	// Register the Data prototype and data function on Highcharts
	Highcharts.Data = Data;
	Highcharts.data = function (options, chartOptions) {
		return new Data(options, chartOptions);
	};

	// Extend Chart.init so that the Chart constructor accepts a new configuration
	// option group, data.
	Highcharts.wrap(Highcharts.Chart.prototype, 'init', function (proceed, userOptions, callback) {
		var chart = this;

		if (userOptions && userOptions.data) {
			Highcharts.data(Highcharts.extend(userOptions.data, {
				complete: function (dataOptions) {
					
					// Merge series configs
					if (userOptions.series) {
						each(userOptions.series, function (series, i) {
							userOptions.series[i] = Highcharts.merge(series, dataOptions.series[i]);
						});
					}

					// Do the merge
					userOptions = Highcharts.merge(dataOptions, userOptions);

					proceed.call(chart, userOptions, callback);
				}
			}), userOptions);
		} else {
			proceed.call(chart, userOptions, callback);
		}
	});

}(Highcharts));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJwbHVnaW5zL3VlZGl0b3IvdGhpcmQtcGFydHkvaGlnaGNoYXJ0cy9tb2R1bGVzL2RhdGEuc3JjLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2UgRGF0YSBwbHVnaW4gZm9yIEhpZ2hjaGFydHNcbiAqXG4gKiAoYykgMjAxMi0yMDEzIFRvcnN0ZWluIEjDuG5zaVxuICogTGFzdCByZXZpc2lvbiAyMDEzLTA2LTA3XG4gKlxuICogTGljZW5zZTogd3d3LmhpZ2hjaGFydHMuY29tL2xpY2Vuc2VcbiAqL1xuXG4vKlxuICogVGhlIEhpZ2hjaGFydHMgRGF0YSBwbHVnaW4gaXMgYSB1dGlsaXR5IHRvIGVhc2UgcGFyc2luZyBvZiBpbnB1dCBzb3VyY2VzIGxpa2VcbiAqIENTViwgSFRNTCB0YWJsZXMgb3IgZ3JpZCB2aWV3cyBpbnRvIGJhc2ljIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdXNlIFxuICogZGlyZWN0bHkgaW4gdGhlIEhpZ2hjaGFydHMgY29uc3RydWN0b3IuXG4gKlxuICogRGVtbzogaHR0cDovL2pzZmlkZGxlLm5ldC9oaWdoY2hhcnRzL1NuTEZqL1xuICpcbiAqIC0tLSBPUFRJT05TIC0tLVxuICpcbiAqIC0gY29sdW1ucyA6IEFycmF5PEFycmF5PE1peGVkPj5cbiAqIEEgdHdvLWRpbWVuc2lvbmFsIGFycmF5IHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZGF0YSBvbiB0YWJ1bGFyIGZvcm0uIFRoaXMgaW5wdXQgY2FuXG4gKiBiZSB1c2VkIHdoZW4gdGhlIGRhdGEgaXMgYWxyZWFkeSBwYXJzZWQsIGZvciBleGFtcGxlIGZyb20gYSBncmlkIHZpZXcgY29tcG9uZW50LlxuICogRWFjaCBjZWxsIGNhbiBiZSBhIHN0cmluZyBvciBudW1iZXIuIElmIG5vdCBzd2l0Y2hSb3dzQW5kQ29sdW1ucyBpcyBzZXQsIHRoZSBjb2x1bW5zXG4gKiBhcmUgaW50ZXJwcmV0ZWQgYXMgc2VyaWVzLiBTZWUgYWxzbyB0aGUgcm93cyBvcHRpb24uXG4gKlxuICogLSBjb21wbGV0ZSA6IEZ1bmN0aW9uKGNoYXJ0T3B0aW9ucylcbiAqIFRoZSBjYWxsYmFjayB0aGF0IGlzIGV2YWx1YXRlZCB3aGVuIHRoZSBkYXRhIGlzIGZpbmlzaGVkIGxvYWRpbmcsIG9wdGlvbmFsbHkgZnJvbSBhbiBcbiAqIGV4dGVybmFsIHNvdXJjZSwgYW5kIHBhcnNlZC4gVGhlIGZpcnN0IGFyZ3VtZW50IHBhc3NlZCBpcyBhIGZpbmlzaGVkIGNoYXJ0IG9wdGlvbnNcbiAqIG9iamVjdCwgY29udGFpbmluZyBzZXJpZXMgYW5kIGFuIHhBeGlzIHdpdGggY2F0ZWdvcmllcyBpZiBhcHBsaWNhYmxlLiBUaGlzZSBvcHRpb25zXG4gKiBjYW4gYmUgZXh0ZW5kZWQgd2l0aCBhZGRpdGlvbmFsIG9wdGlvbnMgYW5kIHBhc3NlZCBkaXJlY3RseSB0byB0aGUgY2hhcnQgY29uc3RydWN0b3IuXG4gKlxuICogLSBjc3YgOiBTdHJpbmdcbiAqIEEgY29tbWEgZGVsaW1pdGVkIHN0cmluZyB0byBiZSBwYXJzZWQuIFJlbGF0ZWQgb3B0aW9ucyBhcmUgc3RhcnRSb3csIGVuZFJvdywgc3RhcnRDb2x1bW5cbiAqIGFuZCBlbmRDb2x1bW4gdG8gZGVsaW1pdCB3aGF0IHBhcnQgb2YgdGhlIHRhYmxlIGlzIHVzZWQuIFRoZSBsaW5lRGVsaW1pdGVyIGFuZCBcbiAqIGl0ZW1EZWxpbWl0ZXIgb3B0aW9ucyBkZWZpbmUgdGhlIENTViBkZWxpbWl0ZXIgZm9ybWF0cy5cbiAqIFxuICogLSBlbmRDb2x1bW4gOiBJbnRlZ2VyXG4gKiBJbiB0YWJ1bGFyIGlucHV0IGRhdGEsIHRoZSBmaXJzdCByb3cgKGluZGV4ZWQgYnkgMCkgdG8gdXNlLiBEZWZhdWx0cyB0byB0aGUgbGFzdCBcbiAqIGNvbHVtbiBjb250YWluaW5nIGRhdGEuXG4gKlxuICogLSBlbmRSb3cgOiBJbnRlZ2VyXG4gKiBJbiB0YWJ1bGFyIGlucHV0IGRhdGEsIHRoZSBsYXN0IHJvdyAoaW5kZXhlZCBieSAwKSB0byB1c2UuIERlZmF1bHRzIHRvIHRoZSBsYXN0IHJvd1xuICogY29udGFpbmluZyBkYXRhLlxuICpcbiAqIC0gZ29vZ2xlU3ByZWFkc2hlZXRLZXkgOiBTdHJpbmcgXG4gKiBBIEdvb2dsZSBTcHJlYWRzaGVldCBrZXkuIFNlZSBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9nZGF0YS9zYW1wbGVzL3NwcmVhZHNoZWV0X3NhbXBsZVxuICogZm9yIGdlbmVyYWwgaW5mb3JtYXRpb24gb24gR1MuXG4gKlxuICogLSBnb29nbGVTcHJlYWRzaGVldFdvcmtzaGVldCA6IFN0cmluZyBcbiAqIFRoZSBHb29nbGUgU3ByZWFkc2hlZXQgd29ya3NoZWV0LiBUaGUgYXZhaWxhYmxlIGlkJ3MgY2FuIGJlIHJlYWQgZnJvbSBcbiAqIGh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy97a2V5fS9wdWJsaWMvYmFzaWNcbiAqXG4gKiAtIGl0ZW1EZWxpbWl0ZXIgOiBTdHJpbmdcbiAqIEl0ZW0gb3IgY2VsbCBkZWxpbWl0ZXIgZm9yIHBhcnNpbmcgQ1NWLiBEZWZhdWx0cyB0byBcIixcIi5cbiAqXG4gKiAtIGxpbmVEZWxpbWl0ZXIgOiBTdHJpbmdcbiAqIExpbmUgZGVsaW1pdGVyIGZvciBwYXJzaW5nIENTVi4gRGVmYXVsdHMgdG8gXCJcXG5cIi5cbiAqXG4gKiAtIHBhcnNlZCA6IEZ1bmN0aW9uXG4gKiBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFjY2VzcyB0aGUgcGFyc2VkIGNvbHVtbnMsIHRoZSB0d28tZGltZW50aW9uYWwgaW5wdXQgZGF0YVxuICogYXJyYXkgZGlyZWN0bHksIGJlZm9yZSB0aGV5IGFyZSBpbnRlcnByZXRlZCBpbnRvIHNlcmllcyBkYXRhIGFuZCBjYXRlZ29yaWVzLlxuICpcbiAqIC0gcGFyc2VEYXRlIDogRnVuY3Rpb25cbiAqIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcGFyc2Ugc3RyaW5nIHJlcHJlc2VudGF0aW9ucyBvZiBkYXRlcyBpbnRvIEphdmFTY3JpcHQgdGltZXN0YW1wcy5cbiAqIFJldHVybiBhbiBpbnRlZ2VyIG9uIHN1Y2Nlc3MuXG4gKlxuICogLSByb3dzIDogQXJyYXk8QXJyYXk8TWl4ZWQ+PlxuICogVGhlIHNhbWUgYXMgdGhlIGNvbHVtbnMgaW5wdXQgb3B0aW9uLCBidXQgZGVmaW5pbmcgcm93cyBpbnRlYWQgb2YgY29sdW1ucy5cbiAqXG4gKiAtIHN0YXJ0Q29sdW1uIDogSW50ZWdlclxuICogSW4gdGFidWxhciBpbnB1dCBkYXRhLCB0aGUgZmlyc3QgY29sdW1uIChpbmRleGVkIGJ5IDApIHRvIHVzZS4gXG4gKlxuICogLSBzdGFydFJvdyA6IEludGVnZXJcbiAqIEluIHRhYnVsYXIgaW5wdXQgZGF0YSwgdGhlIGZpcnN0IHJvdyAoaW5kZXhlZCBieSAwKSB0byB1c2UuXG4gKlxuICogLSB0YWJsZSA6IFN0cmluZ3xIVE1MRWxlbWVudFxuICogQSBIVE1MIHRhYmxlIG9yIHRoZSBpZCBvZiBzdWNoIHRvIGJlIHBhcnNlZCBhcyBpbnB1dCBkYXRhLiBSZWxhdGVkIG9wdGlvbnMgYXJhIHN0YXJ0Um93LFxuICogZW5kUm93LCBzdGFydENvbHVtbiBhbmQgZW5kQ29sdW1uIHRvIGRlbGltaXQgd2hhdCBwYXJ0IG9mIHRoZSB0YWJsZSBpcyB1c2VkLlxuICovXG5cbi8vIEpTTGludCBvcHRpb25zOlxuLypnbG9iYWwgalF1ZXJ5ICovXG5cbihmdW5jdGlvbiAoSGlnaGNoYXJ0cykge1x0XG5cdFxuXHQvLyBVdGlsaXRpZXNcblx0dmFyIGVhY2ggPSBIaWdoY2hhcnRzLmVhY2g7XG5cdFxuXHRcblx0Ly8gVGhlIERhdGEgY29uc3RydWN0b3Jcblx0dmFyIERhdGEgPSBmdW5jdGlvbiAoZGF0YU9wdGlvbnMsIGNoYXJ0T3B0aW9ucykge1xuXHRcdHRoaXMuaW5pdChkYXRhT3B0aW9ucywgY2hhcnRPcHRpb25zKTtcblx0fTtcblx0XG5cdC8vIFNldCB0aGUgcHJvdG90eXBlIHByb3BlcnRpZXNcblx0SGlnaGNoYXJ0cy5leHRlbmQoRGF0YS5wcm90b3R5cGUsIHtcblx0XHRcblx0LyoqXG5cdCAqIEluaXRpYWxpemUgdGhlIERhdGEgb2JqZWN0IHdpdGggdGhlIGdpdmVuIG9wdGlvbnNcblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zLCBjaGFydE9wdGlvbnMpIHtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuY2hhcnRPcHRpb25zID0gY2hhcnRPcHRpb25zO1xuXHRcdHRoaXMuY29sdW1ucyA9IG9wdGlvbnMuY29sdW1ucyB8fCB0aGlzLnJvd3NUb0NvbHVtbnMob3B0aW9ucy5yb3dzKSB8fCBbXTtcblxuXHRcdC8vIE5vIG5lZWQgdG8gcGFyc2Ugb3IgaW50ZXJwcmV0IGFueXRoaW5nXG5cdFx0aWYgKHRoaXMuY29sdW1ucy5sZW5ndGgpIHtcblx0XHRcdHRoaXMuZGF0YUZvdW5kKCk7XG5cblx0XHQvLyBQYXJzZSBhbmQgaW50ZXJwcmV0XG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0Ly8gUGFyc2UgYSBDU1Ygc3RyaW5nIGlmIG9wdGlvbnMuY3N2IGlzIGdpdmVuXG5cdFx0XHR0aGlzLnBhcnNlQ1NWKCk7XG5cdFx0XHRcblx0XHRcdC8vIFBhcnNlIGEgSFRNTCB0YWJsZSBpZiBvcHRpb25zLnRhYmxlIGlzIGdpdmVuXG5cdFx0XHR0aGlzLnBhcnNlVGFibGUoKTtcblxuXHRcdFx0Ly8gUGFyc2UgYSBHb29nbGUgU3ByZWFkc2hlZXQgXG5cdFx0XHR0aGlzLnBhcnNlR29vZ2xlU3ByZWFkc2hlZXQoKTtcdFxuXHRcdH1cblxuXHR9LFxuXG5cdC8qKlxuXHQgKiBHZXQgdGhlIGNvbHVtbiBkaXN0cmlidXRpb24uIEZvciBleGFtcGxlLCBhIGxpbmUgc2VyaWVzIHRha2VzIGEgc2luZ2xlIGNvbHVtbiBmb3IgXG5cdCAqIFkgdmFsdWVzLiBBIHJhbmdlIHNlcmllcyB0YWtlcyB0d28gY29sdW1ucyBmb3IgbG93IGFuZCBoaWdoIHZhbHVlcyByZXNwZWN0aXZlbHksXG5cdCAqIGFuZCBhbiBPSExDIHNlcmllcyB0YWtlcyBmb3VyIGNvbHVtbnMuXG5cdCAqL1xuXHRnZXRDb2x1bW5EaXN0cmlidXRpb246IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2hhcnRPcHRpb25zID0gdGhpcy5jaGFydE9wdGlvbnMsXG5cdFx0XHRnZXRWYWx1ZUNvdW50ID0gZnVuY3Rpb24gKHR5cGUpIHtcblx0XHRcdFx0cmV0dXJuIChIaWdoY2hhcnRzLnNlcmllc1R5cGVzW3R5cGUgfHwgJ2xpbmUnXS5wcm90b3R5cGUucG9pbnRBcnJheU1hcCB8fCBbMF0pLmxlbmd0aDtcblx0XHRcdH0sXG5cdFx0XHRnbG9iYWxUeXBlID0gY2hhcnRPcHRpb25zICYmIGNoYXJ0T3B0aW9ucy5jaGFydCAmJiBjaGFydE9wdGlvbnMuY2hhcnQudHlwZSxcblx0XHRcdGluZGl2aWR1YWxDb3VudHMgPSBbXTtcblxuXHRcdGVhY2goKGNoYXJ0T3B0aW9ucyAmJiBjaGFydE9wdGlvbnMuc2VyaWVzKSB8fCBbXSwgZnVuY3Rpb24gKHNlcmllcykge1xuXHRcdFx0aW5kaXZpZHVhbENvdW50cy5wdXNoKGdldFZhbHVlQ291bnQoc2VyaWVzLnR5cGUgfHwgZ2xvYmFsVHlwZSkpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy52YWx1ZUNvdW50ID0ge1xuXHRcdFx0Z2xvYmFsOiBnZXRWYWx1ZUNvdW50KGdsb2JhbFR5cGUpLFxuXHRcdFx0aW5kaXZpZHVhbDogaW5kaXZpZHVhbENvdW50c1xuXHRcdH07XG5cdH0sXG5cblxuXHRkYXRhRm91bmQ6IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBJbnRlcnByZXQgdGhlIHZhbHVlcyBpbnRvIHJpZ2h0IHR5cGVzXG5cdFx0dGhpcy5wYXJzZVR5cGVzKCk7XG5cdFx0XG5cdFx0Ly8gVXNlIGZpcnN0IHJvdyBmb3Igc2VyaWVzIG5hbWVzP1xuXHRcdHRoaXMuZmluZEhlYWRlclJvdygpO1xuXHRcdFxuXHRcdC8vIEhhbmRsZSBjb2x1bW5zIGlmIGEgaGFuZGxlQ29sdW1ucyBjYWxsYmFjayBpcyBnaXZlblxuXHRcdHRoaXMucGFyc2VkKCk7XG5cdFx0XG5cdFx0Ly8gQ29tcGxldGUgaWYgYSBjb21wbGV0ZSBjYWxsYmFjayBpcyBnaXZlblxuXHRcdHRoaXMuY29tcGxldGUoKTtcblx0XHRcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBQYXJzZSBhIENTViBpbnB1dCBzdHJpbmdcblx0ICovXG5cdHBhcnNlQ1NWOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcblx0XHRcdGNzdiA9IG9wdGlvbnMuY3N2LFxuXHRcdFx0Y29sdW1ucyA9IHRoaXMuY29sdW1ucyxcblx0XHRcdHN0YXJ0Um93ID0gb3B0aW9ucy5zdGFydFJvdyB8fCAwLFxuXHRcdFx0ZW5kUm93ID0gb3B0aW9ucy5lbmRSb3cgfHwgTnVtYmVyLk1BWF9WQUxVRSxcblx0XHRcdHN0YXJ0Q29sdW1uID0gb3B0aW9ucy5zdGFydENvbHVtbiB8fCAwLFxuXHRcdFx0ZW5kQ29sdW1uID0gb3B0aW9ucy5lbmRDb2x1bW4gfHwgTnVtYmVyLk1BWF9WQUxVRSxcblx0XHRcdGxpbmVzLFxuXHRcdFx0YWN0aXZlUm93Tm8gPSAwO1xuXHRcdFx0XG5cdFx0aWYgKGNzdikge1xuXHRcdFx0XG5cdFx0XHRsaW5lcyA9IGNzdlxuXHRcdFx0XHQucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpIC8vIFVuaXhcblx0XHRcdFx0LnJlcGxhY2UoL1xcci9nLCBcIlxcblwiKSAvLyBNYWNcblx0XHRcdFx0LnNwbGl0KG9wdGlvbnMubGluZURlbGltaXRlciB8fCBcIlxcblwiKTtcblx0XHRcdFxuXHRcdFx0ZWFjaChsaW5lcywgZnVuY3Rpb24gKGxpbmUsIHJvd05vKSB7XG5cdFx0XHRcdHZhciB0cmltbWVkID0gc2VsZi50cmltKGxpbmUpLFxuXHRcdFx0XHRcdGlzQ29tbWVudCA9IHRyaW1tZWQuaW5kZXhPZignIycpID09PSAwLFxuXHRcdFx0XHRcdGlzQmxhbmsgPSB0cmltbWVkID09PSAnJyxcblx0XHRcdFx0XHRpdGVtcztcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChyb3dObyA+PSBzdGFydFJvdyAmJiByb3dObyA8PSBlbmRSb3cgJiYgIWlzQ29tbWVudCAmJiAhaXNCbGFuaykge1xuXHRcdFx0XHRcdGl0ZW1zID0gbGluZS5zcGxpdChvcHRpb25zLml0ZW1EZWxpbWl0ZXIgfHwgJywnKTtcblx0XHRcdFx0XHRlYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSwgY29sTm8pIHtcblx0XHRcdFx0XHRcdGlmIChjb2xObyA+PSBzdGFydENvbHVtbiAmJiBjb2xObyA8PSBlbmRDb2x1bW4pIHtcblx0XHRcdFx0XHRcdFx0aWYgKCFjb2x1bW5zW2NvbE5vIC0gc3RhcnRDb2x1bW5dKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29sdW1uc1tjb2xObyAtIHN0YXJ0Q29sdW1uXSA9IFtdO1x0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0Y29sdW1uc1tjb2xObyAtIHN0YXJ0Q29sdW1uXVthY3RpdmVSb3dOb10gPSBpdGVtO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGFjdGl2ZVJvd05vICs9IDE7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmRhdGFGb3VuZCgpO1xuXHRcdH1cblx0fSxcblx0XG5cdC8qKlxuXHQgKiBQYXJzZSBhIEhUTUwgdGFibGVcblx0ICovXG5cdHBhcnNlVGFibGU6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcblx0XHRcdHRhYmxlID0gb3B0aW9ucy50YWJsZSxcblx0XHRcdGNvbHVtbnMgPSB0aGlzLmNvbHVtbnMsXG5cdFx0XHRzdGFydFJvdyA9IG9wdGlvbnMuc3RhcnRSb3cgfHwgMCxcblx0XHRcdGVuZFJvdyA9IG9wdGlvbnMuZW5kUm93IHx8IE51bWJlci5NQVhfVkFMVUUsXG5cdFx0XHRzdGFydENvbHVtbiA9IG9wdGlvbnMuc3RhcnRDb2x1bW4gfHwgMCxcblx0XHRcdGVuZENvbHVtbiA9IG9wdGlvbnMuZW5kQ29sdW1uIHx8IE51bWJlci5NQVhfVkFMVUUsXG5cdFx0XHRjb2xObztcblx0XHRcdFxuXHRcdGlmICh0YWJsZSkge1xuXHRcdFx0XG5cdFx0XHRpZiAodHlwZW9mIHRhYmxlID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHR0YWJsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYmxlKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZWFjaCh0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndHInKSwgZnVuY3Rpb24gKHRyLCByb3dObykge1xuXHRcdFx0XHRjb2xObyA9IDA7IFxuXHRcdFx0XHRpZiAocm93Tm8gPj0gc3RhcnRSb3cgJiYgcm93Tm8gPD0gZW5kUm93KSB7XG5cdFx0XHRcdFx0ZWFjaCh0ci5jaGlsZE5vZGVzLCBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdFx0XHRcdFx0aWYgKChpdGVtLnRhZ05hbWUgPT09ICdURCcgfHwgaXRlbS50YWdOYW1lID09PSAnVEgnKSAmJiBjb2xObyA+PSBzdGFydENvbHVtbiAmJiBjb2xObyA8PSBlbmRDb2x1bW4pIHtcblx0XHRcdFx0XHRcdFx0aWYgKCFjb2x1bW5zW2NvbE5vXSkge1xuXHRcdFx0XHRcdFx0XHRcdGNvbHVtbnNbY29sTm9dID0gW107XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGNvbHVtbnNbY29sTm9dW3Jvd05vIC0gc3RhcnRSb3ddID0gaXRlbS5pbm5lckhUTUw7XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRjb2xObyArPSAxO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5kYXRhRm91bmQoKTsgLy8gY29udGludWVcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIFRPRE86IFxuXHQgKiAtIHN3aXRjaFJvd3NBbmRDb2x1bW5zXG5cdCAqL1xuXHRwYXJzZUdvb2dsZVNwcmVhZHNoZWV0OiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0b3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcblx0XHRcdGdvb2dsZVNwcmVhZHNoZWV0S2V5ID0gb3B0aW9ucy5nb29nbGVTcHJlYWRzaGVldEtleSxcblx0XHRcdGNvbHVtbnMgPSB0aGlzLmNvbHVtbnMsXG5cdFx0XHRzdGFydFJvdyA9IG9wdGlvbnMuc3RhcnRSb3cgfHwgMCxcblx0XHRcdGVuZFJvdyA9IG9wdGlvbnMuZW5kUm93IHx8IE51bWJlci5NQVhfVkFMVUUsXG5cdFx0XHRzdGFydENvbHVtbiA9IG9wdGlvbnMuc3RhcnRDb2x1bW4gfHwgMCxcblx0XHRcdGVuZENvbHVtbiA9IG9wdGlvbnMuZW5kQ29sdW1uIHx8IE51bWJlci5NQVhfVkFMVUUsXG5cdFx0XHRnciwgLy8gZ29vZ2xlIHJvd1xuXHRcdFx0Z2M7IC8vIGdvb2dsZSBjb2x1bW5cblxuXHRcdGlmIChnb29nbGVTcHJlYWRzaGVldEtleSkge1xuXHRcdFx0alF1ZXJ5LmdldEpTT04oJ2h0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvY2VsbHMvJyArIFxuXHRcdFx0XHQgIGdvb2dsZVNwcmVhZHNoZWV0S2V5ICsgJy8nICsgKG9wdGlvbnMuZ29vZ2xlU3ByZWFkc2hlZXRXb3Jrc2hlZXQgfHwgJ29kNicpICtcblx0XHRcdFx0XHQgICcvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHQmY2FsbGJhY2s9PycsXG5cdFx0XHRcdFx0ICBmdW5jdGlvbiAoanNvbikge1xuXHRcdFx0XHRcdFxuXHRcdFx0XHQvLyBQcmVwYXJlIHRoZSBkYXRhIGZyb20gdGhlIHNwcmVhZHNoZWF0XG5cdFx0XHRcdHZhciBjZWxscyA9IGpzb24uZmVlZC5lbnRyeSxcblx0XHRcdFx0XHRjZWxsLFxuXHRcdFx0XHRcdGNlbGxDb3VudCA9IGNlbGxzLmxlbmd0aCxcblx0XHRcdFx0XHRjb2xDb3VudCA9IDAsXG5cdFx0XHRcdFx0cm93Q291bnQgPSAwLFxuXHRcdFx0XHRcdGk7XG5cdFx0XHRcblx0XHRcdFx0Ly8gRmlyc3QsIGZpbmQgdGhlIHRvdGFsIG51bWJlciBvZiBjb2x1bW5zIGFuZCByb3dzIHRoYXQgXG5cdFx0XHRcdC8vIGFyZSBhY3R1YWxseSBmaWxsZWQgd2l0aCBkYXRhXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBjZWxsQ291bnQ7IGkrKykge1xuXHRcdFx0XHRcdGNlbGwgPSBjZWxsc1tpXTtcblx0XHRcdFx0XHRjb2xDb3VudCA9IE1hdGgubWF4KGNvbENvdW50LCBjZWxsLmdzJGNlbGwuY29sKTtcblx0XHRcdFx0XHRyb3dDb3VudCA9IE1hdGgubWF4KHJvd0NvdW50LCBjZWxsLmdzJGNlbGwucm93KTtcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcdC8vIFNldCB1cCBhcnJheXMgY29udGFpbmluZyB0aGUgY29sdW1uIGRhdGFcblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGNvbENvdW50OyBpKyspIHtcblx0XHRcdFx0XHRpZiAoaSA+PSBzdGFydENvbHVtbiAmJiBpIDw9IGVuZENvbHVtbikge1xuXHRcdFx0XHRcdFx0Ly8gQ3JlYXRlIG5ldyBjb2x1bW5zIHdpdGggdGhlIGxlbmd0aCBvZiBlaXRoZXIgZW5kLXN0YXJ0IG9yIHJvd0NvdW50XG5cdFx0XHRcdFx0XHRjb2x1bW5zW2kgLSBzdGFydENvbHVtbl0gPSBbXTtcblxuXHRcdFx0XHRcdFx0Ly8gU2V0dGluZyB0aGUgbGVuZ3RoIHRvIGF2b2lkIGpzbGludCB3YXJuaW5nXG5cdFx0XHRcdFx0XHRjb2x1bW5zW2kgLSBzdGFydENvbHVtbl0ubGVuZ3RoID0gTWF0aC5taW4ocm93Q291bnQsIGVuZFJvdyAtIHN0YXJ0Um93KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIExvb3Agb3ZlciB0aGUgY2VsbHMgYW5kIGFzc2lnbiB0aGUgdmFsdWUgdG8gdGhlIHJpZ2h0XG5cdFx0XHRcdC8vIHBsYWNlIGluIHRoZSBjb2x1bW4gYXJyYXlzXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBjZWxsQ291bnQ7IGkrKykge1xuXHRcdFx0XHRcdGNlbGwgPSBjZWxsc1tpXTtcblx0XHRcdFx0XHRnciA9IGNlbGwuZ3MkY2VsbC5yb3cgLSAxOyAvLyByb3dzIHN0YXJ0IGF0IDFcblx0XHRcdFx0XHRnYyA9IGNlbGwuZ3MkY2VsbC5jb2wgLSAxOyAvLyBjb2x1bW5zIHN0YXJ0IGF0IDFcblxuXHRcdFx0XHRcdC8vIElmIGJvdGggcm93IGFuZCBjb2wgZmFsbHMgaW5zaWRlIHN0YXJ0IGFuZCBlbmRcblx0XHRcdFx0XHQvLyBzZXQgdGhlIHRyYW5zcG9zZWQgY2VsbCB2YWx1ZSBpbiB0aGUgbmV3bHkgY3JlYXRlZCBjb2x1bW5zXG5cdFx0XHRcdFx0aWYgKGdjID49IHN0YXJ0Q29sdW1uICYmIGdjIDw9IGVuZENvbHVtbiAmJlxuXHRcdFx0XHRcdFx0Z3IgPj0gc3RhcnRSb3cgJiYgZ3IgPD0gZW5kUm93KSB7XG5cdFx0XHRcdFx0XHRjb2x1bW5zW2djIC0gc3RhcnRDb2x1bW5dW2dyIC0gc3RhcnRSb3ddID0gY2VsbC5jb250ZW50LiR0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRzZWxmLmRhdGFGb3VuZCgpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LFxuXHRcblx0LyoqXG5cdCAqIEZpbmQgdGhlIGhlYWRlciByb3cuIEZvciBub3csIHdlIGp1c3QgY2hlY2sgd2hldGhlciB0aGUgZmlyc3Qgcm93IGNvbnRhaW5zXG5cdCAqIG51bWJlcnMgb3Igc3RyaW5ncy4gTGF0ZXIgd2UgY291bGQgbG9vcCBkb3duIGFuZCBmaW5kIHRoZSBmaXJzdCByb3cgd2l0aCBcblx0ICogbnVtYmVycy5cblx0ICovXG5cdGZpbmRIZWFkZXJSb3c6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaGVhZGVyUm93ID0gMDtcblx0XHRlYWNoKHRoaXMuY29sdW1ucywgZnVuY3Rpb24gKGNvbHVtbikge1xuXHRcdFx0aWYgKHR5cGVvZiBjb2x1bW5bMF0gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdGhlYWRlclJvdyA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5oZWFkZXJSb3cgPSAwO1x0XHRcdFxuXHR9LFxuXHRcblx0LyoqXG5cdCAqIFRyaW0gYSBzdHJpbmcgZnJvbSB3aGl0ZXNwYWNlXG5cdCAqL1xuXHR0cmltOiBmdW5jdGlvbiAoc3RyKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnID8gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKSA6IHN0cjtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBQYXJzZSBudW1lcmljIGNlbGxzIGluIHRvIG51bWJlciB0eXBlcyBhbmQgZGF0ZSB0eXBlcyBpbiB0byB0cnVlIGRhdGVzLlxuXHQgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uc1xuXHQgKi9cblx0cGFyc2VUeXBlczogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjb2x1bW5zID0gdGhpcy5jb2x1bW5zLFxuXHRcdFx0Y29sID0gY29sdW1ucy5sZW5ndGgsIFxuXHRcdFx0cm93LFxuXHRcdFx0dmFsLFxuXHRcdFx0ZmxvYXRWYWwsXG5cdFx0XHR0cmltVmFsLFxuXHRcdFx0ZGF0ZVZhbDtcblx0XHRcdFxuXHRcdHdoaWxlIChjb2wtLSkge1xuXHRcdFx0cm93ID0gY29sdW1uc1tjb2xdLmxlbmd0aDtcblx0XHRcdHdoaWxlIChyb3ctLSkge1xuXHRcdFx0XHR2YWwgPSBjb2x1bW5zW2NvbF1bcm93XTtcblx0XHRcdFx0ZmxvYXRWYWwgPSBwYXJzZUZsb2F0KHZhbCk7XG5cdFx0XHRcdHRyaW1WYWwgPSB0aGlzLnRyaW0odmFsKTtcblxuXHRcdFx0XHQvKmpzbGludCBlcWVxOiB0cnVlKi9cblx0XHRcdFx0aWYgKHRyaW1WYWwgPT0gZmxvYXRWYWwpIHsgLy8gaXMgbnVtZXJpY1xuXHRcdFx0XHQvKmpzbGludCBlcWVxOiBmYWxzZSovXG5cdFx0XHRcdFx0Y29sdW1uc1tjb2xdW3Jvd10gPSBmbG9hdFZhbDtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBJZiB0aGUgbnVtYmVyIGlzIGdyZWF0ZXIgdGhhbiBtaWxsaXNlY29uZHMgaW4gYSB5ZWFyLCBhc3N1bWUgZGF0ZXRpbWVcblx0XHRcdFx0XHRpZiAoZmxvYXRWYWwgPiAzNjUgKiAyNCAqIDM2MDAgKiAxMDAwKSB7XG5cdFx0XHRcdFx0XHRjb2x1bW5zW2NvbF0uaXNEYXRldGltZSA9IHRydWU7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbHVtbnNbY29sXS5pc051bWVyaWMgPSB0cnVlO1xuXHRcdFx0XHRcdH1cdFx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHR9IGVsc2UgeyAvLyBzdHJpbmcsIGNvbnRpbnVlIHRvIGRldGVybWluZSBpZiBpdCBpcyBhIGRhdGUgc3RyaW5nIG9yIHJlYWxseSBhIHN0cmluZ1xuXHRcdFx0XHRcdGRhdGVWYWwgPSB0aGlzLnBhcnNlRGF0ZSh2YWwpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIChjb2wgPT09IDAgJiYgdHlwZW9mIGRhdGVWYWwgPT09ICdudW1iZXInICYmICFpc05hTihkYXRlVmFsKSkgeyAvLyBpcyBkYXRlXG5cdFx0XHRcdFx0XHRjb2x1bW5zW2NvbF1bcm93XSA9IGRhdGVWYWw7XG5cdFx0XHRcdFx0XHRjb2x1bW5zW2NvbF0uaXNEYXRldGltZSA9IHRydWU7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0fSBlbHNlIHsgLy8gc3RyaW5nXG5cdFx0XHRcdFx0XHRjb2x1bW5zW2NvbF1bcm93XSA9IHRyaW1WYWwgPT09ICcnID8gbnVsbCA6IHRyaW1WYWw7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0Ly8qXG5cdGRhdGVGb3JtYXRzOiB7XG5cdFx0J1lZWVktbW0tZGQnOiB7XG5cdFx0XHRyZWdleDogJ14oWzAtOV17NH0pLShbMC05XXsyfSktKFswLTldezJ9KSQnLFxuXHRcdFx0cGFyc2VyOiBmdW5jdGlvbiAobWF0Y2gpIHtcblx0XHRcdFx0cmV0dXJuIERhdGUuVVRDKCttYXRjaFsxXSwgbWF0Y2hbMl0gLSAxLCArbWF0Y2hbM10pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0Ly8gKi9cblx0LyoqXG5cdCAqIFBhcnNlIGEgZGF0ZSBhbmQgcmV0dXJuIGl0IGFzIGEgbnVtYmVyLiBPdmVycmlkYWJsZSB0aHJvdWdoIG9wdGlvbnMucGFyc2VEYXRlLlxuXHQgKi9cblx0cGFyc2VEYXRlOiBmdW5jdGlvbiAodmFsKSB7XG5cdFx0dmFyIHBhcnNlRGF0ZSA9IHRoaXMub3B0aW9ucy5wYXJzZURhdGUsXG5cdFx0XHRyZXQsXG5cdFx0XHRrZXksXG5cdFx0XHRmb3JtYXQsXG5cdFx0XHRtYXRjaDtcblxuXHRcdGlmIChwYXJzZURhdGUpIHtcblx0XHRcdHJldCA9IHBhcnNlRGF0ZSh2YWwpO1xuXHRcdH1cblx0XHRcdFxuXHRcdGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuXHRcdFx0Zm9yIChrZXkgaW4gdGhpcy5kYXRlRm9ybWF0cykge1xuXHRcdFx0XHRmb3JtYXQgPSB0aGlzLmRhdGVGb3JtYXRzW2tleV07XG5cdFx0XHRcdG1hdGNoID0gdmFsLm1hdGNoKGZvcm1hdC5yZWdleCk7XG5cdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdHJldCA9IGZvcm1hdC5wYXJzZXIobWF0Y2gpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiByZXQ7XG5cdH0sXG5cdFxuXHQvKipcblx0ICogUmVvcmdhbml6ZSByb3dzIGludG8gY29sdW1uc1xuXHQgKi9cblx0cm93c1RvQ29sdW1uczogZnVuY3Rpb24gKHJvd3MpIHtcblx0XHR2YXIgcm93LFxuXHRcdFx0cm93c0xlbmd0aCxcblx0XHRcdGNvbCxcblx0XHRcdGNvbHNMZW5ndGgsXG5cdFx0XHRjb2x1bW5zO1xuXG5cdFx0aWYgKHJvd3MpIHtcblx0XHRcdGNvbHVtbnMgPSBbXTtcblx0XHRcdHJvd3NMZW5ndGggPSByb3dzLmxlbmd0aDtcblx0XHRcdGZvciAocm93ID0gMDsgcm93IDwgcm93c0xlbmd0aDsgcm93KyspIHtcblx0XHRcdFx0Y29sc0xlbmd0aCA9IHJvd3Nbcm93XS5sZW5ndGg7XG5cdFx0XHRcdGZvciAoY29sID0gMDsgY29sIDwgY29sc0xlbmd0aDsgY29sKyspIHtcblx0XHRcdFx0XHRpZiAoIWNvbHVtbnNbY29sXSkge1xuXHRcdFx0XHRcdFx0Y29sdW1uc1tjb2xdID0gW107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbHVtbnNbY29sXVtyb3ddID0gcm93c1tyb3ddW2NvbF07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGNvbHVtbnM7XG5cdH0sXG5cdFxuXHQvKipcblx0ICogQSBob29rIGZvciB3b3JraW5nIGRpcmVjdGx5IG9uIHRoZSBwYXJzZWQgY29sdW1uc1xuXHQgKi9cblx0cGFyc2VkOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKHRoaXMub3B0aW9ucy5wYXJzZWQpIHtcblx0XHRcdHRoaXMub3B0aW9ucy5wYXJzZWQuY2FsbCh0aGlzLCB0aGlzLmNvbHVtbnMpO1xuXHRcdH1cblx0fSxcblx0XG5cdC8qKlxuXHQgKiBJZiBhIGNvbXBsZXRlIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIHByb3ZpZGVkIGluIHRoZSBvcHRpb25zLCBpbnRlcnByZXQgdGhlIFxuXHQgKiBjb2x1bW5zIGludG8gYSBIaWdoY2hhcnRzIG9wdGlvbnMgb2JqZWN0LlxuXHQgKi9cblx0Y29tcGxldGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcblx0XHR2YXIgY29sdW1ucyA9IHRoaXMuY29sdW1ucyxcblx0XHRcdGZpcnN0Q29sLFxuXHRcdFx0dHlwZSxcblx0XHRcdG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHR2YWx1ZUNvdW50LFxuXHRcdFx0c2VyaWVzLFxuXHRcdFx0ZGF0YSxcblx0XHRcdGksXG5cdFx0XHRqLFxuXHRcdFx0c2VyaWVzSW5kZXg7XG5cdFx0XHRcblx0XHRcblx0XHRpZiAob3B0aW9ucy5jb21wbGV0ZSkge1xuXG5cdFx0XHR0aGlzLmdldENvbHVtbkRpc3RyaWJ1dGlvbigpO1xuXHRcdFx0XG5cdFx0XHQvLyBVc2UgZmlyc3QgY29sdW1uIGZvciBYIGRhdGEgb3IgY2F0ZWdvcmllcz9cblx0XHRcdGlmIChjb2x1bW5zLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0Zmlyc3RDb2wgPSBjb2x1bW5zLnNoaWZ0KCk7XG5cdFx0XHRcdGlmICh0aGlzLmhlYWRlclJvdyA9PT0gMCkge1xuXHRcdFx0XHRcdGZpcnN0Q29sLnNoaWZ0KCk7IC8vIHJlbW92ZSB0aGUgZmlyc3QgY2VsbFxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGZpcnN0Q29sLmlzRGF0ZXRpbWUpIHtcblx0XHRcdFx0XHR0eXBlID0gJ2RhdGV0aW1lJztcblx0XHRcdFx0fSBlbHNlIGlmICghZmlyc3RDb2wuaXNOdW1lcmljKSB7XG5cdFx0XHRcdFx0dHlwZSA9ICdjYXRlZ29yeSc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gR2V0IHRoZSBuYW1lcyBhbmQgc2hpZnQgdGhlIHRvcCByb3dcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh0aGlzLmhlYWRlclJvdyA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbHVtbnNbaV0ubmFtZSA9IGNvbHVtbnNbaV0uc2hpZnQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBVc2UgdGhlIG5leHQgY29sdW1ucyBmb3Igc2VyaWVzXG5cdFx0XHRzZXJpZXMgPSBbXTtcblx0XHRcdGZvciAoaSA9IDAsIHNlcmllc0luZGV4ID0gMDsgaSA8IGNvbHVtbnMubGVuZ3RoOyBzZXJpZXNJbmRleCsrKSB7XG5cblx0XHRcdFx0Ly8gVGhpcyBzZXJpZXMnIHZhbHVlIGNvdW50XG5cdFx0XHRcdHZhbHVlQ291bnQgPSBIaWdoY2hhcnRzLnBpY2sodGhpcy52YWx1ZUNvdW50LmluZGl2aWR1YWxbc2VyaWVzSW5kZXhdLCB0aGlzLnZhbHVlQ291bnQuZ2xvYmFsKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEl0ZXJhdGUgZG93biB0aGUgY2VsbHMgb2YgZWFjaCBjb2x1bW4gYW5kIGFkZCBkYXRhIHRvIHRoZSBzZXJpZXNcblx0XHRcdFx0ZGF0YSA9IFtdO1xuXHRcdFx0XHRmb3IgKGogPSAwOyBqIDwgY29sdW1uc1tpXS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGRhdGFbal0gPSBbXG5cdFx0XHRcdFx0XHRmaXJzdENvbFtqXSwgXG5cdFx0XHRcdFx0XHRjb2x1bW5zW2ldW2pdICE9PSB1bmRlZmluZWQgPyBjb2x1bW5zW2ldW2pdIDogbnVsbFxuXHRcdFx0XHRcdF07XG5cdFx0XHRcdFx0aWYgKHZhbHVlQ291bnQgPiAxKSB7XG5cdFx0XHRcdFx0XHRkYXRhW2pdLnB1c2goY29sdW1uc1tpICsgMV1bal0gIT09IHVuZGVmaW5lZCA/IGNvbHVtbnNbaSArIDFdW2pdIDogbnVsbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh2YWx1ZUNvdW50ID4gMikge1xuXHRcdFx0XHRcdFx0ZGF0YVtqXS5wdXNoKGNvbHVtbnNbaSArIDJdW2pdICE9PSB1bmRlZmluZWQgPyBjb2x1bW5zW2kgKyAyXVtqXSA6IG51bGwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodmFsdWVDb3VudCA+IDMpIHtcblx0XHRcdFx0XHRcdGRhdGFbal0ucHVzaChjb2x1bW5zW2kgKyAzXVtqXSAhPT0gdW5kZWZpbmVkID8gY29sdW1uc1tpICsgM11bal0gOiBudWxsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHZhbHVlQ291bnQgPiA0KSB7XG5cdFx0XHRcdFx0XHRkYXRhW2pdLnB1c2goY29sdW1uc1tpICsgNF1bal0gIT09IHVuZGVmaW5lZCA/IGNvbHVtbnNbaSArIDRdW2pdIDogbnVsbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQWRkIHRoZSBzZXJpZXNcblx0XHRcdFx0c2VyaWVzW3Nlcmllc0luZGV4XSA9IHtcblx0XHRcdFx0XHRuYW1lOiBjb2x1bW5zW2ldLm5hbWUsXG5cdFx0XHRcdFx0ZGF0YTogZGF0YVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGkgKz0gdmFsdWVDb3VudDtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gRG8gdGhlIGNhbGxiYWNrXG5cdFx0XHRvcHRpb25zLmNvbXBsZXRlKHtcblx0XHRcdFx0eEF4aXM6IHtcblx0XHRcdFx0XHR0eXBlOiB0eXBlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNlcmllczogc2VyaWVzXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblx0fSk7XG5cdFxuXHQvLyBSZWdpc3RlciB0aGUgRGF0YSBwcm90b3R5cGUgYW5kIGRhdGEgZnVuY3Rpb24gb24gSGlnaGNoYXJ0c1xuXHRIaWdoY2hhcnRzLkRhdGEgPSBEYXRhO1xuXHRIaWdoY2hhcnRzLmRhdGEgPSBmdW5jdGlvbiAob3B0aW9ucywgY2hhcnRPcHRpb25zKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRhKG9wdGlvbnMsIGNoYXJ0T3B0aW9ucyk7XG5cdH07XG5cblx0Ly8gRXh0ZW5kIENoYXJ0LmluaXQgc28gdGhhdCB0aGUgQ2hhcnQgY29uc3RydWN0b3IgYWNjZXB0cyBhIG5ldyBjb25maWd1cmF0aW9uXG5cdC8vIG9wdGlvbiBncm91cCwgZGF0YS5cblx0SGlnaGNoYXJ0cy53cmFwKEhpZ2hjaGFydHMuQ2hhcnQucHJvdG90eXBlLCAnaW5pdCcsIGZ1bmN0aW9uIChwcm9jZWVkLCB1c2VyT3B0aW9ucywgY2FsbGJhY2spIHtcblx0XHR2YXIgY2hhcnQgPSB0aGlzO1xuXG5cdFx0aWYgKHVzZXJPcHRpb25zICYmIHVzZXJPcHRpb25zLmRhdGEpIHtcblx0XHRcdEhpZ2hjaGFydHMuZGF0YShIaWdoY2hhcnRzLmV4dGVuZCh1c2VyT3B0aW9ucy5kYXRhLCB7XG5cdFx0XHRcdGNvbXBsZXRlOiBmdW5jdGlvbiAoZGF0YU9wdGlvbnMpIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBNZXJnZSBzZXJpZXMgY29uZmlnc1xuXHRcdFx0XHRcdGlmICh1c2VyT3B0aW9ucy5zZXJpZXMpIHtcblx0XHRcdFx0XHRcdGVhY2godXNlck9wdGlvbnMuc2VyaWVzLCBmdW5jdGlvbiAoc2VyaWVzLCBpKSB7XG5cdFx0XHRcdFx0XHRcdHVzZXJPcHRpb25zLnNlcmllc1tpXSA9IEhpZ2hjaGFydHMubWVyZ2Uoc2VyaWVzLCBkYXRhT3B0aW9ucy5zZXJpZXNbaV0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gRG8gdGhlIG1lcmdlXG5cdFx0XHRcdFx0dXNlck9wdGlvbnMgPSBIaWdoY2hhcnRzLm1lcmdlKGRhdGFPcHRpb25zLCB1c2VyT3B0aW9ucyk7XG5cblx0XHRcdFx0XHRwcm9jZWVkLmNhbGwoY2hhcnQsIHVzZXJPcHRpb25zLCBjYWxsYmFjayk7XG5cdFx0XHRcdH1cblx0XHRcdH0pLCB1c2VyT3B0aW9ucyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHByb2NlZWQuY2FsbChjaGFydCwgdXNlck9wdGlvbnMsIGNhbGxiYWNrKTtcblx0XHR9XG5cdH0pO1xuXG59KEhpZ2hjaGFydHMpKTtcbiJdLCJmaWxlIjoicGx1Z2lucy91ZWRpdG9yL3RoaXJkLXBhcnR5L2hpZ2hjaGFydHMvbW9kdWxlcy9kYXRhLnNyYy5qcyJ9
