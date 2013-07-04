<?php
class actions_uitk_demo {

    function handle($params){
        Dataface_ModuleTool::getInstance()->loadModule('modules_uitk')
            ->registerPaths();
            
        Dataface_JavascriptTool::getInstance()->import(
            'xataface/modules/uitk/actions/demo.js'
        );
        df_display(array(), 'xataface/modules/uitk/actions/demo.html');
    }
}