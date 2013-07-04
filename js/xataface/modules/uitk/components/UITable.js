//require <jquery.packed.js>
//require <xataface/view/TableView.js>
//require <xataface/store/ResultSet.js>
//require <xataface/model/ListModel.js>
//require <xataface/modules/uitk/components/UITable/jquery.fixedheadertable.js>
//require-css <xataface/modules/uitk/components/UITable.css>

(function(){
    
    // Class imports-----------------------------------------------------------
    var $ = jQuery;
    var TableView = xataface.view.TableView;
    var ResultSet = xataface.store.ResultSet;
    var ListModel = xataface.model.ListModel;
    var Model = xataface.model.Model;
    
    // END Class imports-------------------------------------------------------

    // Load the components namespace
    var pkg = XataJax.load('xataface.modules.uitk.components');
    pkg.UITable = UITable;
    
    // A static counter to increment table id each time a UITable is created.
    var counter = 0;
    
    
    // Class Constructor-------------------------------------------------------
    /**
     * @class xataface.modules.uitk.components.UITable
     * @memberOf xataface.modules.uitk.components
     * @param {Object} o Input parameters
     * @param {String} o.tableName The name of the table that this component displays.  
     *  This should be the name of the table inside the database.
     * @param {Array} o.columns An array of objects describing the columns to be 
     *  included.  Each object contains two keys: name and label.
     * @param {boolean} o.fixedHeaders Whether to use fixed table headers for scrolling.
     *  Default is false.
     * @param {Array} o.displayColumns An array of string names of the columns to be
     * displayed.  If this is omitted, then all of the columns in o.columns will 
     * be displayed.
     * @returns {xataface.modules.uitk.components.UITable}
     * 
     * @example
     * var t1 = new UITable({
            tableName : 'profiles',
            columns : [
                { name : 'profile_id', label : 'Profile ID'},
                { name : 'first_name', label : 'First Name'},
                { name : 'last_name', label : 'Last Name'}
            ],
            displayColumns : [ 'first_name', 'last_name'],
            fixedHeaders : true
        });
        
        t1.registerSearchField($('#profile-search').get(0), '-search');
        
        var t2 = new UITable({
            tableName : 'careers',
            columns : [
            
                { name : 'activity', label : 'Activity'},
                { name : 'department_1', label : 'Department 1'},
                { name : 'department_2', label : 'Department 2'},
                { name : 'rank', label : 'Rank'},
                { name : 'semester', label : 'Semester'}
            ],
            fixedHeaders : true
        });
        
        t2.startObservingTable(t1, {profile_id : 'profile_id'});
        t2.registerSearchField($('#career-search').get(0), '-search'); 
        $(t1.el).addClass('striped'); 
        $('#profiles-table-wrapper').append(t1.el);
        $('#careers-table-wrapper').append(t2.el);
        t1.refresh();
     */
    function UITable(o){
        var self = this;
        
        /**
         * The unique id of this table.
         * @type String
         */
        this.tableId = counter++;
        
        /**
         * The name of the database table that is being redered by this component.
         * @type String 
         */
        this.tableName = o.tableName;
        
        /**
         * Array of column descriptors listing the columns that are included
         * in the result set.
         * @type Array
         */
        this.columns = o.columns;
        
        /**
         * Whether to use fixed headers when scrolling the table.
         * @type Boolean
         */
        this.fixedHeaders = o.fixedHeaders || false;
        
        /**
         * Array of string column names to be displayed in the table.
         * @type Array
         */
        this.displayColumns = o.displayColumns || [];
        if ( this.displayColumns.length === 0 ){
            $(this.columns).each(function(k,v){
                self.displayColumns.push(v.name);
            });
        }
        
        /**
         * The <table> tag element for this table.
         * @type HTMLElement
         */
        this.el = null;
        
        /**
         * The model for the table's data.
         * @type xataface.model.ListModel
         */
        this.model = null;
        
        /**
         * The view for the table.
         * @type xataface.view.TableView
         */
        this.view = null;
        
        /**
         * The result set used to load the data into the model.
         * @type xataface.store.ResultSet
         */
        this.resultSet = null;
        
        
        this.width = o.width || '300px';
        this.height = o.height || '400px';
        
        this.rebuild();
        
        
        
        
    }
    
    // PRIVATE CLASS NAMESPACE ------------------------------------------------
    (function(){
        
        // DEFINE Class Public Interface
        $.extend(UITable.prototype, {
            
            createTableTemplate : createTableTemplate,
            registerSearchField : registerSearchField,
            refresh : refresh,
            rebuild : rebuild,
            update : update,
            showColumn : showColumn,
            hideColumn : hideColumn,
            addColumn : addColumn,
            removeColumn : removeColumn,
            containsColumn : containsColumn,
            startObservingTable : startObservingTable,
            stopObservingTable : stopObservingTable
            
        });
        
        
        // Method Definitions --------------------------------------------------
        
        /**
         * @name createTableTemplate
         * @memberOf xataface.modules.uitk.components.UITable#
         * @description Creates a <table> element template for this table based
         * on the description of the columns that are to be included.
         * @returns {HTMLElement} The <table> element.
         */
        function createTableTemplate(){
            var thtr = $('<tr>');
            var tbtr = $('<tr>');
            $(this.columns).each(function(k, col){
                var span = $('<span>').text(col.label);
                var th = $('<th>')
                    .attr('data-column-name', col.name)
                    .append(span);
                    
                thtr.append(th);
                
                span = $('<span>')
                    .attr('data-kvc', col.name ).text('Placeholder');
                    
                var td = $('<td>')
                        .attr('data-column-name', col.name)
                        .append(span);
                tbtr.append(td);
            });
            
            var thead = $('<thead>').append(thtr);
            var tbody = $('<tbody>').append(tbtr);
            
            var table = $('<table>')
                .addClass('uitk-uitable')
                .append(thead)
                .append(tbody);
            
            return table;
                
        }
        
        /**
         * @name rebuild
         * @memberOf xataface.modules.uitk.components.UITable#
         * @description Rebuilds the table after columns have been added or
         * removed.
         * @function
         * @returns {void}
         */
        function rebuild(){
            this.el = this.createTableTemplate();
            this.model = new ListModel();
            this.view = new TableView({
                el : this.el,
                model : this.model
            });
           
            
            
            var flds = [];
            $(this.columns).each(function(k,v){
                flds.push(v.name);
            });
            
           
            this.resultSet = new ResultSet({
                model : this.model,
                query : {
                    '-table' : this.tableName,
                    '-action' : 'export_json',
                    '--fields' : flds.join(' ')
                }
            });
            
            $(this).trigger('afterBuild');
            
        }
        
        /**
         * @name registerSearchField
         * @memberOf xataface.modules.uitk.components.UITable#
         * @function
         * @description Binds a text field to the table for searching.  This will
         * cause the text field to be monitored for changes and the table will
         * be filtered on a specified column accordingly.
         * @param {HTMLElement} fld An input field that will be monitored for changes.
         * @param {String} colName The name of the column that this field should be bound
         *  to for filtering.
         * @returns {void}
         */
        function registerSearchField(/*HTMLElement*/ fld, /*String*/colName){
            var self = this;
            $(fld).bind('change.UITable', function(){
                self.resultSet.query[colName] = $(fld).val();
                $(self).trigger('queryChanged.UITable');
                self.refresh();
            });
        }
        
        /**
         * @name startObservingTable
         * @memberOf xataface.modules.uitk.components.UITable#
         * @function
         * @param {xataface.modules.uitk.components.UITable} table Another table to observer
         *  for selection events.  When that table fires a selectionChanged event, the 
         *  result set of this table will be updated with a new filter according to the 
         *  associated mapping object.
         * @param {Object} mapping
         * @returns {void}
         */
        function startObservingTable(/*UITable*/ table, /*Object*/ mapping){
            var self = this;
            $(table.model).bind('selectionChanged.UITable.'+this.tableId, function(evt, data){
                for ( var k in mapping ){
                    self.resultSet.query[k] = '='+Model.wrap(data.newValue[0]).get(mapping[k]);
                }
                self.refresh();
            });
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UITable#
         * @description Stops observing another table for selection changes.  This
         * is the inverse operation of the startObservingTable() method.
         * @param {xataface.modules.uitk.components.UITable} table Another table to stop
         * observing.
         * @returns {void}
         */
        function stopObservingTable(/*UITable*/ table){
            $(table.model).unbind('selectionChanged.UITable.'+this.tableId);
        }
        
        /**
         * @function
         * @name refresh
         * @memberOf xataface.modules.uitk.components.UITable#
         * @description Reloads data from the database using the currrent result
         * set settings (and filters).  After the data has been reloaded, update()
         * is called.
         * @param {Function} callback
         * @returns {void}
         */
        function refresh(callback){
            var self = this;
            callback = callback || function(){};
            this.resultSet.load(function(){
                callback.call(self);
                self.update();
            });
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UITable#
         * @name addColumn
         * @description Adds a column to the table.  This will both add a column
         * to be loaded and the column to be displayed.  After adding the column
         * you should call rebuild() to rebuild the template and refresh the 
         * data set with the new set of columns.
         * @param {Object} colDescriptor The column descriptor
         * @param {String} colDescriptor.name The name of the column.
         * @param {String} colDescriptor.label The label for the column (displayed in the header).
         * @returns {void}
         */
        function addColumn(colDescriptor){
            if ( !this.containsColumn(colDescriptor.name) ){
                this.columns.push(colDescriptor);
                this.displayColumns.push(colDescriptor.name);
            }
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UITable#
         * @name removeColumn
         * @description Removes a column from the set of columns.  You should
         * call rebuild() after removing columns to update the template.
         * @param {String} colName The name of the column to remove.
         * @returns {void}
         */
        function removeColumn(colName){
            var index = -1;

            for ( var c in this.columns ){
                if ( this.columns[c].name === colName ){
                    index = c;
                    break;
                }
            }
            
            if ( index >= 0 ){
                this.columns.splice(index,1);
            }
            
            index = this.displayColumns.indexOf(colName);
            if ( index >= 0 ){
                this.displayColumns.splice(index,1);
            }
        }
        
        /**
         * @function
         * @name showColumn
         * @memberOf xataface.modules.uitk.components.UITable#
         * @description Show a column that was previously hidden.  For this to 
         * work, the column should be included in the columns list, but not
         * in the displayColumns list.  This will effectively add the column
         * to the displayColumns list.  After calling this, you should call 
         * update() to re-render the table.
         * @param {String} colName The nname of the column to show.
         * @returns {void}
         */
        function showColumn(colName){
            if ( !this.containsColumn(colName) ){
                throw {
                    code : 404,
                    message : 'Column '+colName+' not found.'
                };
            }
            
            var index = this.displayColumns.indexOf(colName);
            if ( index === -1 ){
                
                this.displayColumns.push(colName);
            }
        }
        
        /**
         * @function
         * @name hideColumn
         * @memberOf xataface.modules.uitk.components.UITable#
         * @description Hides a column so that it won't be displayed.  However
         * the column will still be loaded.  You should call update() after
         * this to has the UI reflect the change.
         * @param {String} colName The name of the column to hide.
         * @returns {void}
         */
        function hideColumn(colName){
            var index = this.displayColumns.indexOf(colName);
            if ( index >= 0 ){
                this.displayColumns.splice(index,1);
            }
        }
        
        /**
         * @function 
         * @name containsColumn
         * @description Checks to see if this table contains a given column (by name).
         * 
         * @param {String} colName The name of a column to check.
         * @returns {Boolean} True if the table contains the specified column.  
         * It doesn't require that the column be visible, just that the column 
         * is loaded as part of the result set.
         */
        function containsColumn(colName){
            var found = false;
            for ( var c in this.columns ){
                if ( c.name === colName ){
                    return true;
                }
            }
            return false;
        }
        
        /**
         * @name update
         * @memberOf xataface.modules.uitk.components.UITable#
         * @description Updates the view of the table to reflect the current
         * displayed columns etc..
         * @returns {void}
         */
        function update(){
            var index = {};
            $(this.displayColumns).each(function(k,v){
                index[v] = true;
            });
            
            $('[data-column-name]', this.el).each(function(){
                var colName = $(this).attr('data-column-name');
                if ( !index[colName] ){
                    $(this).addClass('hidden');
                } else {
                    $(this).removeClass('hidden');
                }
            });
            
            if ( this.fixedHeaders ){
                $(this.el).fixedHeaderTable({
                    width : this.width ? this.width : "300px",
                    height: this.height ? this.height : "400px",
                    autoShow : true
                });
            } else {
                $(this.el).fixedHeaderTable('destroy');
            }
        }
        
    })();
    
    
    // END UITable-------------------------------------------------------------
    
    // Start UITable.Controller -----------------------------------------------
    
    pkg.UITableController = UITableController;
    
    
    /**
     * @name UITableController
     * @memberOf xataface.modules.uitk.components.UITable
     * @class xataface.modules.uitk.components.UITable.UITableController
     */
    function UITableController(o) {
        o = o || {};
        this.limit = 50;
        
        this.pages = 10;
        this.currPage = 0;
        
        
        this.table = o.table;
        $.extend(this, o);
        this.el = this.createElement();
        
        
        
    }
    
    
    (function(){
        $.extend(UITableController.prototype, {
           createElement : createElement,
           go : go,
           goFirst : goFirst,
           goPrev : goPrev,
           goNext : goNext,
           goLast : goLast
        });
        
        
        function createElement(){
            var div = $('<div>').addClass('uitk-UITable-UITableController');
            var firstButton = $('<button>')
                .addClass('first-btn')
                .append($('<span>&laquo;</span>'))
                .click(this.goFirst.bind(this))
                ;
            var prevButton = $('<button>')
                .addClass('prev-btn')
                .append($('<span>&lt;</span>'))
                .click(this.goPrev.bind(this))
            ;
        
            var nextButton = $('<button>')
                .addClass('next-btn')
                .append($('<span>&gt;</span>'))
                .click(this.goNext.bind(this))
            ;
        
            var lastButton = $('<button>')
                .addClass('last-btn')
                .append($('<span>&raquo;</span>'))
                .click(this.goLast.bind(this))
            ;
            
            div.append(firstButton)
                .append(prevButton)
                .append(nextButton)
                .append(lastButton);
        
            return div;
        
        }
        
        function go(){
            this.table.resultSet.query['-skip'] = this.currPage*this.limit;
            this.table.resultSet.query['-limit'] = this.limit;
            this.table.resultSet.query['--stats'] = 1;
            this.table.refresh();
        }
        
        function goFirst(){
            this.currPage = 0;
            this.go();
            
        }
        
        function goLast(){
            var found = this.table.resultSet.found || this.limit;
            this.currPage = Math.ceil((found-this.limit)/this.limit)-1;
            this.go();
            
        }
        
        function goNext(){
            this.currPage++;
            this.go();
        }
        
        function goPrev(){
            this.currPage--;
            this.go();
        }
        
        
    })();
    
})();