/************************************************************************
* CORE jTable module                                                    *
*************************************************************************/
(function ($) {

    $.widget("hik.jtable", {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {

            //Options
            actions: {},
            fields: {},
            dialogShowEffect: 'fade',
            dialogHideEffect: 'fade',
            div : {
                errorDialog : null
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
                let fieldName = this._columnList[i];
                let $headerCell = this._createHeaderCellForField(fieldName, this.options.fields[fieldName]);
                $headerCell.appendTo($tr);
            }
        },

        /* Creates a header cell for given field.
        *  Returns th jQuery object.
        *************************************************************************/
        _createHeaderCellForField: function (fieldName, field) {
            if(!field.hidden) {
                return $('<th></th>').html(field.title);
            }
            return $('');
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

        load: function (postData, completeCallback) {
            let self = this;

            let completeReload = function (data) {
                //Show the error message if server returns error
                if (data.Result !== 'OK') {
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
                postData,
                completeReload
            );

        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/
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
            let options = this.options.fields[fieldName];
            if(!options.hidden) {
                return $('<td></td>')
                    .append((this._getDisplayTextForRecordField(record, fieldName)));
            }
            return $();
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
        _addRow: function ($row) {
            //Remove 'no data' row if this is first row
            if (this._$tableRows.length <= 0) {
                this._removeNoDataRow();
            }
            //add as last row
            this._$tableBody.append($row);
            this._$tableRows.push($row);
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
            else if(Array.isArray(fieldValue)){
                return fieldValue.map((element) => {return element.toTable()}).join(' , ')
            }
            else {
                return fieldValue;
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
        let formData = {};
        this.find('[name]').each(function(index, $object) {
            formData[this.name] = $($object).val();
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

        });
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
            if(dataToRunFunction !== undefined) {
                for(let key of Object.keys(dataToRunFunction)) {
                    // used for multi select.
                    if(Array.isArray(dataToRunFunction[key])) {
                        let insertOnKey = [];
                        for(let data of dataToRunFunction[key]) {
                            if(Model.isModel(data)) {
                                data = JSON.parse(data);
                                insertOnKey.push(eval(data.type).fromArray(data));
                            }
                        }
                        dataToRunFunction[key] = insertOnKey;
                    }
                    else if(Model.isModel(dataToRunFunction[key])) {
                        dataToRunFunction[key] = JSON.parse(dataToRunFunction[key]);
                        dataToRunFunction[key] = eval(dataToRunFunction[key].type).fromArray(dataToRunFunction[key]);
                    }
                }
            }

            // Check if async function.
            if(runFunction.constructor.name === 'AsyncFunction') {
                runFunction(dataToRunFunction, dataToRunFunction2)
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

        _responseIsSuccessful : function(response) {
            if (response.Result !== 'OK') {
                this._showError(data.Message);
                this._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                return false;
            }
            return true;
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
            let fieldName = funcParams.fieldName;
            let value = funcParams.value;

            //Get the field
            let field = this.options.fields[fieldName];

            if(field.type === 'selectMultiple') {
                return this._createSelectMultipleForField(field, fieldName);
            } else {
                return this._createTextInputForField(field, fieldName, value);
            }
        },

        _createSelectMultipleForField: function(field, fieldName) {
            let $input = $('<select multiple name="'+fieldName+'"/>');
            for(let key of Object.keys(field.values)) {
                let value = field.values[key] instanceof Model ? field.values[key].toString() : field.values[key];
                $input.append($('<option>'+key+'</option>').val(value));
            }

            return $input.addClass('form-control');
        },

        /**
         * Creates a standard text input field.
         *
         * @param field
         * @param fieldName
         * @param value
         * @private
         */
        _createTextInputForField: function (field, fieldName, value) {
            let $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"/>');
            if (value != undefined) {
                $input.val(value);
            }

            return $input.addClass('form-control');
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
            let self = this;

            let completeAddRecord = function (data) {
                if (!self._responseIsSuccessful(data)) {
                    return;
                }

                if (!data.Record) {
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
            self._saveEditForm($editForm);
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

                // Add key field to form
                if (field.key === true) {
                    $editForm.append($('<input type="hidden" name="' + fieldName + '" id="Edit-' + fieldName + '"/>').val(fieldValue));
                    continue;
                }

                //Do not create element for non-editable fields
                if (field.edit === false) {
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
        _saveEditForm: function ($editForm) {
            let self = this;
            
            let completeEdit = function (data) {
                if (!self._responseIsSuccessful(data)) {
                    return;
                }
                let record = self._$editingRow.data('record');

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
            return record[fieldName];
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

            if (animationsEnabled) {
                let className = 'jtable-row-deleting';

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
