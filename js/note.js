pg.Note = function(_note) {
    this.id = (_note && typeof _note.id !== 'undefined') ? _.clone(_note.id) : "note-"+makeid();
    this.title = (_note && typeof _note.title !== 'undefined') ? _.clone(_note.title) : "title";
    this.description = (_note && typeof _note.description !== 'undefined') ? _.clone(_note.description) : "description";
    this.position = (_note && typeof _note.position !== 'undefined') ? _.clone(_note.position) : [0,0];
    this.width = (_note && typeof _note.width !== 'undefined') ? _.clone(_note.width) : 1;
    this.height = (_note && typeof _note.height !== 'undefined') ? _.clone(_note.height) : 1;
};

pg.Note.prototype.render = function() {
    var el = $("<div class='note'>\
        <i class='fa fa-caret-left arrow_left'></i>\
        <div class='note_title'>"+this.title+"</div>\
        <div class='note_description'>"+this.description+"</div>\
        <i class='fa fa-times close_button'></i>\
        <button type='button' class='btn btn-info start_problem'>START</button>\
        <button type='button' class='btn btn-danger done_problem hidden'>DONE <span class='timer'>0</span></button>\
    </div>");
    if(pg.task_name.indexOf("practice") > -1) {
        $(el).find(".start_problem").css("visibility","hidden");
    } else {
        $(el).find(".start_problem").click(function() {
            if($(this).parents("#tiles").find(".note[status='running']").length>0) {
                alert("There is a problem still running. Finish it before starting next problems.");
                return;
            }
            var note_el = $(this).parents(".note"); 
            var title = $(note_el).find(".note_title").text();
            var description = $(note_el).find(".note_description").text();
            $(note_el).attr("status","running");
            pg.log.add({type:'problem_start',title:title, description:description});    
            $(this).hide();
            $(note_el).find(".done_problem").removeClass("hidden").show();
            var done_button = $(note_el).find(".done_problem");

            // set timer for problem
            $(done_button).find("span.timer").text("0");  // reset timer
            pg.task_timer = setInterval($.proxy(function() {
                var nextSec = parseInt($(this.button).find(".timer").text())+1;
                $(this.button).find(".timer").text(nextSec);
            },{button:done_button}),1000);
            pg.panel.deselect();
        });
    }

    $(el).click(function(e) { 
        e.stopPropagation();
    });


    $(el).find(".done_problem").click(function() {
        var note_el = $(this).parents(".note"); 
        var title = $(note_el).find(".note_title").text();
        var description = $(note_el).find(".note_description").text();
        $(note_el).removeAttr("status","done");
        pg.log.add({type:'problem_done',title:title, description:description, duration:$(this).find(".timer").text()});    
        $(this).addClass("hidden").hide();
        $(note_el).find(".start_problem").text("RE-START").removeClass("hidden").show();
        clearInterval(pg.task_timer);
        pg.panel.deselect();
    });

    $(el).find('.close_button').click(function(e) {
        $(this).parents(".note").draggable('destroy');
        $(this).parents(".note").remove();
        e.stopPropagation();
    });
    $(el).draggable({
        // start:$.proxy(function(event, ui) {
        //     if(typeof $(event.target).attr('clicked')=='undefined') {
        //         $(event.target).attr('clicked','true');
        //         pg.log.add({type:'problem_start',title:this.title, description:this.description});    
        //     }
        // },{title:this.title, description:this.description})
    }).css("position","absolute");
    $(el).css({
        'width':DEFAULT_NODE_DIMENSION*this.width, 'min-height':DEFAULT_NODE_DIMENSION*this.height,
        'top':DEFAULT_NODE_DIMENSION*this.position[0],
        'left':DEFAULT_NODE_DIMENSION*this.position[1]
    });
    return el;
};

