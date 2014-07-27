pg.Toolbox = function(target_el, items) {
	this.target_el = target_el;
	this.items = items;
	$(this.target_el).empty();
	var html = $("<div class='toolbar unselectable'>\
			<div class='title'>Tools</div>\
			<div class='menus'>\
			</div>\
		</div>\
		<div class='tool_container unselectable'>\
			<label class='task_label'>Matching Tasks</label>\
			<ul class='task_list'></ul>\
			<label class='operation_label'>Operations applicable to Input nodes</label>\
			<ul class='operation_list'></ul>\
			<label class='operation_rest_label'>Available Operations</label>\
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
			$(this.ul_operation).append(this.renderEmptyOperation(item));
			$(this.el_tools).find("label.operation_label").show();
		} else {
			$(this.ul_operation_rest).append(this.renderEmptyOperation(item));
			$(this.el_tools).find("label.operation_rest_label").show();
		}
	}
	console.log("done toolbox redrawing");
};

pg.Toolbox.prototype.renderTask = function(nodes) {
	var task_li = $("<li class='task_item draggableItem' mode='big'><ul class='sub_op'></ul></li>");
	var ul = $(task_li).find("ul");
	for(var i in nodes) {
		ul.append(this.renderSubOperation(nodes[i]));
	}
	$("<button class='simple insert_button'>Insert this task</button>")
		.click($.proxy(function() {
			var currently_selected_node = pg.panel.get_current_node();
			if(currently_selected_node) {
				pg.panel.insert(this.nodes, currently_selected_node);	
			} else {
				// what should it do if there's no target nodes to insert at? 
			}
		},{nodes:nodes}))
		.insertAfter(ul);
	$(task_li).click(function() {
		if($(this).attr("mode")=="small") {
			//$(this).parent().find("li").attr("mode","small");
			$(this).attr("mode","big"); 	
		} 
		else $(this).attr("mode","small"); 
	});
	return task_li;
};

// render inferred operation with parameters
pg.Toolbox.prototype.renderSubOperation = function(node) {
	var node_li = $("<li class='sub_op_item' kind='"+node.P.kind+"' type='"+node.P.type+"'>\
		<div class='op_icon'><i class='fa fa-"+node.P.icon+" fa-lg'></i></div>\
		<div class='op_type unselectable'>"+toTitleCase(node.P.type.replace("_"," "))+"</div>\
		<div class='op_description unselectable'></div>\
		<div class='op_actions'></div>\
	</li>");
	$(node_li).find(".op_description").append(this.renderNodeDescription(node));
	return node_li;
};


pg.Toolbox.prototype.renderNodeDescription = function(node) {
	if(!node || typeof node.P==='undefined' || typeof node.P.description==='undefined') 
		return "No Description is available"
	var desc = node.P.description;
	var desc_el = desc;
	var params_raw = desc.match(/\[\w+\]/g);
	if (params_raw===null) return desc;
	_.each(params_raw, function(praw) { // replace [key] to span element text
		var key = praw.replace(/\[|\]/g,'');
		if(typeof node.P.param==='undefined' || !(key in node.P.param)) return;
		var value = node.P.param[key];
		if(value=="") value="___";
		desc_el = desc_el.replace(praw,"<span class='param' paramKey='"+key+"'>"+value+"</span>");
	});
	desc_el = $("<span>"+desc_el+"</span>");	// convert to jQuery element
	return desc_el;
};

// render default prototyp operations without inference
pg.Toolbox.prototype.renderEmptyOperation = function(op, _notDraggable) {
	var op_li = $("<li class='operation_item draggableItem' mode='small' kind='"+op.kind+"' type='"+op.type+"'>\
		<div class='op_icon'><i class='fa fa-"+op.icon+" fa-lg'></i></div>\
		<div class='op_type unselectable'>"+toTitleCase(op.type.replace("_"," "))+"</div>\
		<div class='op_description unselectable'>"+op.description+"</div>\
		<div class='op_actions'>\
			<button class='simple doc_button'>Show Documentation</button>\
			<button class='simple apply_button hidden'>Apply to the current node</button>\
		</div>\
	</li>");
	if(op.applicable) $(op_li).attr("applicable","true");
	$(op_li).click(function() {
		if($(this).attr("mode")=="small") {
			$(this).parent().find("li").attr("mode","small");
			$(this).attr("mode","big"); 	
		} 
		else $(this).attr("mode","small"); 
	});
	$(op_li).find(".doc_button").click(function(event) {
		// show documentation page
		event.stopPropagation();
	});
	if(pg.panel.get_current_node()) {
		$(op_li).find(".apply_button").show().click($.proxy(function(e) {
			var node = pg.panel.get_current_node();
			node.P = this.op;
			pg.panel.redraw();
		},{op:op}));
	}
	$(op_li).find(".doc_button").click(function(event) {

	});
	if(_notDraggable) { }
	else {
		$(op_li).draggable({
			revert: "invalid", // when not dropped, the item will revert back to its initial position
			helper: "clone",
			appendTo: "#pg",
			containment: "DOM",
			//cursor: "move",
			start: $.proxy(function(event, ui) {
				pg.toolbox.draggingOperation = this.op;
			},{op:op})			
		});
	}


	return op_li;
};
