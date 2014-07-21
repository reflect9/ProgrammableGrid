pg.Toolbox = function(target_el, items) {
	this.target_el = target_el;
	this.items = items;
	$(this.target_el).empty();
	var html = $("<div class='toolbar'>\
			<i class='fa fa-bars nav-icon'></i>\
			<div class='title'>Operations</div>\
			<div class='menus'>\
			</div>\
		</div>\
		<div class='tool_container unselectable'>\
			<label class='task_label'>Matching Tasks</label>\
			<ul class='task_list'></ul>\
			<label class='operation_label'>Applicable Operations</label>\
			<ul class='operation_list'></ul>\
			<label class='operation_rest_label'>Other Operations</label>\
			<ul class='operation_rest'></ul>\
		</div>\
	").appendTo(this.target_el);
	this.el_tools = $(target_el).find(".tool_container");
	this.ul_task = $(target_el).find(".task_list");
	this.ul_operation = $(target_el).find(".operation_list");
	this.ul_operation_rest = $(target_el).find(".operation_rest");
	this.redraw(this.items);
};


pg.Toolbox.prototype.redraw = function(_new_items) {
	if(_new_items) this.items = _new_items;
	$(this.el_tools).find('ul').empty();
	var li_el;
	$(this.el_tools).find("label").hide();
	for(var i in this.items) {
		var item = this.items[i];
		if(_.isArray(item)) {
			$(this.ul_task).append(this.renderTask(item));
			$(this.el_tools).find("label.task_label").show();
		} else if(item.applicable) {
			$(this.ul_operation).append(this.renderOperation(item));
			$(this.el_tools).find("label.operation_label").show();
		} else {
			$(this.ul_operation_rest).append(this.renderOperation(item));
			$(this.el_tools).find("label.operation_rest_label").show();
		}
	}
};

pg.Toolbox.prototype.renderTask = function(task) {
	var task_li = $("<li class='task_item draggableItem'></li>");
	for(var i in task) {
		task_li.append(this.renderOperation(task[i]));
	}
	return task_li;
};


pg.Toolbox.prototype.renderOperation = function(op, _notDraggable) {
	var op_li = $("<li class='operation_item draggableItem' mode='small' kind='"+op.kind+"' type='"+op.type+"'>\
		<div class='op_icon'><i class='fa fa-"+op.icon+" fa-lg'></i></div>\
		<div class='op_type unselectable'>"+toTitleCase(op.type.replace("_"," "))+"</div>\
		<div class='op_description unselectable'>"+op.description+"</div>\
	</li>");
	if(op.applicable) $(op_li).attr("applicable","true");
	$(op_li).click(function() {
		if($(this).attr("mode")=="small") {
			$(this).parent().find("li").attr("mode","small");
			$(this).attr("mode","big"); 	
		} 
		else $(this).attr("mode","small"); 
	});
	if(_notDraggable) { }
	else {
		$(op_li).draggable({
			revert: "invalid", // when not dropped, the item will revert back to its initial position
			helper: "clone",
			appendTo: "#pg",
			containment: "DOM",
			cursor: "move",
			start: $.proxy(function(event, ui) {
				pg.toolbox.draggingOperation = this.op;
			},{op:op})			
		});
	}


	return op_li;
};
