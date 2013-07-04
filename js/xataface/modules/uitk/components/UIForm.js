/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

//require <jquery.packed.js>
//require <xataface/model/Model.js>
(function(){
    var $ = jQuery;
    var Model = xataface.model.Model;
    var pkg = XataJax.load('xataface.modules.uitk.components');
    pkg.UIForm = UIForm;
    
    var counter = 0;
    
    function UIForm(/*Object*/ o){
        this.formId = counter++;
        o = o || {};
        var self = this;
        this.table = null;
        this.query = {};
        this.fields = null;
        this.isNew = false;
        this.showHeadings = true;
        this.showSubheadings = true;
        this.showInternalSubmitButtons = true;
        this.addCancelButton = true;
        this._changed = false;
        this._submitting = false;
        this.cancelAction = this.refresh;
        
        
        
        $.extend(this, o);
        
       
        
        this.el = $('<iframe>')
            .css({
                width : '500px',
                height : '500px'
            })
            .attr('allowTransparency', true)
            .load(function(){
                var url = this.contentWindow.location.search;
                if ( url.indexOf('--saved=1') !== -1 ){
                    $(self).trigger('afterSave');
                }
                $(this.contentWindow.document).find('meta#quickform-error').each(function(){
                    $(self).trigger('error', {
                       message : $(this).attr('value') 
                    });
                });
                $(this.contentWindow.document).find('body').css({
                    'background-color': 'transparent'
                });
                
                if ( !self.showHeadings ){
                    $(this.contentWindow.document).find('h3').hide();
                }
                
                if ( !self.showInternalSubmitButtons ){
                    
                    $(this.contentWindow.document).find('input[type="submit"]').hide();
                }
                
                if ( self.addCancelButton ){
                    
                    $(this.contentWindow.document).find('input[type="submit"]').after('<button class="cancel-btn">Cancel</button>');
                    $(this.contentWindow.document).find('button.cancel-btn').click(function(){
                        self.cancel();
                        return false;
                    })
                }
                
                $(self).trigger('loaded');
                self._changed = false;
                self._submitting = false;
                self.decorateFrame();
                
            })
            .get(0);
       
        
    }
    
    (function(){
        $.extend(UIForm.prototype, {
            refresh : refresh,
            decorateFrame : decorateFrame,
            submit : submit,
            cancel : cancel,
            startObservingTable : startObservingTable,
            stopObservingTable : stopObservingTable,
            getValue : getValue,
            getValues : getValues,
            setValue : setValue,
            setValues : setValues,
            getRecordId : getRecordId
        });
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * @returns {void}
         */
        function refresh(){
            
            if ( !this.table ){
                throw {
                    code : 500,
                    message : 'No table specified for form'
                };
            }

            if ( !this.query ){
                throw {
                    code : 500,
                    message : 'NO query specified for form'
                }
            }
            
            var q = this.query;
            q['-headless'] = 1;
            if ( !this.isNew ){
                q['-action'] = 'edit';
            } else {
                q['-action'] = 'new';
            }
            q['-table'] = this.table;
            if ( this.fields !== null ){
                q['-fields'] = this.fields.join(' ');
            } else {
                if ( typeof(q['-fields']) !== 'undefined' ){
                    delete q['-fields'];
                }
            }
            var qstr = [];
            for ( var i in q ){
                qstr.push(encodeURIComponent(i)+'='+encodeURIComponent(q[i]));
            }
            qstr = qstr.join('&');
            var url = DATAFACE_SITE_HREF+'?'+qstr;
            $(this.el).attr('src', url);

        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * @returns {void}
         */
        function submit(){
            $(this.el.contentWindow.document).find('form').submit();
        }
        
        function cancel(){
            if ( typeof(this.cancelAction) == 'function' ){
                this.cancelAction.call(this);
            }
            $(this).trigger('afterCancel');
        }
        
        /**
         * @private
         * @returns {Boolean}
         */
        function onSubmit(){
            var evt = {
                code : 200
            };
            
            
            $(this).trigger('beforeSubmit', evt);
            if ( evt.code !== 200 ){
                return false;
            }
            
            this._submitting = true;
            
            return true;
        }   
        
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * @returns {void}
         */
        function decorateFrame(){
            
            var self = this;
            var iframe = self.el;
            var $form = $(iframe.contentWindow.document).find('form');
            var iframeWin = iframe.contentWindow;
            // Register a submit handler on the form so that 
            // we can handle the submit event of the form
            $form.bind('submit', onSubmit.bind(self));

            // Register change events on the form fields so that we can 
            // prevent people from accidentally leaving the page.
            $form.find(':input').change(function(){
                if ( !self._changed ){
                    self._changed = true;
                    $(self).trigger('change');
                }
            });
            
            iframeWin.onbeforeunload = beforeOnUnload.bind(this);
        }
        
        /**
         * @private
         * @returns {String}
         */
        function beforeOnUnload(){
            if ( this._changed && !this._submitting ){
                return 'This form has unsaved changes that will be lost if you navigate away.  Do you wish to proceed?';
            }
            this.submitting = false;
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
            $(table.model).bind('selectionChanged.UIForm.'+this.formId, function(evt, data){
                if ( data.newValue.length === 0 ){
                    return;
                }
                for ( var k in mapping ){
                    self.query[k] = '='+Model.wrap(data.newValue[0]).get(mapping[k]);
                }
                self.isNew = false;
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
            $(table.model).unbind('selectionChanged.UIForm.'+this.formId);
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * 
         * @returns {String} The record ID of the record that is currently 
         *  the subject of this form.
         */
        function getRecordId(){
            return $(this.el.contentWindow.document)
                    .find('table.xf-form-group[data-xf-record-id]')
                        .attr('data-xf-record-id');
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * @param {Array} fields The names of the fields whose values to retrieve.  Leave
         *  empty to retrieve all fields.
         * @returns {Object} Key/value pairs of field values.
         */
        function getValues(fields){
            fields = fields || null;
            var out = {};
            $(this.el.contentWindow.document).find('form').find(':input').each(function(){
               var name = $(this).attr('name');
               if ( !name ){
                   return;
               }
               if ( fields !== null && fields.indexOf(name) === -1 ){
                   return;
               }
               var value = $(this).val();
               out[name] = value;
            });
            return out;
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * 
         * @param {String} name The name of the field whose value to retrieve.
         * @returns {String}
         */
        function getValue(name){
            var out = this.getValues([name]);
            if ( typeof(out[name]) !== 'undefined' ){
                return out[name];
            } else {
                return undefined;
            }
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * @param {Object} vals Key value pairs to set.
         * @returns {xataface.modules.uitk.components.UIForm} Self for chaining.
         */
        function setValues(vals){
            $(this.el.contentWindow.document).find('form').find(':input').each(function(){
               var name = $(this).attr('name');
               if ( !name ){
                   return;
               }
               if ( typeof(vals[name]) !== 'undefined' ){
                   $(this).val(vals[name]);
               } 
            });
            return this;
        }
        
        /**
         * @function
         * @memberOf xataface.modules.uitk.components.UIForm#
         * @param {String} key The name of the field whose value we're setting.
         * @param {String} val The value of the field that we are setting.
         * @returns {xataface.modules.uitk.components.UIForm} Self for chaining.
         */
        function setValue(key,val){
            var vals = {};
            vals[key] = val;
            this.setValues(vals);
            return this;
        }
        
    })();
    
    
    
    
   
})();
