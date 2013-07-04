<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of uitk_build_uitable
 *
 * @author shannah
 */
class actions_uitk_build_uitable {
    //put your code here
    
    function handle($params){
       
        try {
            $this->handle2($params);
        } catch ( Exception $ex){
            
            $msgid = time().rand(0,10000);
            error_log(__FILE__.'['.__LINE__.'] Failed to build table : '.$ex->getMessage().' Code='.$ex->getCode());
            $this->out(array(
                'code' => $ex->getCode(),
                'message' => 'Failed to build table.  Check error log for details.',
                'msgid' => $msgid
            ));
        }
    }
    
    function handle2($params){
        
        $query = Dataface_Application::getInstance()->getQuery();
        if ( !@$query['--fields'] ){
            throw new Exception("No fields specified");
        }
        $fieldNames = explode(' ', $query['--fields']);
        $out = array();
        $table = Dataface_Table::loadTable($query['-table']);
        if ( PEAR::isError($table) ){
            
            throw new Exception("The table could not be found: ".$table->getMessage(), $table->getCode());
        }
        
        $perms = $table->getPermissions();
        if ( !@$perms['uitk_build_uitable']){
            throw new Exception("No permission to build this table.");
        }
         
        foreach ( $fieldNames as $fieldName){
            $fperms = $table->getPermissions(array('field'=>$fieldName));
            if ( !@$fperms['view'] ){
                continue;
            }
            
            $fieldDef =& $table->getField($fieldName);
            if ( PEAR::isError($fieldDef) ){
                continue;
            }
            $label = $table->getFieldProperty('column:label', $fieldName);
            if ( !$label ){
                $label = $table->getFieldProperty('widget:label', $fieldName);
            }
            $out[] = array(
                'name' => $fieldName,
                'label' => $label
            );
            
            
        }
        
        $this->out(array(
           'code' => 200,
            'columns' => $out
        ));
    }
    
    function out($data){
        header('Content-type: text/json; charset="'.Dataface_Application::getInstance()->_conf['oe'].'"');
        echo json_encode($data);
    }
}

?>
