/************************************************************************
* CORE jTable module                                                    *
*************************************************************************/
(function ($) {

    let unloadingPage;
    
    $(window).on('beforeunload', function () {
        unloadingPage = true;
    });
    $(window).on('unload', function () {
        unloadingPage = false;
    });

    $.widget("hik.jtable", {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {

            //Options
            actions: {},
            fields: {},
            animationsEnabled: true,
            defaultDateFormat: 'dd-mm-yyyy',
            dialogShowEffect: 'fade',
            dialogHideEffect: 'fade',
            loadingAnimationDelay: 500,
            saveUserPreferences: true,
            jqueryuiTheme: false,
            unAuthorizedRequestRedirectUrl: null,
            div : {
                errorDialog : null
            },

            ajaxSettings: {
                type: 'POST',
                dataType: 'json'
            },

            toolbar: {
                hoverAnimation: true,
                hoverAnimationDuration: 60,
                hoverAnimationEasing: undefined,
                items: []
            },

            //Localization
            messages: {
                serverCommunicationError: 'An error occured while communicating to the server.',
                notAPromise : 'Not a promise passed to action.',
                noDataAvailable: 'No data available!',
                areYouSure: 'Are you sure?',
                save: 'Save',
                saving: 'Saving',
                cancel: 'Cancel',
                error: 'Error',
                close: 'Close',
                cannotLoadOptionsFor: 'Can not load options for field {0}'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$mainContainer: null, //Reference to the main container of all elements that are created by this plug-in (jQuery object)

        _$table: null, //Reference to the main <table> (jQuery object)
        _$tableBody: null, //Reference to <body> in the table (jQuery object)
        _$tableRows: null, //Array of all <tr> in the table (except "no data" row) (jQuery object array)

        _$busyDiv: null, //Reference to the div that is used to block UI while busy (jQuery object)
        _$busyMessageDiv: null, //Reference to the div that is used to show some message when UI is blocked (jQuery object)
        _$errorDialogDiv: null, //Reference to the error dialog div (jQuery object)

        _columnList: null, //Name of all data columns in the table (select column and command columns are not included) (string array)
        _fieldList: null, //Name of all fields of a record (defined in fields option) (string array)
        _keyField: null, //Name of the key field of a record (that is defined as 'key: true' in the fields option) (string)

        _firstDataColumnOffset: 0, //Start index of first record field in table columns (some columns can be placed before first data column, such as select checkbox column) (integer)
        _lastPostData: null, //Last posted data on load method (object)

        _cache: null, //General purpose cache dictionary (object)

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZATION METHODS                                *
        *************************************************************************/

        /* Contructor.
        *************************************************************************/
        _create: function () {

            this._$errorDialogDiv = this.options.div.errorDialog;

            //Initialization
            this._normalizeFieldsOptions();
            this._initializeFields();
            this._createFieldAndColumnList();

            //Creating DOM elements
            this._$mainContainer = this.element;
            this._createTable();
            this._addNoDataRow();
        },

        /* Normalizes some options for all fields (sets default values).
        *************************************************************************/
        _normalizeFieldsOptions: function () {
            const self = this;
            $.each(self.options.fields, function (fieldName, props) {
                self._normalizeFieldOptions(fieldName, props);
            });
        },

        /* Normalizes some options for a field (sets default values).
        *************************************************************************/
        _normalizeFieldOptions: function (fieldName, props) {
            if (props.listClass == undefined) {
                props.listClass = '';
            }
            if (props.inputClass == undefined) {
                props.inputClass = '';
            }

            //Convert dependsOn to array if it's a comma seperated lists
            if (props.dependsOn && $.type(props.dependsOn) === 'string') {
                const dependsOnArray = props.dependsOn.split(',');
                props.dependsOn = [];
                for (let i = 0; i < dependsOnArray.length; i++) {
                    props.dependsOn.push($.trim(dependsOnArray[i]));
                }
            }
        },

        /* Intializes some private variables.
        *************************************************************************/
        _initializeFields: function () {
            this._lastPostData = {};
            this._$tableRows = [];
            this._columnList = [];
            this._fieldList = [];
            this._cache = [];
        },

        /* Fills _fieldList, _columnList arrays and sets _keyField variable.
        *************************************************************************/
        _createFieldAndColumnList: function () {
            const self = this;

            $.each(self.options.fields, function (name, props) {

                //Add field to the field list
                self._fieldList.push(name);

                //Check if this field is the key field
                if (props.key == true) {
                    self._keyField = name;
                }

                //Add field to column list if it is shown in the table
                if (props.list != false && props.type != 'hidden') {
                    self._columnList.push(name);
                }
            });
        },


        /* Creates the table.
        *************************************************************************/
        _createTable: function () {
            this._$table = $('<table></table>')
                .addClass('table table-striped')
                .appendTo(this._$mainContainer);

            this._createTableHead();
            this._createTableBody();
        },

        /* Creates header (all column headers) of the table.
        *************************************************************************/
        _createTableHead: function () {
            const $thead = $('<thead></thead>')
                .appendTo(this._$table);

            this._addRowToTableHead($thead);
        },

        /* Adds tr element to given thead element
        *************************************************************************/
        _addRowToTableHead: function ($thead) {
            const $tr = $('<tr></tr>')
                .appendTo($thead);

            this._addColumnsToHeaderRow($tr);
        },

        /* Adds column header cells to given tr element.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            for (let i = 0; i < this._columnList.length; i++) {
                const fieldName = this._columnList[i];
                const $headerCell = this._createHeaderCellForField(fieldName, this.options.fields[fieldName]);
                $headerCell.appendTo($tr);
            }
        },

        /* Creates a header cell for given field.
        *  Returns th jQuery object.
        *************************************************************************/
        _createHeaderCellForField: function (fieldName, field) {
            return $('<th></th>').html(field.title);
        },

        /* Creates an empty header cell that can be used as command column headers.
        *************************************************************************/
        _createEmptyCommandHeader: function () {
            return $('<th></th>')
                .css('width', '1%');
        },

        /* Creates tbody tag and adds to the table.
        *************************************************************************/
        _createTableBody: function () {
            this._$tableBody = $('<tbody></tbody>').appendTo(this._$table);
        },


        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Loads data using AJAX call, clears table and fills with new data.
        *************************************************************************/
        load: function (postData, completeCallback) {
            this._lastPostData = postData;
            this._reloadTable(completeCallback);
        },

        /* Refreshes (re-loads) table data with last postData.
        *************************************************************************/
        reload: function (completeCallback) {
            this._reloadTable(completeCallback);
        },

        /* Completely removes the table from it's container.
        *************************************************************************/
        destroy: function () {
            this.element.empty();
            $.Widget.prototype.destroy.call(this);
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Used to change options dynamically after initialization.
        *************************************************************************/
        _setOption: function (key, value) {

        },

        /* LOADING RECORDS  *****************************************************/

        /* Performs an AJAX call to reload data of the table.
        *************************************************************************/
        _reloadTable: function (completeCallback) {
            const self = this;

            const completeReload = function (data) {
                //Show the error message if server returns error
                if (data.Result != 'OK') {
                    self._showError(data.message);
                    return;
                }

                //Re-generate table rows
                self._removeAllRows('reloading');
                self._addRecordsToTable(data.Records);

                //Call complete callback
                if (completeCallback) {
                    completeCallback();
                }
            };

            this._runAsyncCode(
                self.options.actions.listAction,
                self._lastPostData,
                completeReload,
                self._createJtParamsForLoading()
            );
        },


        _createJtParamsForLoading: function() {
            return {
                //Empty as default, paging, sorting or other extensions can override this method to add additional params to load request
            };
        },

        /* TABLE MANIPULATION METHODS *******************************************/

        /* Creates a row from given record
        *************************************************************************/
        _createRowFromRecord: function (record) {
            const $tr = $('<tr></tr>')
                .attr('data-record-key', this._getKeyValueOfRecord(record))
                .data('record', record);

            this._addCellsToRowUsingRecord($tr);
            return $tr;
        },

        /* Adds all cells to given row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            const record = $row.data('record');
            for (let i = 0; i < this._columnList.length; i++) {
                this._createCellForRecordField(record, this._columnList[i])
                    .appendTo($row);
            }
        },

        /* Create a cell for given field.
        *************************************************************************/
        _createCellForRecordField: function (record, fieldName) {
            return $('<td></td>')
                .addClass(this.options.fields[fieldName].listClass)
                .append((this._getDisplayTextForRecordField(record, fieldName)));
        },

        /* Adds a list of records to the table.
        *************************************************************************/
        _addRecordsToTable: function (records) {
            const self = this;

            $.each(records, function (index, record) {
                self._addRow(self._createRowFromRecord(record));
            });

        },

        /* Adds a single row to the table.
        *************************************************************************/
        _addRow: function ($row, options) {
            //Set defaults
            options = $.extend({
                index: this._$tableRows.length,
                isNewRow: false,
                animationsEnabled: true
            }, options);

            //Remove 'no data' row if this is first row
            if (this._$tableRows.length <= 0) {
                this._removeNoDataRow();
            }

            //Add new row to the table according to it's index
            options.index = this._normalizeNumber(options.index, 0, this._$tableRows.length, this._$tableRows.length);
            if (options.index == this._$tableRows.length) {
                //add as last row
                this._$tableBody.append($row);
                this._$tableRows.push($row);
            } else if (options.index == 0) {
                //add as first row
                this._$tableBody.prepend($row);
                this._$tableRows.unshift($row);
            } else {
                //insert to specified index
                this._$tableRows[options.index - 1].after($row);
                this._$tableRows.splice(options.index, 0, $row);
            }

            //Show animation if needed
            if (options.isNewRow) {
                if (this.options.animationsEnabled && options.animationsEnabled) {
                    this._showNewRowAnimation($row);
                }
            }
        },

        /* Shows created animation for a table row
        * TODO: Make this animation cofigurable and changable
        *************************************************************************/
        _showNewRowAnimation: function ($tableRow) {
            let className = 'jtable-row-created';
            if (this.options.jqueryuiTheme) {
                className = className + ' ui-state-highlight';
            }

            $tableRow.addClass(className, 'slow', '', function () {
                $tableRow.removeClass(className, 5000);
            });
        },

        /* Removes a row or rows (jQuery selection) from table.
        *************************************************************************/
        _removeRowsFromTable: function ($rows, reason) {
            const self = this;

            //Check if any row specified
            if ($rows.length <= 0) {
                return;
            }

            //remove from DOM
            $rows.addClass('jtable-row-removed').remove();

            //remove from _$tableRows array
            $rows.each(function () {
                const index = self._findRowIndex($(this));
                if (index >= 0) {
                    self._$tableRows.splice(index, 1);
                }
            });

            //Add 'no data' row if all rows removed from table
            if (self._$tableRows.length == 0) {
                self._addNoDataRow();
            }
        },

        /* Finds index of a row in table.
        *************************************************************************/
        _findRowIndex: function ($row) {
            return this._findIndexInArray($row, this._$tableRows, function ($row1, $row2) {
                return $row1.data('record') == $row2.data('record');
            });
        },

        /* Removes all rows in the table and adds 'no data' row.
        *************************************************************************/
        _removeAllRows: function (reason) {
            //If no rows does exists, do nothing
            if (this._$tableRows.length <= 0) {
                return;
            }

            //Select all rows (to pass it on raising _onRowsRemoved event)
            const $rows = this._$tableBody.find('tr.jtable-data-row');

            //Remove all rows from DOM and the _$tableRows array
            this._$tableBody.empty();
            this._$tableRows = [];

            //Add 'no data' row since we removed all rows
            this._addNoDataRow();
        },

        /* Adds "no data available" row to the table.
        *************************************************************************/
        _addNoDataRow: function () {
            if (this._$tableBody.find('>tr.jtable-no-data-row').length > 0) {
                return;
            }

            const $tr = $('<tr></tr>')
                .addClass('jtable-no-data-row')
                .appendTo(this._$tableBody);

            const totalColumnCount = this._$table.find('thead th').length;
            $('<td></td>')
                .attr('colspan', totalColumnCount)
                .html(this.options.messages.noDataAvailable)
                .appendTo($tr);
        },

        /* Removes "no data available" row from the table.
        *************************************************************************/
        _removeNoDataRow: function () {
            this._$tableBody.find('.jtable-no-data-row').remove();
        },


        /* RENDERING FIELD VALUES ***********************************************/

        /* Gets text for a field of a record according to it's type.
        *************************************************************************/
        _getDisplayTextForRecordField: function (record, fieldName) {
            const field = this.options.fields[fieldName];
            const fieldValue = record[fieldName];

            //if this is a custom field, call display function
            if (field.display) {
                return field.display({ record: record });
            }

            if(fieldValue instanceof Model) {
                return fieldValue.toTable();
            }
            else if(moment.isMoment(fieldValue)) {
                return fieldValue.isValid() ? fieldValue.format('DD/MM/YYYY') : null;
            }

            if (field.type === 'date') {
                return this._getDisplayTextForDateRecordField(field, fieldValue);
            } else if (field.type === 'checkbox') {
                return this._getCheckBoxTextForFieldByValue(fieldName, fieldValue);
            } else if (field.options) { //combobox or radio button list since there are options.
                const options = this._getOptionsForField(fieldName, {
                    record: record,
                    value: fieldValue,
                    source: 'list',
                    dependedValues: this._createDependedValuesUsingRecord(record, field.dependsOn)
                });
                return this._findOptionByValue(options, fieldValue).DisplayText;
            } else { //other types
                return fieldValue;
            }
        },

        /* Creates and returns an object that's properties are depended values of a record.
        *************************************************************************/
        _createDependedValuesUsingRecord: function (record, dependsOn) {
            if (!dependsOn) {
                return {};
            }

            const dependedValues = {};
            for (let i = 0; i < dependsOn.length; i++) {
                dependedValues[dependsOn[i]] = record[dependsOn[i]];
            }

            return dependedValues;
        },

        /* Finds an option object by given value.
        *************************************************************************/
        _findOptionByValue: function (options, value) {
            for (let i = 0; i < options.length; i++) {
                if (options[i].Value == value) {
                    return options[i];
                }
            }

            return {}; //no option found
        },

        /* Gets text for a date field.
        *************************************************************************/
        _getDisplayTextForDateRecordField: function (field, fieldValue) {
            if (!fieldValue) {
                return '';
            }

            const displayFormat = field.displayFormat || this.options.defaultDateFormat;
            const date = this._parseDate(fieldValue);
            return $.datepicker.formatDate(displayFormat, date);
        },

        /* Gets options for a field according to user preferences.
        *************************************************************************/
        _getOptionsForField: function (fieldName, funcParams) {
            const field = this.options.fields[fieldName];
            let optionsSource = field.options;

            if ($.isFunction(optionsSource)) {
                //prepare parameter to the function
                funcParams = $.extend(true, {
                    _cacheCleared: false,
                    dependedValues: {},
                }, funcParams);

                //call function and get actual options source
                optionsSource = optionsSource(funcParams);
            }

            let options;

            //Build options according to it's source type
            if (typeof optionsSource == 'string') { //It is an Url to download options
                const cacheKey = 'options_' + fieldName + '_' + optionsSource; //create a unique cache key
                if (funcParams._cacheCleared || (!this._cache[cacheKey])) {
                    this._sortFieldOptions(this._cache[cacheKey], field.optionsSorting);
                } else {
                    //found on cache..
                    //if this method (_getOptionsForField) is called to get option for a specific value (on funcParams.source == 'list')
                    //and this value is not in cached options, we need to re-download options to get the unfound (probably new) option.
                    if (funcParams.value != undefined) {
                        const optionForValue = this._findOptionByValue(this._cache[cacheKey], funcParams.value);
                        if (optionForValue.DisplayText == undefined) { //this value is not in cached options...
                            this._sortFieldOptions(this._cache[cacheKey], field.optionsSorting);
                        }
                    }
                }

                options = this._cache[cacheKey];
            } else if (jQuery.isArray(optionsSource)) { //It is an array of options
                options = this._buildOptionsFromArray(optionsSource);
                this._sortFieldOptions(options, field.optionsSorting);
            } else { //It is an object that it's properties are options
                options = this._buildOptionsArrayFromObject(optionsSource);
                this._sortFieldOptions(options, field.optionsSorting);
            }

            return options;
        },

        /* Download options for a field from server.
        *************************************************************************/
        /* Sorts given options according to sorting parameter.
        *  sorting can be: 'value', 'value-desc', 'text' or 'text-desc'.
        *************************************************************************/
        _sortFieldOptions: function (options, sorting) {

            if ((!options) || (!options.length) || (!sorting)) {
                return;
            }

            //Determine using value of text
            let dataSelector;
            if (sorting.indexOf('value') == 0) {
                dataSelector = function (option) {
                    return option.Value;
                };
            } else { //assume as text
                dataSelector = function (option) {
                    return option.DisplayText;
                };
            }

            let compareFunc;
            if ($.type(dataSelector(options[0])) == 'string') {
                compareFunc = function (option1, option2) {
                    return dataSelector(option1).localeCompare(dataSelector(option2));
                };
            } else { //asuume as numeric
                compareFunc = function (option1, option2) {
                    return dataSelector(option1) - dataSelector(option2);
                };
            }

            if (sorting.indexOf('desc') > 0) {
                options.sort(function (a, b) {
                    return compareFunc(b, a);
                });
            } else { //assume as asc
                options.sort(function (a, b) {
                    return compareFunc(a, b);
                });
            }
        },

        /* Creates an array of options from given object.
        *************************************************************************/
        _buildOptionsArrayFromObject: function (options) {
            const list = [];

            $.each(options, function (propName, propValue) {
                list.push({
                    Value: propName,
                    DisplayText: propValue
                });
            });

            return list;
        },

        /* Creates array of options from giving options array.
        *************************************************************************/
        _buildOptionsFromArray: function (optionsArray) {
            const list = [];

            for (let i = 0; i < optionsArray.length; i++) {
                if ($.isPlainObject(optionsArray[i])) {
                    list.push(optionsArray[i]);
                } else { //assumed as primitive type (int, string...)
                    list.push({
                        Value: optionsArray[i],
                        DisplayText: optionsArray[i]
                    });
                }
            }

            return list;
        },

        /* Parses given date string to a javascript Date object.
        *  Given string must be formatted one of the samples shown below:
        *  /Date(1320259705710)/
        *  2011-01-01 20:32:42 (YYYY-MM-DD HH:MM:SS)
        *  2011-01-01 (YYYY-MM-DD)
        *************************************************************************/
        _parseDate: function (dateString) {
            if (dateString.indexOf('Date') >= 0) { //Format: /Date(1320259705710)/
                return new Date(
                    parseInt(dateString.substr(6), 10)
                );
            } else if (dateString.length == 10) { //Format: 2011-01-01
                return new Date(
                    parseInt(dateString.substr(0, 4), 10),
                    parseInt(dateString.substr(5, 2), 10) - 1,
                    parseInt(dateString.substr(8, 2), 10)
                );
            } else if (dateString.length == 19) { //Format: 2011-01-01 20:32:42
                return new Date(
                    parseInt(dateString.substr(0, 4), 10),
                    parseInt(dateString.substr(5, 2), 10) - 1,
                    parseInt(dateString.substr(8, 2, 10)),
                    parseInt(dateString.substr(11, 2), 10),
                    parseInt(dateString.substr(14, 2), 10),
                    parseInt(dateString.substr(17, 2), 10)
                );
            } else {
                this._logWarn('Given date is not properly formatted: ' + dateString);
                return 'format error!';
            }
        },


        /* ERROR DIALOG *********************************************************/

        /* Shows error message dialog with given message.
        *************************************************************************/
        _showError: function (message) {
            if(this._$errorDialogDiv !== null) {
                this._$errorDialogDiv.html(message).show();
            }

        },

        /* This method is used to perform AJAX calls in jTable instead of direct
        * usage of jQuery.ajax method.
        *************************************************************************/
        /* Gets value of key field of a record.
        *************************************************************************/
        _getKeyValueOfRecord: function (record) {
            return record[this._keyField];
        },

        });

}(jQuery));


/************************************************************************
* Some UTILITY methods used by jTable                                   *
*************************************************************************/
(function ($) {
    $.fn.form = function() {
        const formData = {};
        this.find('[name]').each(function() {
            formData[this.name] = this.value;
        });
        return formData;
    };

    /**
     * Add support for html in ui dialog title box.
     */
    $.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
        _title: function(title) {
            if (!this.options.title ) {
                title.html("&#160;");
            } else {
                title.html(this.options.title);
            }
        }
    }));

    $.extend(true, $.hik.jtable.prototype, {

        /* Gets property value of an object recursively.
        *************************************************************************/
        _getPropertyOfObject: function (obj, propName) {
            if (propName.indexOf('.') < 0) {
                return obj[propName];
            } else {
                const preDot = propName.substring(0, propName.indexOf('.'));
                const postDot = propName.substring(propName.indexOf('.') + 1);
                return this._getPropertyOfObject(obj[preDot], postDot);
            }
        },

        /* Sets property value of an object recursively.
        *************************************************************************/
        _setPropertyOfObject: function (obj, propName, value) {
            if (propName.indexOf('.') < 0) {
                obj[propName] = value;
            } else {
                const preDot = propName.substring(0, propName.indexOf('.'));
                const postDot = propName.substring(propName.indexOf('.') + 1);
                this._setPropertyOfObject(obj[preDot], postDot, value);
            }
        },

        /* Finds index of an element in an array according to given comparision function
        *************************************************************************/
        _findIndexInArray: function (value, array, compareFunc) {

            //If not defined, use default comparision
            if (!compareFunc) {
                compareFunc = function (a, b) {
                    return a == b;
                };
            }

            for (let i = 0; i < array.length; i++) {
                if (compareFunc(value, array[i])) {
                    return i;
                }
            }

            return -1;
        },

        /* Normalizes a number between given bounds or sets to a defaultValue
        *  if it is undefined
        *************************************************************************/
        _normalizeNumber: function (number, min, max, defaultValue) {
            if (number == undefined || number == null || isNaN(number)) {
                return defaultValue;
            }

            if (number < min) {
                return min;
            }

            if (number > max) {
                return max;
            }

            return number;
        },

        /* Formats a string just like string.format in c#.
        *  Example:
        *  _formatString('Hello {0}','Halil') = 'Hello Halil'
        *************************************************************************/
        _formatString: function () {
            if (arguments.length == 0) {
                return null;
            }

            let str = arguments[0];
            for (let i = 1; i < arguments.length; i++) {
                const placeHolder = '{' + (i - 1) + '}';
                str = str.replace(placeHolder, arguments[i]);
            }

            return str;
        },

        /* Checks if given object is a jQuery Deferred object.
         */
        _isDeferredObject: function (obj) {
            return obj.then && obj.done && obj.fail;
        },

        //Logging methods ////////////////////////////////////////////////////////

        _logDebug: function (text) {
            if (!window.console) {
                return;
            }

            console.log('jTable DEBUG: ' + text);
        },

        _logWarn: function (text) {
            if (!window.console) {
                return;
            }

            console.log('jTable WARNING: ' + text);
        },

        _logError: function (text) {
            if (!window.console) {
                return;
            }

            console.log('jTable ERROR: ' + text);
        }

    });

    /* Fix for array.indexOf method in IE7.
     * This code is taken from http://www.tutorialspoint.com/javascript/array_indexof.htm */
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt) {
            const len = this.length;
            let from = Number(arguments[1]) || 0;
            from = (from < 0)
                 ? Math.ceil(from)
                 : Math.floor(from);
            if (from < 0)
                from += len;
            for (; from < len; from++) {
                if (from in this &&
                    this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

})(jQuery);


/************************************************************************
* FORMS extension for jTable (base for edit/create forms)               *
*************************************************************************/
(function ($) {

    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        _runAsyncCode: function(runFunction, dataToRunFunction, completeFunction, dataToRunFunction2) {
            // Check if async function.
            if(runFunction.constructor.name === 'AsyncFunction') {
                runFunction(dataToRunFunction)
                    .then((data) => {
                        completeFunction({
                            Result : "OK",
                            Record : data
                        });
                    }).catch((message) => {
                    this._showError(message);
                });
            }
            //Check if it's a function.
            else if ($.isFunction(runFunction)) {
                //Execute the function
                let funcResult = runFunction(dataToRunFunction, dataToRunFunction2);

                // Check if it's a promise
                if(funcResult instanceof Promise) {
                    funcResult.then((data) => {
                        completeFunction(data);
                    }).catch((message) => {
                        this._showError(message);
                    });
                }
                else {
                    this._showError(self.options.messages.notAPromise);
                }
            } else {
                this._showError(self.options.messages.notAPromise);
            }
        },

        /* Creates label for an input element.
        *************************************************************************/
        _createInputLabelForRecordField: function (fieldName) {
            const title = this.options.fields[fieldName].inputTitle || this.options.fields[fieldName].title;
            return $('<label for="'+title+'"></label>').html(title);
        },

        /* Creates an input element according to field type.
        *************************************************************************/
        _createInputForRecordField: function (funcParams) {
            const fieldName = funcParams.fieldName;
            let value = funcParams.value;
            const record = funcParams.record,
                formType = funcParams.formType,
                form = funcParams.form;

            //Get the field
            const field = this.options.fields[fieldName];

            //If value if not supplied, use defaultValue of the field
            if (value == undefined || value == null) {
                value = field.defaultValue;
            }

            //Use custom function if supplied
            if (field.input) {
                const $input = $(field.input({
                    value: value,
                    record: record,
                    formType: formType,
                    form: form
                }));

                //Add id attribute if does not exists
                if (!$input.attr('id')) {
                    $input.attr('id', 'Edit-' + fieldName);
                }
                return $input;
            }

            //Create input according to field type
            if (field.type == 'date') {
                return this._createDateInputForField(field, fieldName, value);
            } else if (field.type == 'textarea') {
                return this._createTextAreaForField(field, fieldName, value);
            } else if (field.type == 'password') {
                return this._createPasswordInputForField(field, fieldName, value);
            } else if (field.type == 'checkbox') {
                return this._createCheckboxForField(field, fieldName, value);
            } else if (field.options) {
                if (field.type == 'radiobutton') {
                    return this._createRadioButtonListForField(field, fieldName, value, record, formType);
                } else {
                    return this._createDropDownListForField(field, fieldName, value, record, formType, form);
                }
            } else {
                return this._createTextInputForField(field, fieldName, value);
            }
        },

        //Creates a hidden input element with given name and value.
        _createInputForHidden: function (fieldName, value) {
            if (value == undefined) {
                value = "";
            }

            return $('<input type="hidden" name="' + fieldName + '" id="Edit-' + fieldName + '"></input>')
                .val(value);
        },

        /* Creates a date input for a field.
        *************************************************************************/
        _createDateInputForField: function (field, fieldName, value) {
            const $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            if(value != undefined) {
                $input.val(value);
            }
            
            const displayFormat = field.displayFormat || this.options.defaultDateFormat;
            $input.datepicker({ dateFormat: displayFormat });
            return $('<div />')
                .addClass('jtable-input jtable-date-input')
                .append($input);
        },

        /* Creates a textarea element for a field.
        *************************************************************************/
        _createTextAreaForField: function (field, fieldName, value) {
            const $textArea = $('<textarea class="' + field.inputClass + '" id="Edit-' + fieldName + '" name="' + fieldName + '"></textarea>');
            if (value != undefined) {
                $textArea.val(value);
            }
            
            return $('<div />')
                .addClass('jtable-input jtable-textarea-input')
                .append($textArea);
        },

        /* Creates a standart textbox for a field.
        *************************************************************************/
        _createTextInputForField: function (field, fieldName, value) {
            const $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            if (value != undefined) {
                $input.val(value);
            }
            
            return $input.addClass('form-control');
        },

        /* Creates a password input for a field.
        *************************************************************************/
        _createPasswordInputForField: function (field, fieldName, value) {
            const $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="password" name="' + fieldName + '"></input>');
            if (value != undefined) {
                $input.val(value);
            }
            
            return $('<div />')
                .addClass('jtable-input jtable-password-input')
                .append($input);
        },

        /* Creates a checkboxfor a field.
        *************************************************************************/
        _createCheckboxForField: function (field, fieldName, value) {
            const self = this;

            //If value is undefined, get unchecked state's value
            if (value == undefined) {
                value = self._getCheckBoxPropertiesForFieldByState(fieldName, false).Value;
            }

            //Create a container div
            const $containerDiv = $('<div />')
                .addClass('jtable-input jtable-checkbox-input');

            //Create checkbox and check if needed
            const $checkBox = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="checkbox" name="' + fieldName + '" />')
                .appendTo($containerDiv);
            if (value != undefined) {
                $checkBox.val(value);
            }

            //Create display text of checkbox for current state
            const $textSpan = $('<span>' + (field.formText || self._getCheckBoxTextForFieldByValue(fieldName, value)) + '</span>')
                .appendTo($containerDiv);

            //Check the checkbox if it's value is checked-value
            if (self._getIsCheckBoxSelectedForFieldByValue(fieldName, value)) {
                $checkBox.attr('checked', 'checked');
            }

            //This method sets checkbox's value and text according to state of the checkbox
            const refreshCheckBoxValueAndText = function () {
                const checkboxProps = self._getCheckBoxPropertiesForFieldByState(fieldName, $checkBox.is(':checked'));
                $checkBox.attr('value', checkboxProps.Value);
                $textSpan.html(field.formText || checkboxProps.DisplayText);
            };

            //Register to click event to change display text when state of checkbox is changed.
            $checkBox.click(function () {
                refreshCheckBoxValueAndText();
            });

            //Change checkbox state when clicked to text
            if (field.setOnTextClick != false) {
                $textSpan
                    .addClass('jtable-option-text-clickable')
                    .click(function () {
                        if ($checkBox.is(':checked')) {
                            $checkBox.attr('checked', false);
                        } else {
                            $checkBox.attr('checked', true);
                        }

                        refreshCheckBoxValueAndText();
                    });
            }

            return $containerDiv;
        },

        /* Creates a drop down list (combobox) input element for a field.
        *************************************************************************/
        _createDropDownListForField: function (field, fieldName, value, record, source, form) {

            //Create a container div
            const $containerDiv = $('<div />')
                .addClass('jtable-input jtable-dropdown-input');

            //Create select element
            const $select = $('<select class="' + field.inputClass + '" id="Edit-' + fieldName + '" name="' + fieldName + '"></select>')
                .appendTo($containerDiv);

            //add options
            const options = this._getOptionsForField(fieldName, {
                record: record,
                source: source,
                form: form,
                dependedValues: this._createDependedValuesUsingForm(form, field.dependsOn)
            });

            this._fillDropDownListWithOptions($select, options, value);

            return $containerDiv;
        },
        
        /* Fills a dropdown list with given options.
        *************************************************************************/
        _fillDropDownListWithOptions: function ($select, options, value) {
            $select.empty();
            for (let i = 0; i < options.length; i++) {
                $('<option' + (options[i].Value == value ? ' selected="selected"' : '') + '>' + options[i].DisplayText + '</option>')
                    .val(options[i].Value)
                    .appendTo($select);
            }
        },

        /* Creates depended values object from given form.
        *************************************************************************/
        _createDependedValuesUsingForm: function ($form, dependsOn) {
            if (!dependsOn) {
                return {};
            }

            const dependedValues = {};

            for (let i = 0; i < dependsOn.length; i++) {
                const dependedField = dependsOn[i];

                const $dependsOn = $form.find('select[name=' + dependedField + ']');
                if ($dependsOn.length <= 0) {
                    continue;
                }

                dependedValues[dependedField] = $dependsOn.val();
            }


            return dependedValues;
        },

        /* Creates a radio button list for a field.
        *************************************************************************/
        _createRadioButtonListForField: function (field, fieldName, value, record, source) {
            const $containerDiv = $('<div />')
                .addClass('jtable-input jtable-radiobuttonlist-input');

            const options = this._getOptionsForField(fieldName, {
                record: record,
                source: source
            });

            $.each(options, function(i, option) {
                const $radioButtonDiv = $('<div class=""></div>')
                    .addClass('jtable-radio-input')
                    .appendTo($containerDiv);

                const $radioButton = $('<input type="radio" id="Edit-' + fieldName + '-' + i + '" class="' + field.inputClass + '" name="' + fieldName + '"' + ((option.Value == (value + '')) ? ' checked="true"' : '') + ' />')
                    .val(option.Value)
                    .appendTo($radioButtonDiv);

                const $textSpan = $('<span></span>')
                    .html(option.DisplayText)
                    .appendTo($radioButtonDiv);

                if (field.setOnTextClick != false) {
                    $textSpan
                        .addClass('jtable-option-text-clickable')
                        .click(function () {
                            if (!$radioButton.is(':checked')) {
                                $radioButton.attr('checked', true);
                            }
                        });
                }
            });

            return $containerDiv;
        },

        /* Gets display text for a checkbox field.
        *************************************************************************/
        _getCheckBoxTextForFieldByValue: function (fieldName, value) {
            return this.options.fields[fieldName].values[value];
        },

        /* Returns true if given field's value must be checked state.
        *************************************************************************/
        _getIsCheckBoxSelectedForFieldByValue: function (fieldName, value) {
            return (this._createCheckBoxStateArrayForFieldWithCaching(fieldName)[1].Value.toString() == value.toString());
        },

        /* Gets an object for a checkbox field that has Value and DisplayText
        *  properties.
        *************************************************************************/
        _getCheckBoxPropertiesForFieldByState: function (fieldName, checked) {
            return this._createCheckBoxStateArrayForFieldWithCaching(fieldName)[(checked ? 1 : 0)];
        },

        /* Calls _createCheckBoxStateArrayForField with caching.
        *************************************************************************/
        _createCheckBoxStateArrayForFieldWithCaching: function (fieldName) {
            const cacheKey = 'checkbox_' + fieldName;
            if (!this._cache[cacheKey]) {

                this._cache[cacheKey] = this._createCheckBoxStateArrayForField(fieldName);
            }

            return this._cache[cacheKey];
        },

        /* Creates a two element array of objects for states of a checkbox field.
        *  First element for unchecked state, second for checked state.
        *  Each object has two properties: Value and DisplayText
        *************************************************************************/
        _createCheckBoxStateArrayForField: function (fieldName) {
            const stateArray = [];
            let currentIndex = 0;
            $.each(this.options.fields[fieldName].values, function (propName, propValue) {
                if (currentIndex++ < 2) {
                    stateArray.push({ 'Value': propName, 'DisplayText': propValue });
                }
            });

            return stateArray;
        },

        /* Searches a form for dependend dropdowns and makes them cascaded.
        */
        _makeCascadeDropDowns: function ($form, record, source) {
            const self = this;

            $form.find('select') //for each combobox
                .each(function () {
                    const $thisDropdown = $(this);

                    //get field name
                    let fieldName = $thisDropdown.attr('name');
                    if (!fieldName) {
                        return;
                    }

                    const field = self.options.fields[fieldName];
                    
                    //check if this combobox depends on others
                    if (!field.dependsOn) {
                        return;
                    }

                    //for each dependency
                    $.each(field.dependsOn, function (index, dependsOnField) {
                        //find the depended combobox
                        const $dependsOnDropdown = $form.find('select[name=' + dependsOnField + ']');
                        //when depended combobox changes
                        $dependsOnDropdown.change(function () {

                            //Refresh options
                            const funcParams = {
                                record: record,
                                source: source,
                                form: $form,
                                dependedValues: {}
                            };
                            funcParams.dependedValues = self._createDependedValuesUsingForm($form, field.dependsOn);
                            const options = self._getOptionsForField(fieldName, funcParams);

                            //Fill combobox with new options
                            self._fillDropDownListWithOptions($thisDropdown, options, undefined);

                            //Thigger change event to refresh multi cascade dropdowns.
                            $thisDropdown.change();
                        });
                    });
                });
        },

        /* Updates values of a record from given form
        *************************************************************************/
        _updateRecordValuesFromForm: function (record, $form) {
            for (let i = 0; i < this._fieldList.length; i++) {
                const fieldName = this._fieldList[i];
                const field = this.options.fields[fieldName];

                //Do not update non-editable fields
                if (field.edit == false) {
                    continue;
                }

                //Get field name and the input element of this field in the form
                const $inputElement = $form.find('[name="' + fieldName + '"]');
                if ($inputElement.length <= 0) {
                    continue;
                }

                //Update field in record according to it's type
                if (field.type == 'date') {
                    const dateVal = $inputElement.val();
                    if (dateVal) {
                        const displayFormat = field.displayFormat || this.options.defaultDateFormat;
                        try {
                            const date = $.datepicker.parseDate(displayFormat, dateVal);
                            record[fieldName] = '/Date(' + date.getTime() + ')/';
                        } catch (e) {
                            //TODO: Handle incorrect/different date formats
                            this._logWarn('Date format is incorrect for field ' + fieldName + ': ' + dateVal);
                            record[fieldName] = undefined;
                        }
                    } else {
                        this._logDebug('Date is empty for ' + fieldName);
                        record[fieldName] = undefined; //TODO: undefined, null or empty string?
                    }
                } else if (field.options && field.type == 'radiobutton') {
                    const $checkedElement = $inputElement.filter(':checked');
                    if ($checkedElement.length) {
                        record[fieldName] = $checkedElement.val();
                    } else {
                        record[fieldName] = undefined;
                    }
                } else {
                    record[fieldName] = $inputElement.val();
                }
            }
        },

        /* Sets enabled/disabled state of a dialog button.
        *************************************************************************/
        _setEnabledOfDialogButton: function ($button, enabled, buttonText) {
            if (!$button) {
                return;
            }

            if (enabled != false) {
                $button
                    .removeAttr('disabled')
                    .removeClass('ui-state-disabled');
            } else {
                $button
                    .attr('disabled', 'disabled')
                    .addClass('ui-state-disabled');
            }

            if (buttonText) {
                $button
                    .find('span')
                    .text(buttonText);
            }
        }

    });

})(jQuery);


