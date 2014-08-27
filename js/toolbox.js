pg.Toolbox = function(target_el, items) {
	this.target_el = target_el;
	this.items = items;
	$(this.target_el).empty();
	var html = $("<div class='toolbar unselectable'>\
			<div class='title'>Actions</div>\
			<div class='menus'>\
			</div>\
		</div>\
		<div class='tool_container unselectable'>\
			<div class='cont actions_div'>\
				<label class='task_label'>Suggested for Current Node Values </label>\
				<ul class='task_list'></ul>\
			</div>\
			<div class='cont demo_div'>\
				<label class='demo_label'>Suggested for Recent Activity</label>\
				<ul class='task_list'></ul>\
			</div>\
			<div class='cont operation_div'>\
				<label class='operation_label'>Operations</label>\
				<input id='search_operation' type='text' placeholder='keyword search'></input>\
				<ul class='operation_list'></ul>\
			</div>\
		</div>\
	").appendTo(this.target_el);
	this.el_tools = $(target_el).find(".tool_container");
	this.ul_task = $(target_el).find(".actions_div").find(".task_list");
	this.ul_demo = $(target_el).find(".demo_div").find(".task_list");
	this.ul_operation = $(target_el).find(".operation_list");
	$(target_el).find("#search_operation").keyup(function(e) {
		if(e.which==27) {  $(this).val("");  }
		var keyword = ($(this).val()).toLowerCase();
		var op_items = $(this).parents(".operation_div").find("ul").find("li.operation_item");
		if(keyword.length>0) {
			for (var i=0;i<op_items.length; i++) {
				var op_type = ($(op_items[i]).attr("type")).toLowerCase();
				if(op_type.indexOf(keyword)==-1) {
					$(op_items[i]).css("opacity","0.3");
					if(e.which == 13) $(op_items[i]).hide();
				} else {
					$(op_items[i]).css("opacity","1.0");
					if(e.which == 13) $(op_items[i]).show();
				}
			}
		} else {
			$(op_items).css("opacity","1.0").show();
		}
	});
	this.redraw(this.items);
};


pg.Toolbox.prototype.redraw = function(_new_items) {
	if(_new_items) this.items = _new_items;
	$(this.el_tools).find('ul').empty();
	var li_el;
	$(this.el_tools).find("div.cont").hide();
	for(var i=0;i<this.items.length;i++) {
		var item = this.items[i];
		if(_.isArray(item)) {
			$(this.ul_task).append(this.renderTask(item));
			$(this.el_tools).find("div.actions_div").show();
		} else {
			$(this.ul_operation).append(this.renderOperation(item));
			$(this.el_tools).find("div.operation_div").show();
		}
	}
	// draw demoed actions
	var demo_actions = pg.history.inferredActions;
	if(demo_actions.length>0) {
		for(var i=0;i<demo_actions.length;i++) {
			$(this.ul_demo).append(this.renderDemo(demo_actions[i]));
			$(this.el_tools).find("div.demo_div").show();
		}
	}
};

pg.Toolbox.prototype.renderTask = function(nodes) {
	var task_li = $("<li class='task_item draggableItem' mode='big'><ul class='sub_op'></ul></li>");
	var ul = $(task_li).find("ul");
	for(var i in nodes) {
		ul.append(this.renderSubOperation(nodes[i]));
	}
	$("<label class='simple insert_task'>Apply to current node</label>").insertAfter(ul);
	var func_apply = $.proxy(function() {
		var currently_selected_node = pg.panel.get_current_node();
		var current_node_position = currently_selected_node.position;
		if(currently_selected_node) {
			pg.panel.insert(this.nodes, currently_selected_node);	
			var node_to_trigger = pg.panel.enhancement.get_node_by_position(current_node_position);
			pg.panel.enhancement.run_triggered_nodes([node_to_trigger]);
			//pg.panel.deselect();
			pg.panel.select(_.last(this.nodes));
			pg.panel.redraw();
		} else {
			// what should it do if there's no target nodes to insert at? 
		}
	},{nodes:nodes});
	$(task_li).click(func_apply);
	var curNode = pg.panel.get_current_node();
	if(curNode && curNode.P && nodes.length==1) {
		if(pg.planner.compare_operation(nodes[0].P,curNode.P)) {
			$(task_li).addClass("sameToCurrentNode");
		}
	} 
	return task_li;
};

