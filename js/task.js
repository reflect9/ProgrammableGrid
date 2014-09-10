pg.task = {
    practice_add123: {
        json: {"id":"dfdaa","title":"Practice-add123","active":true,"nodes":[{"I":["_above","_left"],"ID":"P1i6Z","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger"},{"I":["_above","_left"],"ID":"JhmHh","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,1],"type":"literal","executed":true}],"notes":[],"domain":["http://takyeonlee.com/tandem-learn/practice1.html?task=practice_average&name=asdf&which_mode_first=manual"],"timestamp":1410312942213},
        notes: []        
    },
    practice_add_two_nodes: {
        json: {"id":"OYwzX","title":"Calculate all button","active":true,"nodes":[{"I":["_above","_left"],"ID":"P1i6Z","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger"},{"I":["_above","_left"],"ID":"JhmHh","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,4,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,1],"type":"literal","executed":true},{"I":["_above","_left"],"ID":"PlwcU","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[2,1,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,0],"type":"literal","executed":true}],"notes":[],"domain":["http://takyeonlee.com/tandem-learn/practice1.html?task=practice_average&name=asdf&which_mode_first=manual"],"timestamp":1410312942213},
        notes: []        
    },
    practice_empty: {
        json: {"id":"dfdfd","title":"Practice-empty","active":true,"nodes":[],"notes":[],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1410303245212},
        notes: []        
    },
    practice_average: {
        json: {"id":"aaass","title":"Practice-Average","active":true,"nodes":[{"I":["_above","_left"],"ID":"cXocU","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["_above","_left"],"ID":"RB9lK","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,3,6]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,1],"type":"literal","executed":true},{"I":["RB9lK"],"ID":"AXqkO","P":{"kind":"transform","type":"count","icon":"list-ol","param":{"source":"input1"},"description":"Count [source]."},"V":[],"selected":false,"position":[2,0],"type":"count","executed":true},{"I":["_above","_left"],"ID":"oVBex","P":{"kind":"transform","type":"sum","icon":"list-ol","param":{"source":"input1"},"description":"Add all numbers in [source]."},"V":[],"selected":false,"position":[2,1],"type":"sum","executed":true},{"I":["_above","AXqkO"],"ID":"HBhxz","P":{"kind":"transform","type":"arithmetic","icon":"columns","param":{"operator":"/","operand_A":"input1","operand_B":"input2"},"description":"Calculate [operand_A] [operator] [operand_B]","applicable":false},"V":[],"selected":false,"position":[3,1],"executed":true}],"notes":[],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1410303245212},
        notes: []        
    },
    practice_calculate_button: {
        json: {"id":"OYwzX","title":"Calculate all button","active":true,"nodes":[{"I":["_above","_left"],"ID":"JZQ9H","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["_above","_left"],"ID":"GuILZ","P":{"kind":"apply","type":"create_element","icon":"magic","param":{"value":"calculation total points","tag":"button"},"description":"Create [tag] elements using the [value].","applicable":false},"V":[],"selected":false,"position":[1,1],"executed":true},{"I":["GuILZ"],"ID":"S0V3K","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV:nth-of-type(1) > DIV > DIV:nth-of-type(1)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[2,0],"executed":true},{"I":["GuILZ","S0V3K"],"ID":"nWNHh","P":{"kind":"apply","type":"attach_element","icon":"gavel","param":{"source":"input1","target":"input2","location":"after"},"description":"Attach [source] to [target] at [location]."},"V":[],"selected":false,"position":[2,1],"executed":true},{"I":["_above","_left"],"ID":"Q4ST3","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"input1"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed.","applicable":true},"V":[],"selected":false,"position":[3,1],"executed":false},{"I":["_above","_left"],"ID":"FK61U","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid.practiceTandem > DIV > DIV > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(3)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[4,1],"type":"extract_element","executed":true},{"I":["_above","_left"],"ID":"VJtuf","P":{"kind":"pick","icon":"list-alt","type":"get_attribute","param":{"source":"input1","key":"text"},"description":"Get [key] of [source]."},"V":[],"selected":false,"position":[5,1],"type":"get_attribute","executed":true},{"I":["_above","_left"],"ID":"FNMpg","P":{"kind":"transform","type":"sum","icon":"list-ol","param":{"source":"input2"},"description":"Add all numbers in [source].","applicable":false},"V":[],"selected":false,"position":[5,2],"executed":true},{"I":["_above","_left"],"ID":"rriPv","P":{"kind":"apply","type":"create_element","icon":"magic","param":{"value":"input2","tag":"span"},"description":"Create [tag] elements using the [value].","applicable":false},"V":[],"selected":false,"position":[5,3],"executed":true},{"I":["_above","_left"],"ID":"HrPQ3","V":[],"selected":false,"position":[6,3],"executed":false},{"I":["rriPv","GuILZ"],"ID":"dclK5","P":{"kind":"apply","type":"attach_element","icon":"gavel","param":{"source":"input1","target":"input2","location":"after"},"description":"Attach [source] to [target] at [location]."},"V":[],"selected":false,"position":[6,3],"executed":true}],"notes":[],"domain":["http://takyeonlee.com/tandem-learn/practice1.html?task=practice_average&name=asdf&which_mode_first=manual"],"timestamp":1410312942213},
        notes: []
    },
    practice_calculation: {
        json: {"id":"eWeeA","title":"Task - Calculation","active":true,"nodes":[{"I":["_above","_left"],"ID":"ZJxtq","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["ZJxtq"],"ID":"10UcH","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,2],"type":"literal","executed":true},{"I":["ZJxtq"],"ID":"tuORp","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[2,0,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"2DQJV","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,9,-5]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[7,2],"type":"literal","executed":true},{"I":["ZJxtq"],"ID":"nboYe","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[8,2,5]"},"description":"Directly set the current node data to [source].","applicable":false},"V":[],"selected":false,"position":[4,2],"executed":true}],"notes":[{"id":"note-3D1iF","title":"1.Add numbers in two nodes","description":"Add every number in [3,1,2] with [1,0,1]. <br> => The result should be [4,1,3]","position":[2,3],"width":3,"height":1},{"id":"note-Jh5Wv","title":"2.Multiply numbers in two nodes","description":"Multiply every number in [8,7,10] with [2,2,3]. <br> => The result should be [16,14,30]","position":[5,3],"width":3,"height":1},{"id":"note-967y8","title":"3.Divide by a single parameter","description":"Divide numbers [3,6,9] by 3. <br> => The result should be [1,2,3]","position":[8,3],"width":3,"height":1},{"id":"note-gfRng","title":"4.Sort","description":"Arrange [2,8,-4] in increasing order. <br> => The result should be [-4,2,8]","position":[10,3],"width":3,"height":1},{"id":"note-Y0x7T","title":"5.Count","description":"How many numbers are in [4,1,1]? <br> => The result should be [3]","position":[12,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1409554669130},
        notes: [
            {   title:"Add numbers in two nodes",
                description:"Add every number in [1,2,3] with [2,0,2]. <br> => The result should be [3,2,5]",
                position: [2,3],
                width:3
            },
            {   title:"Multiply by number",
                description:"Multiply every number in [8,2,5] by 5 <br> => The result should be [40,10,25]",
                position: [5,3],
                width:3
            },
            {   title:"Sort",
                description:"Sort [1,9,-5] in increasing order<br> => The result should be [-5,1,9]",
                position: [7,4],
                width:3
            },
            
        ]
    },
    calculation1 : {
        json: {"id":"eWeeA","title":"Task - Calculation","active":true,"nodes":[{"I":["_above","_left"],"ID":"ZJxtq","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["ZJxtq"],"ID":"10UcH","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[3,1,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,2],"type":"literal","executed":true},{"I":["ZJxtq"],"ID":"tuORp","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,0,1]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"2DQJV","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[2,8,-4]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[10,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"di7Cc","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[4,1,1]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[12,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"vsPER","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[8,7,10]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[4,2],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"cBJBn","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[2,2,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"njwFK","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[3,6,9]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[7,2],"type":"literal","executed":true}],"notes":[{"id":"note-WK2lT","title":"Problem 1 of 5","description":"Add every number in [1,2,3] with [2,0,2]. <br> => The result should be [3,2,5]","position":[2,3],"width":3,"height":1},{"id":"note-cfECL","title":"Problem 2 of 5","description":"Multiply every number in [8,7,10] with [2,2,3]. <br> => The result should be [16,14,30]","position":[5,3],"width":3,"height":1},{"id":"note-c9Dal","title":"Problem 3 of 5","description":"Divide numbers [3,6,9] by 3. <br> => The result should be [1,2,3]","position":[8,3],"width":3,"height":1},{"id":"note-HQonm","title":"Problem 4 of 5","description":"Arrange [1,9,-5] in increasing order. <br> => The result should be [-5,1,9]","position":[13,3],"width":3,"height":1},{"id":"note-EfS3m","title":"Problem 5 of 5","description":"How many numbers are in [4,1,1]? <br> => The result should be [3]","position":[15,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1409554669130},
        notes: [
            {   title:"Add numbers in two nodes",
                description:"Add every number in [3,1,2] with [1,0,1]. <br> => The result should be [4,1,3]",
                position: [2,3],
                width:3
            },
            {   title:"Multiply numbers in two nodes",
                description:"Multiply every number in [8,7,10] with [2,2,3]. <br> => The result should be [16,14,30]",
                position: [5,3],
                width:3
            },
            {   title:"Divide by a single parameter",
                description:"Divide numbers [3,6,9] by 3. <br> => The result should be [1,2,3]",
                position: [8,3],
                width:3
            },
            {   title:"Sort",
                description:"Arrange [2,8,-4] in increasing order. <br> => The result should be [-4,2,8]",
                position: [10,3],
                width:3
            },
            {   title:"Count",
                description:"How many numbers are in [4,1,1]? <br> => The result should be [3]",
                position: [12,3],
                width:3
            }
        ]
    },
    calculation2 : {
        json: {"id":"eWeeA","title":"Task - Calculation","active":true,"nodes":[{"I":["_above","_left"],"ID":"ZJxtq","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["ZJxtq"],"ID":"10UcH","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[9,7,6]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,2],"type":"literal","executed":true},{"I":["ZJxtq"],"ID":"tuORp","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,1,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"2DQJV","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[3,2,7]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[10,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"di7Cc","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[10,8,22,11]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[12,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"vsPER","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[3,9,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[4,2],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"cBJBn","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,6]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"njwFK","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[8,16,12]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[7,2],"type":"literal","executed":true}],"notes":[{"id":"note-yGxN5","title":"1.Add numbers in two nodes","description":"Add every number in [9,7,6] with [1,1,2]. <br> => The result should be [10,8,8]","position":[2,3],"width":3,"height":1},{"id":"note-Kof2x","title":"2.Multiply numbers in two nodes","description":"Multiply every number in [3,9,2] with [1,2,6]. <br> => The result should be [3,18,12]","position":[5,3],"width":3,"height":1},{"id":"note-XKDWV","title":"3.Divide by a single parameter","description":"Divide numbers [8,16,12] by 4. <br> => The result should be [2,4,3]","position":[8,3],"width":3,"height":1},{"id":"note-NkFfb","title":"4.Sort","description":"Arrange [3,2,7] in increasing order. <br> => The result should be [2,3,7]","position":[10,3],"width":3,"height":1},{"id":"note-tHB5s","title":"5.Count","description":"How many numbers are in [10,8,22,11]? <br> => The result should be [4]","position":[12,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1409554669130},
        notes: [
            {   title:"Add numbers in two nodes",
                description:"Add every number in [9,7,6] with [1,1,2]. <br> => The result should be [10,8,8]",
                position: [2,3],
                width:3
            },
            {   title:"Multiply numbers in two nodes",
                description:"Multiply every number in [3,9,2] with [1,2,6]. <br> => The result should be [3,18,12]",
                position: [5,3],
                width:3
            },
            {   title:"Divide by a single parameter",
                description:"Divide numbers [8,16,12] by 4. <br> => The result should be [2,4,3]",
                position: [8,3],
                width:3
            },
            {   title:"Sort",
                description:"Arrange [3,2,7] in increasing order. <br> => The result should be [2,3,7]",
                position: [10,3],
                width:3
            },
            {	title:"Count",
                description:"How many numbers are in [10,8,22,11]? <br> => The result should be [4]",
                position: [12,3],
                width:3
            }
        ]
    },
    practice_extraction: {
        json: {"id":"fdasfdas","title":"Extraction practice","active":true,"nodes":[{"I":["_above","_left"],"ID":"P1i6Z","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["_above","_left"],"ID":"JhmHh","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid.practiceTandem > DIV > TABLE.table.table-bordered > TBODY > TR > TD > A"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[1,1],"type":"extract_element","executed":true},{"I":["P1i6Z"],"ID":"RYhJu","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid.practiceTandem > DIV > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[4,1],"type":"extract_element","executed":true},{"I":["P1i6Z","_left"],"ID":"9T4QW","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid.practiceTandem > DIV > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(3)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[8,1],"type":"extract_element","executed":true},{"I":["_above","_left"],"ID":"5dWEF","P":{"kind":"pick","icon":"list-alt","type":"get_attribute","param":{"source":"input1","key":"text"},"description":"Get [key] of [source].","applicable":false},"V":[],"selected":false,"position":[9,1],"executed":true},{"I":["_above","_left"],"ID":"Ptvtf","P":{"kind":"transform","type":"number_test","icon":"columns","param":{"operator":"<","operand_A":"input1","operand_B":"1900"},"description":"Evaluate [operand_A] [operator] [operand_B].","applicable":false},"V":[],"selected":false,"position":[10,1],"executed":true},{"I":["9T4QW","Ptvtf"],"ID":"7Ctkt","P":{"kind":"transform","type":"filter","icon":"filter","param":{"items":"input1","true_or_false":"true","booleans":"input2"},"description":"Filter items in [items] by [true_or_false] of [booleans].","applicable":false},"V":[],"selected":false,"position":[11,1],"executed":true}],"domain":["http://takyeonlee.com/tandem-learn/practice1.html?task=practice_average&name=asdf&which_mode_first=manual"],"timestamp":1410320219280},
        notes: [
            {   title:"Getting text attributes",
                description:"Get text attributes<br> => [Anna, Ariane, Beacon, Claygate,...]",
                position: [2,2],
                width:3
            },
            {   title:"Getting attributes from sub-element",
                description:"Get the origins from the rows <br> => [Israel, France,...]",
                position: [5,2],
                width:3
            },
            {   title:"Finding Path",
                description:"Find the cells on the right side of the two years <br> => [TD:Cider, TD:Eating]",
                position: [12,2],
                width:3
            }
        ]
    },
    extraction1 : {
        json: {"id":"S21aM","title":"Extraction tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"DBKZn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["DBKZn","_left"],"ID":"PI8a1","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(1)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[2,1],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"xX7Bu","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD > A"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[6,3],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"XCkNy","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[9,1],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"L5NrT","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(2)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[13,1],"type":"extract_element","executed":true},{"I":["L5NrT"],"ID":"y0o69","P":{"kind":"pick","icon":"list-alt","type":"get_attribute","param":{"source":"input1","key":"text"},"description":"Get [key] of [source].","parem":{"key":"text"}},"V":[],"selected":false,"position":[14,1],"executed":true},{"I":["y0o69"],"ID":"GiszS","P":{"kind":"transform","type":"string_test","icon":"columns","param":{"source":"input1","key":"US","isIn":"in"},"description":"Distinguish whether [key] is [isIn] [source] ."},"V":[],"selected":false,"position":[15,1],"executed":true},{"I":["L5NrT","GiszS"],"ID":"apYFi","P":{"kind":"transform","type":"filter","icon":"filter","param":{"items":"input1","true_or_false":"true","booleans":"input2"},"description":"Filter items in [items] by [true_or_false] of [booleans]."},"V":[],"selected":false,"position":[15,2],"executed":true}],"notes":[{"id":"note-s2pk9","title":"1.Getting text attributes","description":"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]","position":[3,2],"width":3,"height":1},{"id":"note-bTgw8","title":"2.Getting other attributes","description":"Get link attributes of the input elements <br> => The result should be ['http://...',...]","position":[7,2],"width":3,"height":1},{"id":"note-1zZBG","title":"3.Getting attributes from sub-element","description":"Get the year numbers of the rows <br> => [1965,2002,1936,...]","position":[10,2],"width":3,"height":1},{"id":"note-z05AQ","title":"4.Finding path","description":"Get the apple name column in the same rows with the cells <br> => [A: Beacon, A: Wealthy]","position":[16,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=calculation2"],"timestamp":1409558932325},
        notes: [
            {   title:"Getting text attributes",
                description:"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]",
                position: [3,2],
                width:3
            },
            {   title:"Getting other attributes",
                description:"Get link attributes of the input elements <br> => The result should be ['http://...',...]",
                position: [7,4],
                width:3
            },
            {   title:"Getting attributes from sub-element",
                description:"Get the year numbers of the rows <br> => [1965,2002,1936,...]",
                position: [10,2],
                width:3
            },
            {   title:"Finding path",
                description:"Get the apple name column in the same rows with the cells <br> => [A: Beacon, A: Wealthy]",
                position: [16,3],
                width:3
            }
        ]
    },
    extraction2 : {
        json: {"id":"S21aM","title":"Extraction tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"DBKZn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["DBKZn","_left"],"ID":"PI8a1","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(1)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[2,1],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"xX7Bu","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD > A"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[6,3],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"XCkNy","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[9,1],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"L5NrT","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(2)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[13,1],"type":"extract_element","executed":true},{"I":["L5NrT"],"ID":"y0o69","P":{"kind":"pick","icon":"list-alt","type":"get_attribute","param":{"source":"input1","key":"text"},"description":"Get [key] of [source].","parem":{"key":"text"}},"V":[],"selected":false,"position":[14,1],"executed":true},{"I":["y0o69"],"ID":"GiszS","P":{"kind":"transform","type":"string_test","icon":"columns","param":{"source":"input1","key":"US","isIn":"in"},"description":"Distinguish whether [key] is [isIn] [source] ."},"V":[],"selected":false,"position":[15,1],"executed":true},{"I":["L5NrT","GiszS"],"ID":"apYFi","P":{"kind":"transform","type":"filter","icon":"filter","param":{"items":"input1","true_or_false":"true","booleans":"input2"},"description":"Filter items in [items] by [true_or_false] of [booleans]."},"V":[],"selected":false,"position":[15,2],"executed":true}],"notes":[{"id":"note-lMnqW","title":"1.Getting text attributes","description":"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]","position":[3,2],"width":3,"height":1},{"id":"note-6vEsC","title":"2.Getting other attributes","description":"Get link attributes of the input elements <br> => The result should be ['http://...',...]","position":[7,2],"width":3,"height":1},{"id":"note-qvMyy","title":"3.Getting attributes from sub-element","description":"Get the origins of the rows <br> => [Israel, France, US, ...]","position":[10,2],"width":3,"height":1},{"id":"note-nwLwg","title":"4.Finding path","description":"Get the apple name column in the same rows with the cells <br> => [A: Ariane, A:Muscadet de Dieppe]","position":[16,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=calculation2"],"timestamp":1409558932325},
        notes: [
            {   title:"Getting text attributes",
                description:"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]",
                position: [3,2],
                width:3
            },
            {   title:"Getting other attributes",
                description:"Get link attributes of the input elements <br> => The result should be ['http://...',...]",
                position: [7,4],
                width:3
            },
            {   title:"Getting attributes from sub-element",
                description:"Get the origins of the rows <br> => [Israel, France, US, ...]",
                position: [10,2],
                width:3
            },
            {   title:"Finding path",
                description:"Get the apple name column in the same rows with the cells <br> => [A: Ariane, A:Muscadet de Dieppe]",
                position: [16,3],
                width:3
            }
        ]
    },
    practice_filter : {
        json: {"id":"rnibI","title":"Filter Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"hbCYc","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["hbCYc","_left"],"ID":"HHt95","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3,4]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,2],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"e9ZXh","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[\"apple juice\",\"banana\",\"apple\",\"peach juice\"]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"z6LuB","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid.practiceTandem > DIV > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[9,1],"type":"extract_element","executed":true}],"notes":[{"id":"note-uS3wt","title":"1.String filtering","description":"Find text values in the list that contains \"peach\" <br> => The result should be [\"peach\"]","position":[3,2],"width":3,"height":1},{"id":"note-RqQtc","title":"2.Number filtering","description":"Find numbers bigger than 2 in the list <br> => The result should be [3,4]","position":[6,3],"width":3,"height":1},{"id":"note-Cm0re","title":"3.Element filtering","description":"Find the rows in the table with 'UK' in the Origin column <br> => The result should be [TR: Claygate ...]","position":[10,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=extraction1"],"timestamp":1409562653131},
        notes: [
            {   title:"String filtering",
                description:'Find text values in the list that contains "peach" <br> => The result should be ["peach"]',
                position: [3,2],
                width:3
            },
            {   title:"Number filtering",
                description:"Find numbers bigger than 2 in the list <br> => The result should be [3,4]",
                position: [6,3],
                width:3
            },
            {   title:"Element filtering",
                description:"Find the rows in the table with 'UK' in the Origin column <br> => The result should be [TR: Claygate ...]",
                position: [10,2],
                width:3
            }
        ]


    },
    filter1 : {
        json: {"id":"rnibI","title":"Filter Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"hbCYc","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["hbCYc","_left"],"ID":"HHt95","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3,4]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,2],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"e9ZXh","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[\"apple juice\",\"banana\",\"apple\",\"peach juice\"]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"z6LuB","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid.practiceTandem > DIV > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[9,1],"type":"extract_element","executed":true}],"notes":[{"id":"note-uS3wt","title":"1.String filtering","description":"Find text values in the list that contains \"peach\" <br> => The result should be [\"peach\"]","position":[3,2],"width":3,"height":1},{"id":"note-RqQtc","title":"2.Number filtering","description":"Find numbers bigger than 2 in the list <br> => The result should be [3,4]","position":[6,3],"width":3,"height":1},{"id":"note-Cm0re","title":"3.Element filtering","description":"Find the rows in the table with 'UK' in the Origin column <br> => The result should be [TR: Claygate ...]","position":[10,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=extraction1"],"timestamp":1409562653131},
        notes: [
            {   title:"String filtering",
                description:'Find text values in the list that contains "apple" <br> => The result should be ["apple juice","apple"]',
                position: [3,2],
                width:3
            },
            {   title:"Number filtering",
                description:"Find even numbers in the list <br> => The result should be [2,4]",
                position: [6,3],
                width:3
            },
            {   title:"Element filtering",
                description:"Find the rows in the table with 'Eating' in the use column <br> => The result should be [TR: Anna ..., TR: Ariane ..., TR: Wealthy ...]",
                position: [10,2],
                width:3
            }
        ]


    },
    filter2 : {
       json: {"id":"rnibI","title":"Filter Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"hbCYc","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["hbCYc","_left"],"ID":"HHt95","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3,4]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,2],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"e9ZXh","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[\"apple juice\",\"banana\",\"apple\",\"peach juice\"]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"z6LuB","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid.practiceTandem > DIV > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[9,1],"type":"extract_element","executed":true}],"notes":[{"id":"note-uS3wt","title":"1.String filtering","description":"Find text values in the list that contains \"peach\" <br> => The result should be [\"peach\"]","position":[3,2],"width":3,"height":1},{"id":"note-RqQtc","title":"2.Number filtering","description":"Find numbers bigger than 2 in the list <br> => The result should be [3,4]","position":[6,3],"width":3,"height":1},{"id":"note-Cm0re","title":"3.Element filtering","description":"Find the rows in the table with 'UK' in the Origin column <br> => The result should be [TR: Claygate ...]","position":[10,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=extraction1"],"timestamp":1409562653131},
        notes: [
            {   title:"String filtering",
                description:'Find text values in the list that contains "juice" <br> => The result should be ["apple juice","peach juice"]',
                position: [3,2],
                width:3
            },
            {   title:"Number filtering",
                description:"Find odd numbers in the list <br> => The result should be [1,3]",
                position: [6,3],
                width:3
            },
            {   title:"Element filtering",
                description:"Find the rows in the table with 'France' in the origin column <br> => The result should be [TR: Ariane ..., TR: Muscadet ...]",
                position: [10,2],
                width:3
            }
        ]
    },
    practice_attach : {
        json: {"id":"iLpTy","title":"Attach Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"LMrGn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["LMrGn","_left"],"ID":"9aOgd","P":{"kind":"apply","type":"create_element","icon":"magic","param":{"value":"search by keyword","tag":"text input"},"description":"Create [tag] elements using the [value].","applicable":false},"V":[],"selected":false,"position":[2,2],"executed":true}],"notes":[{"id":"note-ZyYuP","title":"Problem 1 of 2","description":"Attach the TEXT INPUT element in the above node to front of every apple name (Anna, Ariane, ...)","position":[3,2],"width":3,"height":1},{"id":"note-kbDrK","title":"Problem 2 of 2","description":"Attach the TEXT INPUT element in the above node behind the table.","position":[7,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=filter1"],"timestamp":1409600397571},
        notes: [
            {   title:"Attaching single element before multiple targets",
                description:'Attach the TEXT INPUT element in the above node to front of every apple name (Anna, Ariane, ...)',
                position: [3,3],
                width:3
            }
        ]
    },
    attach1 : {
        json: {"id":"iLpTy","title":"Attach Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"LMrGn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["LMrGn","_left"],"ID":"9aOgd","P":{"kind":"apply","type":"create_element","icon":"magic","param":{"value":"search by keyword","tag":"text input"},"description":"Create [tag] elements using the [value].","applicable":false},"V":[],"selected":false,"position":[2,2],"executed":true}],"notes":[{"id":"note-ZyYuP","title":"Problem 1 of 2","description":"Attach the TEXT INPUT element in the above node to front of every apple name (Anna, Ariane, ...)","position":[3,2],"width":3,"height":1},{"id":"note-kbDrK","title":"Problem 2 of 2","description":"Attach the TEXT INPUT element in the above node behind the table.","position":[7,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=filter1"],"timestamp":1409600397571},
        notes: [
            {   title:"Attaching single element before multiple targets",
                description:'Attach the TEXT INPUT element in the above node to front of every origin (Israel, France, ...)',
                position: [3,3],
                width:3
            }
        ]
    },
    attach2 : {
        json: {"id":"iLpTy","title":"Attach Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"LMrGn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["LMrGn","_left"],"ID":"AiPao","P":{"kind":"apply","type":"create_element","icon":"magic","param":{"value":"blah","tag":"text input"},"description":"Create [tag] elements using the [value].","applicable":false},"V":[],"selected":false,"position":[2,2],"executed":true}],"notes":[{"id":"note-6ynac","title":"Problem 1 of 1","description":"Attach the TEXT INPUT element in the above node above the table.","position":[3,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=filter1"],"timestamp":1409600397571},
        notes: [
            {   title:"Attaching single element before multiple targets",
                description:"Attach the TEXT INPUT element in the above node to back of every use (EAting, Cooking, ...)",
                position: [3,3],
                width:3
            }
        ]
    },
    modify : {
        json: ''
    }
};
pg.task.get_enhancement = function(task_key) {
    if(!pg.task[task_key]) return false;
    var enh = new pg.Enhancement(pg.task[task_key].json);
    enh.notes = _.map(pg.task[task_key].notes, function(note, i) {
        var _n = new pg.Note(note);
        _n.title = (i+1)+"."+_n.title;
        return _n;
    });
    return enh;
};

pg.task.renderSurvey = function(task_key, mode) {
    if(!pg.task[task_key]) return false;
    var problems = pg.task[task_key].notes;
    var survey_el = $("<div class='centered survey' task='calculation'>\
          <h1>Survey</h1>\
        </div>");    
    // var firstMethod = (first_mode=="automatic")? "automatic": "manual";
    // var secondMethod = (first_mode=="automatic")? "manual": "automatic";
    for (var i in problems) {
        var el = $("<div class='survey_item' number='"+(parseInt(i)+1)+"'>\
            <h4>Problem "+(parseInt(i)+1)+".  "+problems[i].title+"</h4>\
            <div class='survey_question'>How easy or diffcult was it to solve the problem with this method?</div>\
            <table class='likert'>\
              <tr>\
                  <td colspan='3' style='text-align:left;'>Very easy</td>\
                  <td colspan='4' style='text-align:right;'>Very difficult</td>\
              </tr>\
              <tr>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"' value='1' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"' value='2' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"' value='3' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"' value='4' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"' value='5' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"' value='6' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"' value='7' /></td>\
              </tr>\
            </table>\
          </div>\
        ");
        $(survey_el).append(el);
    }
    var el_learning = $("<div class='survey_item' number='g'>\
        <h4>General</h4>\
        <div class='survey_question'>How easy or difficult was it to learn this method?</div>\
        <table class='likert'>\
          <tr>\
              <td colspan='3' style='text-align:left;'>Very easy</td>\
              <td colspan='4' style='text-align:right;'>Very difficult</td>\
          </tr>\
          <tr class='"+mode+"'>\
            <td><input type='radio' name='g' value='1' /></td>\
            <td><input type='radio' name='g' value='2' /></td>\
            <td><input type='radio' name='g' value='3' /></td>\
            <td><input type='radio' name='g' value='4' /></td>\
            <td><input type='radio' name='g' value='5' /></td>\
            <td><input type='radio' name='g' value='6' /></td>\
            <td><input type='radio' name='g' value='7' /></td>\
          </tr>\
        </table>\
      </div>\
    ").appendTo(survey_el);
    var el_submit = $("\
        <div>\
            <button type='button' id='submit_survey' class='centered btn btn-lg btn-success'>Submit</button>\
        </div>\
    ");
    $(el_submit).find("button").click($.proxy(function() {
        var survey_result={"task":this.task_key, "mode":this.mode};
        var all_question_answered = true;
        $("div.survey_item").each(function(i,div) {
            var item_num = $(div).attr("number"); 
            var value = $(div).find("input[name='"+item_num+"']:checked").val();   
            if(typeof value == 'undefined')
                all_question_answered = false;
            survey_result[item_num]= {'value':value};
        });
        if(!all_question_answered) {
            $("button#submit_survey").after("<div>Please answer all questions.</div>");
            return;
        }
        pg.log.add({type:"survey",survey_result:survey_result});
        $(this).addClass("disabled");
    },{task_key:task_key,mode:mode}));

    $(el_submit).appendTo(survey_el);
    return survey_el;
}










