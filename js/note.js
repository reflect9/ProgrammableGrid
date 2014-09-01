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
        <div class='note_title'>"+this.title+"</div>\
        <div class='note_description'>"+this.description+"</div>\
        <i class='fa fa-times close_button'></i>\
    </div>");
    $(el).find('.close_button').click(function(e) {
        $(this).parents(".note").draggable('destroy');
        $(this).parents(".note").remove();
        e.stopPropagation();
    });
    $(el).draggable().css("position","absolute");
    $(el).css({
        width:DEFAULT_NODE_DIMENSION*this.width, height:DEFAULT_NODE_DIMENSION*this.height,
        top:DEFAULT_NODE_DIMENSION*this.position[0],
        left:DEFAULT_NODE_DIMENSION*this.position[1]
    });
    return el;
};