pg.Toolbox.prototype.renderDemo = function(demo_action) {
	// demo_action consists of target_position string and nodes list
	var demo_li = $("<li class='task_item draggableItem' mode='big'><ul class='sub_op'></ul></li>");
	var ul = $(demo_li).find("ul");
	var nodes = demo_action.nodes;
	for(var i in nodes) {
		ul.append(this.renderSubOperation(nodes[i]));
	}
	$("<label class='simple insert_task'>Add to the target position</label>").insertAfter(ul);
	var func_apply = $.proxy(function() {
		var current_node_position;
		var currently_selected_node = pg.panel.get_current_node();
		if(currently_selected_node) 
			current_node_position = currently_selected_node.position;
		if(this.target_position==false) {
			_.each(this.nodes, function(n) {
				n.position = [n.position[0]+current_node_position[0], n.position[1]+current_node_position[1]];
			},this);	
		} else {
			_.each(this.nodes, function(n) {
				n.position = [n.position[0]+this.target_position[0], n.position[1]+this.target_position[1]];
			},this);	
		}
		pg.panel.enhancement.insert_at(this.nodes);
		// TRIGGER
		var position_to_trigger = (this.target_position)? this.target_position:current_node_position;
		var node_to_trigger = pg.panel.enhancement.get_node_by_position(position_to_trigger);
		pg.panel.enhancement.run_triggered_nodes([node_to_trigger]);
		pg.panel.select(_.last(this.nodes));
		pg.panel.redraw();
	},{nodes:nodes, target_position:demo_action.target_position});
	$(demo_li).click(func_apply);
	// var curNode = pg.panel.get_current_node();
	// if(curNode && curNode.P && nodes.length==1) {
	// 	if(pg.planner.compare_operation(nodes[0].P,curNode.P)) {
	// 		$(demo_li).addClass("sameToCurrentNode");
	// 	}
	// } 
	return demo_li;
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
		//if(value=="") value="___";
		desc_el = desc_el.replace(praw,"<span class='param' paramValue='"+value+"' paramKey='"+key+"'>"+trimText(value,40)+"</span>");
	});
	desc_el = $("<span>"+desc_el+"</span>");	// convert to jQuery element
	return desc_el;
};

// render default prototyp operations without inference
pg.Toolbox.prototype.renderOperation = function(op, _notDraggable) {
	try {
		var op_li = $("<li class='operation_item draggableItem' mode='small' kind='"+op.kind+"' type='"+op.type+"'>\
			<div class='op_icon'><i class='fa fa-"+op.icon+" fa-lg'></i></div>\
			<div class='op_type unselectable'>"+toTitleCase(op.type.replace("_"," "))+"</div>\
			<div class='op_description unselectable'>"+op.description+"</div>\
			<div class='op_actions'>\
				<button class='simple doc_button'>Show Documentation</button>\
			</div>\
			<label class='simple insert_task'>Apply to current node</label>\
		</li>");
	} catch(e) {
		console.error(e.stack);
	}
	if(op.applicable) $(op_li).attr("applicable","true");
	$(op_li).click($.proxy(function(e) {
		if($(e.delegateTarget).attr("mode")=="small") {
			$(e.delegateTarget).parent().find("li").attr("mode","small");
			$(e.delegateTarget).attr("mode","big"); 	
		} else {
			var node = pg.panel.get_current_node();
			if(node) {
				node.P = this.op;
				//pg.panel.enhancement.run_triggered_nodes([node]);
				pg.panel.redraw();	
			}
			//$(this).attr("mode","small"); 
		}
	},{op:op}));
	$(op_li).find(".doc_button").click(function(event) {
		// show documentation page
		event.stopPropagation();
	});
	// if(pg.panel.get_current_node()) {
	// 	$(op_li).find(".apply_button").show().click($.proxy(function(e) {
	// 		var node = pg.panel.get_current_node();
	// 		node.P = this.op;
	// 		pg.panel.enhancement.run_triggered_nodes([node]);
	// 		pg.panel.redraw();
	// 	},{op:op}));
	// }
	$(op_li).find(".doc_button").click(function(event) {
		// open reference page
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
