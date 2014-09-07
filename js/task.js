pg.task = {
    calculation1 : {
        json: {"id":"eWeeA","title":"Task - Calculation","active":true,"nodes":[{"I":["_above","_left"],"ID":"ZJxtq","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["ZJxtq"],"ID":"10UcH","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,2],"type":"literal","executed":true},{"I":["ZJxtq"],"ID":"tuORp","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[2,0,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"2DQJV","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,9,-5]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[10,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"di7Cc","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[4,1,1]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[12,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"vsPER","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[8,7,10]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[4,2],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"cBJBn","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[2,2,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"njwFK","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[3,6,9]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[7,2],"type":"literal","executed":true}],"notes":[{"id":"note-WK2lT","title":"Problem 1 of 5","description":"Add every number in [1,2,3] with [2,0,2]. <br> => The result should be [3,2,5]","position":[2,3],"width":3,"height":1},{"id":"note-cfECL","title":"Problem 2 of 5","description":"Multiply every number in [8,7,10] with [2,2,3]. <br> => The result should be [16,14,30]","position":[5,3],"width":3,"height":1},{"id":"note-c9Dal","title":"Problem 3 of 5","description":"Divide numbers [3,6,9] by 3. <br> => The result should be [1,2,3]","position":[8,3],"width":3,"height":1},{"id":"note-HQonm","title":"Problem 4 of 5","description":"Arrange [1,9,-5] in increasing order. <br> => The result should be [-5,1,9]","position":[13,3],"width":3,"height":1},{"id":"note-EfS3m","title":"Problem 5 of 5","description":"How many numbers are in [4,1,1]? <br> => The result should be [3]","position":[15,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1409554669130},
        notes: [
            {   title:"Add numbers in two nodes",
                description:"Add every number in [1,2,3] with [2,0,2]. <br> => The result should be [3,2,5]",
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
                description:"Arrange [1,9,-5] in increasing order. <br> => The result should be [-5,1,9]",
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
        json: {"id":"eWeeA","title":"Task - Calculation","active":true,"nodes":[{"I":["_above","_left"],"ID":"ZJxtq","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["ZJxtq"],"ID":"10UcH","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[3,9,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,2],"type":"literal","executed":true},{"I":["ZJxtq"],"ID":"tuORp","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,6]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"2YOPq","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[3,2,7]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[4,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"KHYsj","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[8,6,12]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[6,2],"type":"literal","executed":false},{"I":["ZJxtq","_left"],"ID":"IL7Ep","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[10,8,22,11]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[9,1],"type":"literal","executed":false},{"I":["ZJxtq","_left"],"ID":"By5Zn","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[9,7,6]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[11,2],"type":"literal","executed":false},{"I":["ZJxtq","_left"],"ID":"zRKia","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,1,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[12,1],"type":"literal","executed":false}],"notes":[{"id":"note-267ut","title":"Problem 1 of 5","description":"Multiply every number in [3,9,2] with [1,2,6]. <br> => The result should be [3,18,12]","position":[2,3],"width":3,"height":1},{"id":"note-WiJlU","title":"Problem 2 of 5","description":"Arrange [3,2,7] in increasing order. <br> => The result should be [2,3,7]","position":[4,3],"width":3,"height":1},{"id":"note-p5e5E","title":"Problem 3 of 5","description":"Divide numbers [8,16,12] by 4. <br> => The result should be [2,4,3]","position":[7,3],"width":3,"height":1},{"id":"note-q09U5","title":"Problem 4 of 5","description":"How many numbers are in [10,8,22,11]? <br> => The result should be [3]","position":[9,3],"width":3,"height":1},{"id":"note-aKLN9","title":"Problem 5 of 5","description":"Add every number in [9,7,6] with [1,1,2]. <br> => The result should be [10,8,8]","position":[12,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1409554669130},
        notes: [
            {   description:"Multiply every number in [3,9,2] with [1,2,6]. <br> => The result should be [3,18,12]",
                position: [2,3],
                width:3
            },
            {   description:"Arrange [3,2,7] in increasing order. <br> => The result should be [2,3,7]",
                position: [4,3],
                width:3
            },
            {   description:"Divide numbers [8,16,12] by 4. <br> => The result should be [2,4,3]",
                position: [7,3],
                width:3
            },
            {   description:"How many numbers are in [10,8,22,11]? <br> => The result should be [4]",
                position: [9,3],
                width:3
            },
            {   description:"Add every number in [9,7,6] with [1,1,2]. <br> => The result should be [10,8,8]",
                position: [12,3],
                width:3
            }
        ]
    },
    extraction1 : {
        json: {"id":"S21aM","title":"Extraction tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"DBKZn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["DBKZn","_left"],"ID":"PI8a1","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(1)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[2,1],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"xX7Bu","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD > A"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[5,1],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"XCkNy","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[8,1],"type":"extract_element","executed":true},{"I":["DBKZn","_left"],"ID":"L5NrT","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(2)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[12,1],"type":"extract_element","executed":true},{"I":["L5NrT"],"ID":"y0o69","P":{"kind":"pick","icon":"list-alt","type":"get_attribute","param":{"source":"input1","key":"text"},"description":"Get [key] of [source].","parem":{"key":"text"}},"V":[],"selected":false,"position":[13,1],"executed":true},{"I":["y0o69"],"ID":"GiszS","P":{"kind":"transform","type":"string_test","icon":"columns","param":{"source":"input1","key":"US","isIn":"in"},"description":"Distinguish whether [key] is [isIn] [source] ."},"V":[],"selected":false,"position":[14,1],"executed":true},{"I":["L5NrT","GiszS"],"ID":"apYFi","P":{"kind":"transform","type":"filter","icon":"filter","param":{"items":"input1","true_or_false":"true","booleans":"input2"},"description":"Filter items in [items] by [true_or_false] of [booleans]."},"V":[],"selected":false,"position":[14,2],"executed":true}],"notes":[{"id":1,"title":"Problem 1","description":"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]","position":[3,1],"width":3,"height":1},{"id":2,"title":"Problem 2","description":"Get link attributes of the input elements <br> => The result should be ['http://...',...]","position":[6,1],"width":3,"height":1},{"id":3,"title":"Problem 3","description":"Get the year numbers of the rows <br> => [1965,2002,1936,...]","position":[9,1],"width":3,"height":1},{"id":4,"title":"Problem 4","description":"Get the apple name columns in the same rows with the cells <br> => [A: Beacon, A: Wealthy]","position":[17,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=calculation2"],"timestamp":1409558932325},
        notes: [
            {   title:"Getting text attributes",
                description:"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]",
                position: [3,2],
                width:3
            },
            {   title:"Getting other attributes",
                description:"Get link attributes of the input elements <br> => The result should be ['http://...',...]",
                position: [6,2],
                width:3
            },
            {   title:"Getting attributes from sub-element",
                description:"Get the year numbers of the rows <br> => [1965,2002,1936,...]",
                position: [9,2],
                width:3
            },
            {   title:"Finding path",
                description:"Get the apple name columns in the same rows with the cells <br> => [A: Beacon, A: Wealthy]",
                position: [15,3],
                width:3
            }
        ]
    },
    extraction2 : {
        json: {"id":"S21aM","title":"Extraction tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"xm5rK","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger"},{"I":["xm5rK","_left"],"ID":"c9idt","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD:nth-of-type(4)"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[2,1],"type":"extract_element","executed":true},{"I":["c9idt"],"ID":"1WeoK","P":{"kind":"pick","icon":"list-alt","type":"get_attribute","param":{"source":"input1","key":"text"},"description":"Get [key] of [source].","parem":{"key":"text"}},"V":[],"selected":false,"position":[3,1],"executed":true},{"I":["1WeoK"],"ID":"dZTXs","P":{"kind":"transform","type":"string_test","icon":"columns","param":{"source":"input1","key":"Eating","isIn":"in"},"description":"Distinguish whether [key] is [isIn] [source] ."},"V":[],"selected":false,"position":[4,1],"executed":true},{"I":["c9idt","dZTXs"],"ID":"lM5bp","P":{"kind":"transform","type":"filter","icon":"filter","param":{"items":"input1","true_or_false":"true","booleans":"input2"},"description":"Filter items in [items] by [true_or_false] of [booleans]."},"V":[],"selected":false,"position":[4,2],"executed":true},{"I":["xm5rK","_left"],"ID":"OpGLY","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD > A"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[8,1],"type":"extract_element","executed":true},{"I":["xm5rK","_left"],"ID":"C5KNM","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR > TD > A"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[11,1],"type":"extract_element","executed":true},{"I":["xm5rK","_left"],"ID":"mFWHw","P":{"kind":"pick","type":"extract_element","icon":"crosshairs","param":{"source":"_current","selector":"> DIV.container-fluid > DIV.main > CENTER > TABLE.table.table-bordered > TBODY > TR"},"description":"Extract elements at [selector] from [source]."},"V":[],"selected":false,"position":[14,1],"type":"extract_element","executed":true}],"notes":[{"id":"note-chYnM","title":"Problem 1 of 4","description":"Get the apple name columns in the same rows with the cells <br> => [A: Beacon, A: Wealthy]","position":[3,1],"width":3,"height":1},{"id":"note-6KYuf","title":"Problem 2 of 4","description":"Get link attributes of the input elements <br> => The result should be ['http://...',...]","position":[6,1],"width":3,"height":1},{"id":"note-ODGAH","title":"Problem 3 of 4","description":"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]","position":[9,1],"width":3,"height":1},{"id":"note-HuQ0L","title":"Problem 4 of 4","description":"Get the year numbers of the rows <br> => [1965,2002,1936,...]","position":[15,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=calculation2"],"timestamp":1409558932325},
        notes: [
            {   description:"Get the apple name columns in the same rows with the cells <br> => [A: Anna, A: Ariane, A:Wealthy]",
                position: [5,3],
                width:3
            },
            {   description:"Get link attributes of the input elements <br> => The result should be ['http://...',...]",
                position: [9,2],
                width:3
            },
            {   description:"Get text attributes of the input elements <br> => The result should be [Anna, Ariane, ...]",
                position: [12,2],
                width:3
            },
            {   description:"Get the origins of the rows <br> => [Israel, France, US, ...]",
                position: [15,2],
                width:3
            }
        ]
    },
    filter1 : {
        json: {"id":"rnibI","title":"Filter Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"hbCYc","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["hbCYc","_left"],"ID":"HHt95","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3,4]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,2],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"e9ZXh","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[\"apple juice\",\"banana\",\"apple\",\"peach\"]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true}],"notes":[{"id":"note-0o7fx","title":"Problem 1 of 4","description":"Find text values in the list that contains \"apple\" <br> => The result should be [\"apple juice\",\"apple\"]","position":[3,2],"width":3,"height":1},{"id":"note-LaYAl","title":"Problem 2 of 4","description":"Find even numbers in the list <br> => The result should be [2,4]","position":[6,3],"width":3,"height":1},{"id":"note-tCCuo","title":"Problem 3 of 4","description":"Find rows(TR) whose origin is France <br> => The result should be [TR: Ariane.., TR:Musca...]","position":[10,2],"width":3,"height":1},{"id":"note-DNMmC","title":"Problem 4 of 4","description":"Find rows(TR) whose usage match with the text in the input box.  For example, if 'Cider' is typed in the box, the result should be[TR: Musca...]","position":[16,5],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=extraction1"],"timestamp":1409562653131},
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
            }
        ]


    },
    filter2 : {
       json: {"id":"rnibI","title":"Filter Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"hbCYc","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["hbCYc","_left"],"ID":"e9ZXh","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3,4]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["hbCYc","_left"],"ID":"mGJY0","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[5,13,11,7]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,1],"type":"literal","executed":true}],"notes":[{"id":"note-nnVDB","title":"Problem 1 of 4","description":"Find odd numbers in the list <br> => The result should be [1,3]","position":[3,2],"width":3,"height":1},{"id":"note-BnWgA","title":"Problem 2 of 4","description":"Find rows(TR) whose usage match with the text in the input box.  For example, if 'Cider' is typed in the box, the result should be[TR: Musca...]","position":[7,5],"width":3,"height":1},{"id":"note-6QzrK","title":"Problem 3 of 4","description":"Find the values in the list that is bigger than 10 <br> => The result should be [13, 11]","position":[11,2],"width":3,"height":1},{"id":"note-HEYcE","title":"Problem 4 of 4","description":"Find rows(TR) whose origin is US <br> => The result should be [TR: Beacon.., TR:Wealthy...]","position":[14,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=extraction1"],"timestamp":1409562653131},
        notes: [
            {   description:"Find odd numbers in the list <br> => The result should be [1,3]",
                position: [3,2],
                width:3
            },
            {   description:'Find the values in the list that is bigger than 10 <br> => The result should be [13, 11]',
                position: [6,2],
                width:3
            }
          
        ]


    },
    attach1 : {
        json: {"id":"iLpTy","title":"Attach Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"LMrGn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["LMrGn","_left"],"ID":"9aOgd","P":{"kind":"apply","type":"create_element","icon":"magic","param":{"value":"search by keyword","tag":"text input"},"description":"Create [tag] elements using the [value].","applicable":false},"V":[],"selected":false,"position":[2,2],"executed":true}],"notes":[{"id":"note-ZyYuP","title":"Problem 1 of 2","description":"Attach the TEXT INPUT element in the above node to front of every apple name (Anna, Ariane, ...)","position":[3,2],"width":3,"height":1},{"id":"note-kbDrK","title":"Problem 2 of 2","description":"Attach the TEXT INPUT element in the above node behind the table.","position":[7,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=filter1"],"timestamp":1409600397571},
        notes: [
            {   description:"Attach the TEXT INPUT element in the above node behind the table.",
                position: [3,3],
                width:3
            }
        ]
    },
    attach2 : {
        json: {"id":"iLpTy","title":"Attach Tasks","active":true,"nodes":[{"I":["_above","_left"],"ID":"LMrGn","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["LMrGn","_left"],"ID":"AiPao","P":{"kind":"apply","type":"create_element","icon":"magic","param":{"value":"blah","tag":"checkbox"},"description":"Create [tag] elements using the [value].","applicable":false},"V":[],"selected":false,"position":[2,2],"executed":true}],"notes":[{"id":"note-9Gj9d","title":"Problem 1 of 2","description":"Attach the TEXT INPUT element in the above node above the table.","position":[3,3],"width":3,"height":1},{"id":"note-4kqey","title":"Problem 2 of 2","description":"Attach the CHECKBOX element in the above node to front of every apple name (Anna, Ariane, ...)","position":[7,3],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/task.html?task=filter1"],"timestamp":1409600397571},
        notes: [
            {   description:"Attach the TEXT INPUT element in the above node above the table.",
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
        _n.title = "Problem "+(i+1)+" of "+pg.task[task_key].notes.length;
        return _n;
    });
    return enh;
};

pg.task.renderSurvey = function(task_key, auto_first) {
    if(!pg.task[task_key]) return false;
    var problems = pg.task[task_key].notes;
    var survey_el = $("<div class='centered survey' task='calculation'>\
          <h1>Survey</h1>\
        </div>");
    var firstMethod = (auto_first)? "automatic": "manual";
    var secondMethod = (auto_first)? "manual": "automatic";
    for (var i in problems) {
        var el = $("<div class='survey_item' number='"+(parseInt(i)+1)+"'>\
            <h4>Problem "+(parseInt(i)+1)+".  "+problems[i].title+"</h4>\
            <div class='survey_question'>How easy was it to solve the problem with each method?</div>\
            <table class='likert'>\
              <tr>\
                  <td></td>\
                  <td colspan='3' style='text-align:left;'>Very easy</td>\
                  <td colspan='4' style='text-align:right;'>Very difficult</td>\
              </tr>\
              <tr class='"+firstMethod+"'>\
                <td class='survey_header'>Automatic</td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+firstMethod+"' value='1' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+firstMethod+"' value='2' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+firstMethod+"' value='3' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+firstMethod+"' value='4' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+firstMethod+"' value='5' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+firstMethod+"' value='6' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+firstMethod+"' value='7' /></td>\
              </tr>\
              <tr class='"+secondMethod+"'>\
                <td class='survey_header'>Manual</td>\
                <td><input id='radStart' type='radio' name='"+(parseInt(i)+1)+"_"+secondMethod+"' value='1' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+secondMethod+"' value='2' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+secondMethod+"' value='3' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+secondMethod+"' value='4' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+secondMethod+"' value='5' /></td>\
                <td><input type='radio' name='"+(parseInt(i)+1)+"_"+secondMethod+"' value='6' /></td>\
                <td><input id='radEnd' type='radio' name='"+(parseInt(i)+1)+"_"+secondMethod+"' value='7' /></td>\
              </tr>\
            </table>\
          </div>\
        ");
        $(survey_el).append(el);
    }
    var el_learning = $("<div class='survey_item' number='g'>\
        <h4>General</h4>\
        <div class='survey_question'>How easy or difficult was it to learn each method?</div>\
        <table class='likert'>\
          <tr>\
              <td></td>\
              <td colspan='3' style='text-align:left;'>Very easy</td>\
              <td colspan='4' style='text-align:right;'>Very difficult</td>\
          </tr>\
          <tr class='"+firstMethod+"'>\
            <td class='survey_header'>Automatic</td>\
            <td><input type='radio' name='"+"g_"+firstMethod+"' value='1' /></td>\
            <td><input type='radio' name='"+"g_"+firstMethod+"' value='2' /></td>\
            <td><input type='radio' name='"+"g_"+firstMethod+"' value='3' /></td>\
            <td><input type='radio' name='"+"g_"+firstMethod+"' value='4' /></td>\
            <td><input type='radio' name='"+"g_"+firstMethod+"' value='5' /></td>\
            <td><input type='radio' name='"+"g_"+firstMethod+"' value='6' /></td>\
            <td><input type='radio' name='"+"g_"+firstMethod+"' value='7' /></td>\
          </tr>\
          <tr class='"+secondMethod+"'>\
            <td class='survey_header'>Manual</td>\
            <td><input id='radStart' type='radio' name='"+"g_"+secondMethod+"' value='1' /></td>\
            <td><input type='radio' name='"+"g_"+secondMethod+"' value='2' /></td>\
            <td><input type='radio' name='"+"g_"+secondMethod+"' value='3' /></td>\
            <td><input type='radio' name='"+"g_"+secondMethod+"' value='4' /></td>\
            <td><input type='radio' name='"+"g_"+secondMethod+"' value='5' /></td>\
            <td><input type='radio' name='"+"g_"+secondMethod+"' value='6' /></td>\
            <td><input id='radEnd' type='radio' name='"+"g_"+secondMethod+"' value='7' /></td>\
          </tr>\
        </table>\
      </div>\
    ").appendTo(survey_el);
    var el_submit = $("\
        <div>\
            <button type='button' class='btn btn-lg btn-success'>Submit</button>\
        </div>\
    ");
    $(el_submit).find("button").click($.proxy(function() {
        var survey_result={"task":this.task_key, "firstMethod":this.firstMethod};
        $("div.survey_item").each(function(i,div) {
            var item_num = $(div).attr("number"); 
            var automatic_value = $(div).find("input[name='"+item_num+"_automatic']:checked").val();   
            var manual_value = $(div).find("input[name='"+item_num+"_manual']:checked").val();   
            survey_result[item_num]= {'automatic':automatic_value, 'manual':manual_value};
        });
        pg.log.add({type:"survey",survey_result:survey_result});
    },{task_key:task_key,firstMethod:firstMethod}));

    $(el_submit).appendTo(survey_el);
    return survey_el;
}










