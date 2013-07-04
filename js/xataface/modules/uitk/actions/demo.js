//require <jquery.packed.js>
//require <xataface/modules/uitk/components/UITable.js>
//require <xataface/modules/uitk/components/UIForm.js>
(function(){

    var $ = jQuery;
    var xataface = window.xataface;
    var UITable = xataface.modules.uitk.components.UITable;
    var UITableController = xataface.modules.uitk.components.UITableController;
    
    $(document).ready(function(){
        var table = new UITable({
            tableName : 'dummy',
            columns : []
        });
        
        
        $('#uitable-wrapper').append(table.el);
        
        $('#uitable-tablename').change(function(){
            table.tableName = $(this).val();
            alert(table.tableName);
            if ( table.columns.length > 0 ){
                $(table.el).remove();
                table.rebuild();
                $('#uitable-wrapper').append(table.el);
                table.refresh(function(){
                    console.log('refreshed');
                });
            }
        });
        
        $('#uitable-columns').change(function(){
            var cols = $(this).val().split(' ');
            console.log(cols);
            var columns = [];
            $(cols).each(function(k,v){
                columns.push({name : v, label : v});
            });
            table.columns = columns;
            if ( table.tableName && table.tableName != 'dummy'  ){
                $(table.el).remove();
                table.rebuild();
                $('#uitable-wrapper').append(table.el);
                table.refresh(function(){
                    console.log('refreshed');
                });
            }
        });
        
    });
    
})();


(function(){
    var $ = jQuery;
    var UITable = xataface.modules.uitk.components.UITable;
    var UITableController = xataface.modules.uitk.components.UITableController;
    var UIForm = xataface.modules.uitk.components.UIForm;
    $(document).ready(function(){
        
        var t1 = new UITable({
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
        var form = new UIForm({
            table : 'profiles',
            fields : ['sfuid','first_name','last_name']
        });
        /*
        $(t1.model).bind('selectionChanged', function(evt, data){
            if ( data.newValue.length == 0 ) return;
            form.query = {
                profile_id : '='+data.newValue[0].profile_id
            };
            form.table = 'profiles';
            form.refresh();
                    
        });
        */
        form.startObservingTable(t1, {profile_id : 'profile_id'});
        
        var t1Ctl = new UITableController({
           table : t1,
           limit : 10
        });
        
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
        $('#profiles-table-wrapper')
                .append(t1Ctl.el)
                .append(t1.el);
        
        var saveButton = $('<button>Save</button>').click(function(){
           form.submit(); 
        });
        
        var dumpButton = $('<button>Dump</button>').click(function(){
           console.log(form.getValues()); 
        });
        
        var newButton = $("<button>New</button>").click(function(){
            form.isNew = 1;
            form.refresh();
        });
        
        $(form).bind('afterSave', function(){
           console.log("Successfully saved"); 
        });
        
        $(form).bind('error', function(evt, data){
           console.log('There was an error: '+data.message); 
        });
        $('#uitk-form-wrapper')
                .append(newButton)
                .append(dumpButton)
                .append(saveButton)
                .append(form.el);
        
        $('#careers-table-wrapper').append(t2.el);
        //t1.refresh();
        t1Ctl.go();
        //t2.refresh();
        
    });
})();

//require <xataface/modules/uitk/components/builders/UITableBuilder.js>
(function(){
    var $ = jQuery;
    var UITableBuilder = xataface.modules.uitk.components.builders.UITableBuilder;
    
    var builder = new UITableBuilder({
       table : 'profiles',
       columns : [
           'profile_id', 'first_name', 'last_name'
       ]
    });
    
    
    builder.build(function(res){
       var table = res.table;
       $(table.el).addClass("striped");
       $('#uitk_uitable_builder_wrapper').append(table.el);
       table.refresh(function(){});
       
    });
    
    
})();