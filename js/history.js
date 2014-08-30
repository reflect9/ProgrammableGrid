pg.history = {
    init: function() {
        this.events = [];
        this.inferredActions = [];
    },
    reset: function() {
        this.events = [];
        this.inferredActions = [];  
    },
    put: function(event) {
        this.events.push(event);
        this.inferredActions = _.unique(_.union(this.inferredActions, this.infer()));
    },
    get_last_sequential_events: function() {
        var lastEvent = _.last(pg.history.events);
        var sameEvents = [];
        for(var i=this.events.length-1;i>=0;i--) {
            if(this.events[i].type==lastEvent.type) sameEvents.push(this.events[i]);
            else break; 
        }
        sameEvents.reverse();
        return sameEvents;
    },
    infer: function() {
        // look up pg.history.events and suggest something
        var validActions = [];
        var demo_action;
        // RULE. focus on the latest event, use previous ones that are related
        // Case 1. Attaching element to the targetted element
        //      1a.  the targeted elements exist on the grid
        //      1b.  target does not exist on the grid
        var eventList = this.get_last_sequential_events();
        if(eventList[0].type=='attach') {  // {type:'attach',el:el, target:target, loc:loc}
            demo_action = pg.planner.demos.demo_attach_element.generate(eventList);
        } else if(eventList[0].type=='set_attribute') {  //{type:'set_attribute',target:el,key:key,value:new_value}
            // Case 2. Setting element attributes
            //      2a. new values are single and not exist as node
            //      2b. new values exist as node
            demo_action = pg.planner.demos.demo_set_attribute.generate(eventList);
        } 
        // else if(eventList[0].type=='trigger') {  // {'trigger',el:event.target, ID:$(this).attr('creator_ID')}
        //     //  Case 3. Triggering UI component
        //     //      3a. the UI component is attached by Attach Element
        //     //      3b. not exist, should extract from page
        //     demo_action = pg.planner.demos.demo_trigger.generate(eventList);
        // }
        validActions.push(demo_action);
        this.inferredActions = validActions;
        pg.toolbox.redraw();
    }
};