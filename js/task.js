pg.task = {
    calculation : {
        json: {"id":"eWeeA","title":"Task - Calculation","active":true,"nodes":[{"I":["_above","_left"],"ID":"ZJxtq","P":{"kind":"flow","type":"trigger","icon":"bell","param":{"event_source":"page"},"description":"Trigger the following nodes when [event_source] is loaded, clicked, or changed."},"V":[],"selected":false,"position":[0,1],"type":"trigger","executed":false},{"I":["ZJxtq"],"ID":"10UcH","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[1,2],"type":"literal","executed":true},{"I":["ZJxtq"],"ID":"tuORp","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[2,0,2]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[2,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"kLKrk","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,2,3]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[4,2],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"tmDR5","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[100]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[5,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"2DQJV","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,9,-5]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[7,1],"type":"literal","executed":true},{"I":["ZJxtq","_left"],"ID":"di7Cc","P":{"kind":"transform","type":"literal","icon":"quote-right","param":{"source":"[1,9,-5]"},"description":"Directly set the current node data to [source]."},"V":[],"selected":false,"position":[9,1],"type":"literal","executed":true}],"notes":[{"id":1,"title":"Problem 1","description":"Add every number in [1,2,3] with [2,0,2]. <br> => The result should be [3,2,5]","position":[2,2],"width":3,"height":1},{"id":2,"title":"Problem 2","description":"Multiply numbers in [3,2,1] with [100]. <br> => The result should be [300,200,100]","position":[5,2],"width":3,"height":1},{"id":3,"title":"Problem 3","description":"Sort [1,9,-5] increasing order. <br> => The result should be [-5,9,1]","position":[7,2],"width":3,"height":1},{"id":4,"title":"Problem 4","description":"Add all numbers in [4,1,1]. <br> => The result should be [6]","position":[9,2],"width":3,"height":1}],"domain":["http://takyeonlee.com/tandem-learn/practice1.html"],"timestamp":1409541357958},
        notes: [
            {   id:1, 
                title:"Problem 1",
                description:"Add every number in [1,2,3] with [2,0,2]. <br> => The result should be [3,2,5]",
                position: [2,2],
                width:3, height:1
            },
            {   id:2, 
                title:"Problem 2",
                description:"Divide numbers [15,5,20] by [5]. <br> => The result should be [3,1,4]",
                position: [5,2],
                width:3, height:1
            },
            {   id:3, 
                title:"Problem 3",
                description:"Arrange [1,9,-5] in increasing order. <br> => The result should be [-5,9,1]",
                position: [7,2],
                width:3, height:1
            },
            {   id:4, 
                title:"Problem 4",
                description:"Add all numbers in [4,1,1]. <br> => The result should be [6]",
                position: [9,2],
                width:3, height:1
            }
        ]
    },
    extraction : {
        json: ''
    },
    filter : {
        json: ''
    },
    attach_element : {
        json: ''
    },
    set_attribute : {
        json: ''
    }
};
pg.task.get_enhancement = function(task_key) {
    if(!pg.task[task_key]) return false;
    var enh = new pg.Enhancement(pg.task[task_key].json);
    enh.notes = _.map(pg.task[task_key].notes, function(note) {
        return new pg.Note(note);
    });
    return enh;
};