/************************************************************************
* CREATE RECORD extension for jTable                                    *
*************************************************************************/
(function ($) {

    //Reference to base object members
    const base = {
        _create: $.hik.jtable.prototype._create
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {
            //Localization
            messages: {
                addNewRecord: 'Add'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$addRecordDiv: null, //Reference to the adding new record dialog div (jQuery object)

        /************************************************************************
        * CONSTRUCTOR                                                           *
        *************************************************************************/

        /* Overrides base method to do create-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);

            if (!this.options.actions.createAction) {
                return;
            }


            this._createAddRecordDialogDiv();
        },

        /* Creates and prepares add new record dialog div
        *************************************************************************/
        _createAddRecordDialogDiv: function () {
            const self = this;

            //Create a div for dialog and add to container element
            self._$addRecordDiv = $('<div />')
                .appendTo(self._$mainContainer);

            //Prepare dialog
            self._$addRecordDiv.dialog({
                draggable: false,
                resizable: false,
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                minWidth: $(window).width()*0.4,
                modal: true,
                title: self.options.messages.addNewRecord,
                buttons:
                        [{ //Cancel button
                            text: self.options.messages.cancel,
                            click: function () {
                                self._$addRecordDiv.dialog('close');
                            },
                            class : "btn btn-default"
                        }, { //Save button
                            id: 'AddRecordDialogSaveButton',
                            text: self.options.messages.save,
                            click: function () {
                                self._onSaveClickedOnCreateForm();
                            },
                            class : "btn btn-success"
                        }],
                close: function () {
                    const $addRecordForm = self._$addRecordDiv.find('form').first();
                    const $saveButton = self._$addRecordDiv.parent().find('#AddRecordDialogSaveButton');
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    $addRecordForm.remove();
                }
            });

            // Add create new record button.

            $('<button class="btn btn-success pull-right">'+this.options.messages.addNewRecord+'</button>').appendTo(this._$mainContainer).click(function(e) {
               e.preventDefault();
               self._showAddRecordForm();
            });

        },

        _onSaveClickedOnCreateForm: function () {
            const self = this;

            const $saveButton = self._$addRecordDiv.parent().find('#AddRecordDialogSaveButton');
            const $addRecordForm = self._$addRecordDiv.find('form');

            self._setEnabledOfDialogButton($saveButton, false, self.options.messages.saving);
            self._saveAddRecordForm($addRecordForm, $saveButton);
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Shows add new record dialog form.
        *************************************************************************/
        _showAddRecordForm: function () {
            const self = this;

            //Create add new record form
            const $addRecordForm = $('<form></form>');

            //Create input elements
            for (let i = 0; i < self._fieldList.length; i++) {

                const fieldName = self._fieldList[i];
                const field = self.options.fields[fieldName];

                //Do not create input for fields that is key and not specially marked as creatable
                if (field.key == true && field.create != true) {
                    continue;
                }

                //Do not create input for fields that are not creatable
                if (field.create == false) {
                    continue;
                }

                if (field.type == 'hidden') {
                    $addRecordForm.append(self._createInputForHidden(fieldName, field.defaultValue));
                    continue;
                }

                //Create a container div for this input field and add to form
                const $fieldContainer = $('<div />')
                    .addClass('form-group')
                    .appendTo($addRecordForm);

                //Create a label for input
                $fieldContainer.append(self._createInputLabelForRecordField(fieldName));

                //Create input element
                $fieldContainer.append(
                    self._createInputForRecordField({
                        fieldName: fieldName,
                        formType: 'create',
                        form: $addRecordForm
                    }));
            }

            self._makeCascadeDropDowns($addRecordForm, undefined, 'create');

            $addRecordForm.submit(function () {
                self._onSaveClickedOnCreateForm();
                return false;
            });

            //Open the form
            self._$addRecordDiv.append($addRecordForm).dialog('open');
        },

        /* Saves new added record to the server and updates table.
        *************************************************************************/
        _saveAddRecordForm: function ($addRecordForm, $saveButton) {
            const self = this;

            const completeAddRecord = function (data) {
                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    return;
                }

                if (!data.Record) {
                    self._logError('Server must return the created Record object.');
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    return;
                }

                self._addRow(
                    self._createRowFromRecord(data.Record), {
                        isNewRow: true
                    });
                self._$addRecordDiv.dialog("close");
            };

            this._runAsyncCode(
                self.options.actions.createAction,
                $addRecordForm.form(),
                completeAddRecord
            );
        },
    });

})(jQuery);


/************************************************************************
* EDIT RECORD extension for jTable                                      *
*************************************************************************/
(function ($) {

    //Reference to base object members
    const base = {
        _create: $.hik.jtable.prototype._create,
        _addColumnsToHeaderRow: $.hik.jtable.prototype._addColumnsToHeaderRow,
        _addCellsToRowUsingRecord: $.hik.jtable.prototype._addCellsToRowUsingRecord
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {
            //Localization
            messages: {
                editRecord: 'Edit'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$editDiv: null, //Reference to the editing dialog div (jQuery object)
        _$editingRow: null, //Reference to currently editing row (jQuery object)

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZATION METHODS                                *
        *************************************************************************/

        /* Overrides base method to do editing-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);
            if (!this.options.actions.updateAction) {
                return;
            }
            this._createEditDialogDiv();
        },

        /* Creates and prepares edit dialog div
        *************************************************************************/
        _createEditDialogDiv: function () {
            const self = this;

            //Create a div for dialog and add to container element
            self._$editDiv = $('<div></div>')
                .appendTo(self._$mainContainer);

            //Prepare dialog
            self._$editDiv.dialog({
                draggable: false,
                resizable: false,
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                minWidth: $(window).width()*0.4,
                modal: true,
                title: self.options.messages.editRecord,
                buttons:
                        [{  //cancel button
                            text: self.options.messages.cancel,
                            click: function () {
                                self._$editDiv.dialog('close');
                            },
                            class : "btn btn-default"
                        }, { //save button
                            id: 'EditDialogSaveButton',
                            text: self.options.messages.save,
                            click: function () {
                                self._onSaveClickedOnEditForm();
                            },
                            class : "btn btn-success"
                        }],
                close: function () {
                    const $editForm = self._$editDiv.find('form:first');
                    const $saveButton = self._$editDiv.parent().find('#EditDialogSaveButton');
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    $editForm.remove();
                }
            });
        },

        /* Saves editing form to server.
        *************************************************************************/
        _onSaveClickedOnEditForm: function () {
            const self = this;
            
            //row maybe removed by another source, if so, do nothing
            if (self._$editingRow.hasClass('jtable-row-removed')) {
                self._$editDiv.dialog('close');
                return;
            }

            const $saveButton = self._$editDiv.parent().find('#EditDialogSaveButton');
            const $editForm = self._$editDiv.find('form');
            self._setEnabledOfDialogButton($saveButton, false, self.options.messages.saving);
            self._saveEditForm($editForm, $saveButton);
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to add a 'editing column cell' to header row.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            base._addColumnsToHeaderRow.apply(this, arguments);
            if (this.options.actions.updateAction != undefined) {
                $tr.append(this._createEmptyCommandHeader());
            }
        },

        /* Overrides base method to add a 'edit command cell' to a row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            const self = this;
            base._addCellsToRowUsingRecord.apply(this, arguments);

            if (self.options.actions.updateAction != undefined) {
                const $button = $('<button title="' + self.options.messages.editRecord + '"></button>')
                    .addClass('btn btn-warning')
                    .html(self.options.messages.editRecord)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._showEditForm($row);
                    });
                $('<td></td>')
                    .append($button)
                    .appendTo($row);
            }
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Shows edit form for a row.
        *************************************************************************/
        _showEditForm: function ($tableRow) {
            const self = this;
            const record = $tableRow.data('record');

            //Create edit form
            const $editForm = $('<form></form>');

            //Create input fields
            for (let i = 0; i < self._fieldList.length; i++) {

                const fieldName = self._fieldList[i];
                const field = self.options.fields[fieldName];
                const fieldValue = record[fieldName];

                if (field.key == true) {
                    if (field.edit != true) {
                        //Create hidden field for key
                        $editForm.append(self._createInputForHidden(fieldName, fieldValue));
                        continue;
                    } else {
                        //Create a special hidden field for key (since key is be editable)
                        $editForm.append(self._createInputForHidden('jtRecordKey', fieldValue));
                    }
                }

                //Do not create element for non-editable fields
                if (field.edit == false) {
                    continue;
                }

                //Hidden field
                if (field.type == 'hidden') {
                    $editForm.append(self._createInputForHidden(fieldName, fieldValue));
                    continue;
                }

                //Create a container div for this input field and add to form
                const $fieldContainer = $('<div class="form-group"></div>').appendTo($editForm);

                //Create a label for input
                $fieldContainer.append(self._createInputLabelForRecordField(fieldName));

                //Create input element with it's current value
                const currentValue = self._getValueForRecordField(record, fieldName);
                $fieldContainer.append(
                    self._createInputForRecordField({
                        fieldName: fieldName,
                        value: currentValue,
                        record: record,
                        formType: 'edit',
                        form: $editForm
                    }));
            }
            
            self._makeCascadeDropDowns($editForm, record, 'edit');

            $editForm.submit(function () {
                self._onSaveClickedOnEditForm();
                return false;
            });

            //Open dialog
            self._$editingRow = $tableRow;
            self._$editDiv.append($editForm).dialog('open');
        },

        /* Saves editing form to the server and updates the record on the table.
        *************************************************************************/
        _saveEditForm: function ($editForm, $saveButton) {
            const self = this;
            
            const completeEdit = function (data) {

                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    return;
                }
                const record = self._$editingRow.data('record');

                self._updateRecordValuesFromForm(record, $editForm);
                self._updateRecordValuesFromServerResponse(record, data);
                self._updateRowTexts(self._$editingRow);


                self._$editingRow.attr('data-record-key', self._getKeyValueOfRecord(record));
                self._$editDiv.dialog("close");
            };

            this._runAsyncCode(
                self.options.actions.updateAction,
                $editForm.form(),
                completeEdit,
                self._$editingRow.data('record')
            );
        },

        /* This method ensures updating of current record with server response,
        * if server sends a Record object as response to updateAction.
        *************************************************************************/
        _updateRecordValuesFromServerResponse: function (record, serverResponse) {
            if (!serverResponse || !serverResponse.Record) {
                return;
            }

            $.extend(true, record, serverResponse.Record);
        },

        /* Gets text for a field of a record according to it's type.
        *************************************************************************/
        _getValueForRecordField: function (record, fieldName) {
            const field = this.options.fields[fieldName];
            const fieldValue = record[fieldName];
            if (field.type == 'date') {
                return this._getDisplayTextForDateRecordField(field, fieldValue);
            } else {
                return fieldValue;
            }
        },

        /* Updates cells of a table row's text values from row's record values.
        *************************************************************************/
        _updateRowTexts: function ($tableRow) {
            const record = $tableRow.data('record');
            const $columns = $tableRow.find('td');
            for (let i = 0; i < this._columnList.length; i++) {
                let displayItem = this._getDisplayTextForRecordField(record, this._columnList[i]);
                if ((displayItem != "") && (displayItem == 0)) displayItem = "0";
                $columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
            }
        },
    });

})(jQuery);


/************************************************************************
* DELETION extension for jTable                                         *
*************************************************************************/
(function ($) {

    //Reference to base object members
    const base = {
        _create: $.hik.jtable.prototype._create,
        _addColumnsToHeaderRow: $.hik.jtable.prototype._addColumnsToHeaderRow,
        _addCellsToRowUsingRecord: $.hik.jtable.prototype._addCellsToRowUsingRecord
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {

            //Options
            deleteConfirmation: true,

            //Events
            recordDeleted: function (event, data) { },

            //Localization
            messages: {
                deleteConfirmation: 'This record will be deleted. Are you sure?',
                deleteText: 'Delete',
                deleting: 'Deleting',
                canNotDeletedRecords: 'Can not delete {0} of {1} records!',
                deleteProggress: 'Deleting {0} of {1} records, processing...'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$deleteRecordDiv: null, //Reference to the adding new record dialog div (jQuery object)
        _$deletingRow: null, //Reference to currently deleting row (jQuery object)

        /************************************************************************
        * CONSTRUCTOR                                                           *
        *************************************************************************/

        /* Overrides base method to do deletion-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);
            this._createDeleteDialogDiv();
        },

        /* Creates and prepares delete record confirmation dialog div.
        *************************************************************************/
        _createDeleteDialogDiv: function () {
            const self = this;

            //Check if deleteAction is supplied
            if (!self.options.actions.deleteAction) {
                return;
            }

            //Create div element for delete confirmation dialog
            self._$deleteRecordDiv = $('<div><span class="delete-confirm-message"></span></div>').appendTo(self._$mainContainer);

            //Prepare dialog
            self._$deleteRecordDiv.dialog({
                draggable: false,
                resizable: false,
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                modal: true,
                title: '<i class="fa fa-exclamation-triangle"></i> '+self.options.messages.areYouSure,
                buttons:
                        [{  //cancel button
                            text: self.options.messages.cancel,
                            click: function () {
                                self._$deleteRecordDiv.dialog("close");
                            },
                            class : 'btn btn-default'
                        }, {//delete button
                            id: 'DeleteDialogButton',
                            class : 'btn btn-danger',
                            text: self.options.messages.deleteText,
                            click: function () {

                                //row maybe removed by another source, if so, do nothing
                                if (self._$deletingRow.hasClass('jtable-row-removed')) {
                                    self._$deleteRecordDiv.dialog('close');
                                    return;
                                }

                                const $deleteButton = self._$deleteRecordDiv.parent().find('#DeleteDialogButton');
                                self._setEnabledOfDialogButton($deleteButton, false, self.options.messages.deleting);
                                self._deleteRecordFromServer(
                                    self._$deletingRow,
                                    function () {
                                        self._removeRowsFromTableWithAnimation(self._$deletingRow);
                                        self._$deleteRecordDiv.dialog('close');
                                    },
                                    function (message) { //error
                                        self._showError(message);
                                        self._setEnabledOfDialogButton($deleteButton, true, self.options.messages.deleteText);
                                    }
                                );
                            }
                        }],
                close: function () {
                    const $deleteButton = self._$deleteRecordDiv.parent().find('#DeleteDialogButton');
                    self._setEnabledOfDialogButton($deleteButton, true, self.options.messages.deleteText);
                }
            });
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to add a 'deletion column cell' to header row.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            base._addColumnsToHeaderRow.apply(this, arguments);
            if (this.options.actions.deleteAction != undefined) {
                $tr.append(this._createEmptyCommandHeader());
            }
        },

        /* Overrides base method to add a 'delete command cell' to a row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            base._addCellsToRowUsingRecord.apply(this, arguments);

            const self = this;
            if (self.options.actions.deleteAction != undefined) {
                const $span = $('<span></span>').html(self.options.messages.deleteText);
                const $button = $('<button title="' + self.options.messages.deleteText + '"></button>')
                    .addClass('btn btn-danger')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._deleteButtonClickedForRow($row);
                    });

                $('<td></td>')
                    .append($button)
                    .appendTo($row);
            }
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* This method is called when user clicks delete button on a row.
        *************************************************************************/
        _deleteButtonClickedForRow: function ($row) {
            const self = this;

            let deleteConfirm;
            let deleteConfirmMessage = self.options.messages.deleteConfirmation;

            //If options.deleteConfirmation is function then call it
            if ($.isFunction(self.options.deleteConfirmation)) {
                const data = {
                    row: $row,
                    record: $row.data('record'),
                    deleteConfirm: true,
                    deleteConfirmMessage: deleteConfirmMessage,
                    cancel: false,
                    cancelMessage: null
                };
                self.options.deleteConfirmation(data);

                //If delete progress is cancelled
                if (data.cancel) {

                    //If a canlellation reason is specified
                    if (data.cancelMessage) {
                        self._showError(data.cancelMessage); //TODO: show warning/stop message instead of error (also show warning/error ui icon)!
                    }

                    return;
                }

                deleteConfirmMessage = data.deleteConfirmMessage;
                deleteConfirm = data.deleteConfirm;
            } else {
                deleteConfirm = self.options.deleteConfirmation;
            }

            if (deleteConfirm != false) {
                //Confirmation
                self._$deleteRecordDiv.find('.delete-confirm-message').html(deleteConfirmMessage);
                self._showDeleteDialog($row);
            } else {
                //No confirmation
                self._deleteRecordFromServer(
                    $row,
                    function () { //success
                        self._removeRowsFromTableWithAnimation($row);
                    },
                    function (message) { //error
                        self._showError(message);
                    }
                );
            }
        },

        /* Shows delete comfirmation dialog.
        *************************************************************************/
        _showDeleteDialog: function ($row) {
            this._$deletingRow = $row;
            this._$deleteRecordDiv.dialog('open');
        },

        /* Performs an ajax call to server to delete record
        *  and removes row of the record from table if ajax call success.
        *************************************************************************/
        _deleteRecordFromServer: function ($row, success, error, url) {
            const self = this;

            const completeDelete = function (data) {
                if (data.Result != 'OK') {
                    $row.data('deleting', false);
                    if (error) {
                        error(data.Message);
                    }

                    return;
                }

                self._trigger("recordDeleted", null, {record: $row.data('record'), row: $row, serverResponse: data});

                if (success) {
                    success(data);
                }
            };

            //Check if it is already being deleted right now
            if ($row.data('deleting') == true) {
                return;
            }

            $row.data('deleting', true);

            const postData = {};
            postData[self._keyField] = self._getKeyValueOfRecord($row.data('record'));

            this._runAsyncCode(
                self.options.actions.deleteAction,
                postData,
                completeDelete,
                $row.data('record')
            );
        },

        /* Removes a row from table after a 'deleting' animation.
        *************************************************************************/
        _removeRowsFromTableWithAnimation: function ($rows, animationsEnabled) {
            const self = this;

            if (animationsEnabled == undefined) {
                animationsEnabled = self.options.animationsEnabled;
            }

            if (animationsEnabled) {
                let className = 'jtable-row-deleting';
                if (this.options.jqueryuiTheme) {
                    className = className + ' ui-state-disabled';
                }

                //Stop current animation (if does exists) and begin 'deleting' animation.
                $rows.stop(true, true).addClass(className, 'slow', '').promise().done(function () {
                    self._removeRowsFromTable($rows, 'deleted');
                });
            } else {
                self._removeRowsFromTable($rows, 'deleted');
            }
        }

    });

})(jQuery);
