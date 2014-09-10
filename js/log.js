pg.log = {
    init: function() {
        // this.items = [];
        // this.items_sent = [];
        this.active=false;
    },
    add: function(detail) {
        if(this.active==false) return;
        if(pg.task_name.indexOf("practice") > -1) return;
        var item={};
        item.timestamp = Date.now();
        item.mode = (pg.mode)?pg.mode:"unspecified";
        item.detail = detail;
        item.user = (pg.subject_name)? pg.subject_name:'guest';
        // this.items.push(item);
        this.send(item);
    },
    send: function(item) {
        if(this.active==false) return;
        chrome.runtime.sendMessage({
            action:"log", 
            message: { 
                'item':JSON.stringify(item)
            } 
        });
        // if(this.items_sent.length==0) {
        //     if(this.items.length==0) return;  // nothing to send
        //     chrome.runtime.sendMessage({
        //         action:"log", 
        //         message: { 
        //             'items':JSON.stringify(this.items)
        //         } 
        //     });
        //     // move items to sent items
        //     this.items_sent = _.clone(this.items);  
        //     this.items = [];
        // } else {
        //     // items_sent is not flushed yet.  Still waiting for the completion message from the server
        //     return;
        // }
    },
    send_completed: function() {
        this.items_sent = [];
    }
};