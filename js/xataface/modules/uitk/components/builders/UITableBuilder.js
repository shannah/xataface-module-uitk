/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

//require <xataface/modules/uitk/components/UITable.js>
(function(){
    var $ = jQuery;
   
    var UITable = xataface.modules.uitk.components.UITable;
    var pkg = XataJax.load("xataface.modules.uitk.components.builders");
    pkg.UITableBuilder = UITableBuilder;
    
    function UITableBuilder(o){
        o = o || {};
        this.columns = null;
        this.table = null;
        this.displayColumns = null;
        
        $.extend(this, o);
        
        if ( !this.displayColumns && this.columns ){
            this.displayColumns = this.columns.slice(0);
        }
        
    }
    
    (function(){
        $.extend(UITableBuilder.prototype, {
           build : build 
        });
        
        function build(callback){
            var self = this;
            var q = {
                '-table' : this.table,
                '-action' : 'uitk_build_uitable'
            };
            if ( this.columns ){
                q['--fields'] = this.columns.join(' ');
            } else {
                throw {
                    code : 500,
                    message : 'Attempt to build table with no columns specified'
                };
            }
            $.get(DATAFACE_SITE_HREF, q, function(res){
               if ( res && res.code === 200 ){
                   
                   var table = new UITable({
                       tableName : self.table,
                       columns : res.columns,
                       displayColumns : this.displayColumns
                   });
                   
                   res.table = table;
                   
                   callback.call(self, res);
               } else {
                   $(self).trigger('error', res);
               } 
            });
        }
        
        
    })();
})();
