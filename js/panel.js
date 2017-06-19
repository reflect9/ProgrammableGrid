pg.panel = {
	init: function(target, _enhancement){
		console.log("init start");
		pg.panel.targetEl = target;
		$(target).empty();
		this.enhancement = _enhancement;
		this.commands = [];
		this.selected_element;
		this.node_dimension = DEFAULT_NODE_DIMENSION;
		this.el = $("<div id='plate_container'>\
						<div id='overlay'>\
							<svg></svg>\
						</div>\
						<div id='tiles'></div>\
						<div id='plate'></div>\
					</div>").appendTo(target);
		$("#pg_spacer").height($(this.el).height());
		pg.info.update(this.enhancement);
		if(this.enhancement.notes) {
			_.each(this.enhancement.notes, function(note) {
				var note_el = note.render();
				pg.panel.el.find("#tiles").append(note_el);
			});
		}
		console.log("redraw start");
		pg.panel.redraw();
		pg.toolbox.redraw(pg.planner.get_all_operations());
	},
	close: function() {
		$(pg.panel.targetEl).empty();
	},
	get_nodes: function() {
		return this.enhancement.get_nodes();
	},
	pan: function(loc) {
		$("#pg_panel > #plate_container").animate({scrollTop: loc[0], scrollLeft: loc[1]}, 600);
	},
	p2c: function(position) {
		// convert position to coordinate on plate element
		return [position[0]*this.node_dimension, 
				position[1]*this.node_dimension];
	},
	select: function(node) {
		window.curnode = node;
		var node_el = $("#"+node.ID).get(0);
		$(node_el).attr("selected",true);
		_.each(pg.panel.get_nodes(), function(n) { n.selected=false; });
		pg.panel.node_show_inputs(node);
		node.selected = true;
		pg.history.reset();
		pg.panel.commandUI.create();
		pg.panel.commandUI.redraw();
		pg.panel.commandUI.turn_inspector(true);
	},
	deselect: function() {
		pg.panel.commandUI.updateAllParameters();
		pg.inspector.unhighlight_list();
		pg.inspector.off(pg.panel.dataUI.remove);
		$("#tiles .node").removeAttr("selected");
		_.each(pg.panel.get_nodes(), function(n) { n.selected=false; pg.panel.node_hide_inputs(n);});
		pg.panel.commandUI.remove();
		pg.panel.commandUI.turn_inspector(false);
		pg.panel.node_select_modal_off();
		pg.panel.redraw();
		pg.toolbox.redraw(pg.planner.get_all_operations());
	},
	delete: function(target_nodeObj) {
		pg.inspector.unhighlight_list();
		pg.inspector.off(pg.panel.dataUI.remove);
		if(!target_nodeObj) target_nodeObj = pg.panel.get_current_node();
		pg.panel.enhancement.delete(target_nodeObj);
		this.commandUI.remove();
		this.redraw();
	},
	clear: function(target_nodeObj) {
		if(!target_nodeObj) target_nodeObj = pg.panel.get_current_node();
		target_nodeObj.P=undefined;
		pg.panel.redraw();
	},
	empty: function(target_nodeObj) {
		if(!target_nodeObj) target_nodeObj = pg.panel.get_current_node();
		target_nodeObj.V=[];
		pg.panel.redraw();
	},
	insert: function(new_nodes, target_node) {
		pg.panel.enhancement.insert(new_nodes, target_node);

		pg.panel.redraw();
	},

	clone_node: function(_node) {
		var node = (_node)? _node: pg.panel.get_current_node();
		var literal_P = jsonClone(pg.planner.operations.literal.proto);
		var newNode = pg.Node.create({type:"literal", I:[node.ID], P:literal_P, V:node.V, position:clone(node.position)});
		pg.panel.enhancement.push_at([newNode],newNode.position);
	},	
	duplicate_node: function(_node){
		// find empty spaces nearby
		var node = (_node)? _node: pg.panel.get_current_node();
		var newNode = pg.Node.duplicate(node);
		var candDiff = [[1,0],[-1,0],[0,1],[0,-1]];
		for(var i in candDiff) {
			var newPos = [newNode.position[0]+candDiff[i][0],newNode.position[1]+candDiff[i][1]];
			if(pg.panel.enhancement.get_node_by_position(newPos)==false) {
				newNode.position = newPos;
				pg.panel.get_nodes().push(newNode);
				pg.panel.redraw();
				return;
			}
		}
		alert("To duplicate a node, the node must have an empty neighbor tile.");
	},
	share_node_across_tabs: function(_node_list) {
		var node_list = (_node_list)? _node_list: pg.panel.get_current_node();
		var jsonList = serialize_nodes(_.toArray(node_list));
		chrome.runtime.sendMessage({
			action:"shareNodes", 
			message: { 
				'jsonList': jsonList,
				'href': window.location.href
			} 
		});
	},
	copy_script: function() {
		// store current script at the background page
		pg.panel.copy_nodes(pg.panel.get_nodes());
	},
	paste_script: function() {
		// ask background script for script
		chrome.runtime.sendMessage({
			action:"paste_nodes"
		},function(response) { // deal with nodes
			pg.panel.fetch_json_nodes(response);
		});
	},
	copy_nodes: function(_node_list) {
		if(!_node_list) return false;
		var jsonList = serialize_nodes(_node_list);
		chrome.runtime.sendMessage({
			action:"copy_nodes",
			message: {
				'jsonList': jsonList,
				'href': window.location.href 
			}
		});
	},
	fetch_json_nodes: function(message) {
		console.log(message);
		if(!message) return;
		var node_list = _.map(message.jsonList, function(json_node) {
			var node = JSON.parse(json_node);
			node.V = _.map(node.V, function(v) {
				if(_.isArray(v) && _.isString(v[0])) { // v is jsonML 
					return jsonML2dom(v);
				} else return v;
			});
			return node;
		});
		pg.panel.enhancement.insert(node_list);
		pg.panel.redraw();
	},

	share_elements: function(els) {
		var jsonList = _.map(els, function(el) { return dom2jsonML(el); });
		console.log("copied:" + jsonList);
		chrome.runtime.sendMessage({
			action:"shareElements", 
			message: { 
				'jsonList': jsonList,
				'href': window.location.href
			} 
		});
	},
	paste_elements: function(message) {
		console.log(message);
		if(!message) return;
		// var el_list = _.map(message.jsonList, function(json) {
		// 	return jsonML2dom(json);
		// });
		var node = pg.Node.create();
		node.type="literal_element";
		node.P = pg.planner.get_prototype({type:'literal_element', param:{jsonML:message.jsonList}});
		pg.panel.enhancement.insert([node]);
	},

///////////////////////////////////////////////////////////////////
///  Node Input setters and highlighters
///////////////////////////////////////////////////////////////////
	node_select_modal_on: function(i) {
		$(".node .node_cover .nth-input-text").html("input"+(i+1)).removeClass("hidden").addClass("select_modal");
		$(".node .node_cover").show();
		$(".node .node_cover").removeClass("notClickable");
		$(".node .node_cover").click($.proxy(function(e) {
			var _id = $(e.target).parents(".node").attr("id");
			//console.log(_id + " is selected as "+this.i+"-th input");
			$("#pg_command_ui").find("input[inputNodeIdx='"+this.i+"']").val(_id);
			(pg.panel.get_current_node()).I[this.i]=_id;
			e.stopPropagation();
			pg.panel.node_select_modal_off();
			pg.panel.redraw();
		},{i:i}));
	},
	node_select_modal_off: function() {
		$(".node .node_cover").addClass("notClickable");
		$(".node .node_cover .nth-input-text").empty().addClass("hidden").removeClass("select_modal");
		$(".node .node_cover").hide().unbind('click');
	},
	node_show_inputs: function(node) {
		//$(".node .node_cover .nth-input-text").empty().removeClass("hidden");
		$("#"+node.ID).find('.nth-input').show();
		_.each(node.I, function(input_node_id, n_th) {
			var input_node = pg.panel.enhancement.get_node_by_id(input_node_id, node);
			if(!input_node) return;
			//$(".node[id='"+input_node.ID+"'] .node_cover .nth-input-text").text("I"+(n_th+1));

			$(".node[id='"+input_node.ID+"'] .node_cover").addClass('notClickable').show();
			if(input_node_id=='_left' || input_node_id=='_right'|| input_node_id=='_above'|| input_node_id=='_below') {
				return;
			} else {
				pg.panel.drawConnector_two_nodes(input_node, node, n_th+1);	
			}
		});
		// show following nodes as well
		// _.each(pg.panel.get_next_nodes(node), function(fn){
		// 	pg.panel.drawConnector_two_nodes(node, fn, '');	
		// })
	},
	node_hide_inputs: function(node) {
		$("#"+node.ID).find('.nth-input').hide();
		$(".node .node_cover .nth-input-text").empty();
		$(".node .node_cover").removeClass('notClickable').hide();
		pg.panel.clearConnector();
	},
	get_current_node:function() {
		return _.map($("#tiles .node[selected]").toArray(), function(nodeEl) {
			return pg.panel.get_node_by_id($(nodeEl).prop('id'));
		})[0];
	},
	get_adjacent_node:function(direction, node, _allNodes) {
		return pg.panel.enhancement.get_adjacent_node(direction, node, _allNodes);
	},
	get_node_by_id: function(node_id, reference_output_node, _allNodes) {
		return pg.panel.enhancement.get_node_by_id(node_id, reference_output_node, _allNodes);
	},
	get_node_by_position: function(position, _allNodes) {
		return pg.panel.enhancement.get_node_by_position(position, _allNodes);	
	},	
	get_next_nodes:function(node, _reachableNodes, _allNodes) {
		return pg.panel.enhancement.get_next_nodes(node, _reachableNodes, _allNodes);		
	},
	get_reachable_nodes: function(_starting_nodes, _allNodes, _include_triggers) {
		return pg.panel.enhancement.get_reachable_nodes(_starting_nodes, _allNodes, _include_triggers);
	},
	get_informative_nodes:function(nodes) {
		return pg.panel.enhancement.get_informative_nodes(nodes);
	},
	get_prev_nodes:function(node, _allNodes) {	
		return pg.panel.enhancement.get_prev_nodes(node, _allNodes);
	},
	get_ready_nodes:function(_candidateNodes, _allNodes) {
		return pg.panel.enhancement.get_ready_nodes(_candidateNodes, _allNodes);
	},
	el_to_obj:function(el) {
		return pg.panel.enhancement.get_node_by_id($(el).prop('id'));
	},
	print: function(nodes) {
		return pg.panel.enhancement.print(nodes);
	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  executions methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	execute:function() {
		var page_triggers = _.filter(pg.panel.get_nodes(), function(node) {
			return 	node.P && node.P.param && node.P.type=='trigger' && 
					node.P.param.event_source=="page"; 
		});
		var triggered = _.uniq(_.flatten(_.map(page_triggers, function(t){ return pg.panel.enhancement.get_next_nodes(t); })));
		_.each(pg.panel.get_nodes(), function(n) { n.executed=false; n.V=[]; });
		pg.panel.run_triggered_nodes(triggered, false, false);
	},
	run_node: function(nodeObj, skip_redraw) {
		pg.panel.enhancement.run_node(nodeObj);
		if(skip_redraw){  }
		else pg.panel.redraw();
	},
	run_triggered_nodes: function(starting_nodes, _nodes, skip_redraw) {
		pg.panel.enhancement.run_triggered_nodes(starting_nodes, _nodes, skip_redraw);
		pg.panel.redraw();
	},
	infer: function(output_node) {
		var Is = _.map(output_node.I, function(input_id) {
			return pg.panel.enhancement.get_node_by_id(input_id, output_node);
		});
		var O = output_node;
		if(O.V.length==0) {
			return pg.planner.find_applicable_operations(Is); // return a list of operations
		} else {
			// if(Is.length>0) {
			return pg.planner.plan(Is, O);	
			// } else {
			// 	return [];
			// }
		}
	},


	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  view methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	redraw: function() {
		// pg.save_enhancement(pg.panel.title,pg.panel.get_nodes());
		var nodes = pg.panel.get_nodes();
		$("#pg_panel > #plate_container > #tiles > .node").remove();
		_.each(nodes, function(n,ni){
			try{
				pg.Node.draw(n,this.node_dimension);
			} catch(e) {
				console.error(e.stack);
			}
		},this);
		this.attachEventListeners();
		pg.panel.clearConnector();
		if(pg.panel.get_current_node()) {
			var n = pg.panel.get_current_node();
			pg.panel.deselect();
			pg.panel.select(n);
		}
		console.log("draw connector nodes");
		pg.panel.drawConnector_node_list();
		console.log("redraw toolbox");

		//pg.toolbox.redraw(pg.planner.get_all_operations());
	},
	drawPlate: function() {
		pg.panel.plateDrawn=true;
		var el_plate = $("#pg_panel > #plate_container > #plate");
		$(el_plate).children().remove();
		var canvas = $("<canvas id='plate_canvas' width='3000' height='3000'></canvas>");
		$(el_plate).append(canvas);
		var ctx = canvas.get(0).getContext("2d");
		ctx.strokeStyle = "#ddd";
		var num_row = Math.round(DEFAULT_PLATE_DIMENSION / this.node_dimension);
		var num_col = Math.round(DEFAULT_PLATE_DIMENSION / this.node_dimension);
		for (r=0;r<num_row;r++) {
			for(c=0;c<num_col;c++) {
				ctx.moveTo(c*this.node_dimension, r*this.node_dimension-5);
				ctx.lineTo(c*this.node_dimension, r*this.node_dimension+5);
				ctx.stroke();
				ctx.moveTo(c*this.node_dimension-5, r*this.node_dimension);
				ctx.lineTo(c*this.node_dimension+5, r*this.node_dimension);
				ctx.stroke();
				// ctx.fillRect(	c*this.node_dimension+NODE_MARGIN, r*this.node_dimension+NODE_MARGIN, 
								// this.node_dimension-NODE_MARGIN*2, this.node_dimension-NODE_MARGIN*2);		
			}
		}
	},
	drawConnector_node_list: function(_nodes) {
		var node_list = _nodes || pg.panel.get_nodes();
		_.each(node_list, function(n) {
			var n_el = $(".node#"+n.ID); 
			if(n_el.length==0) return;
			_.each(n.I, function(inp_n_id,idx){
				if(pg.panel.enhancement.get_adjacent_node(inp_n_id, n)!= false) {
					$(n_el).attr('border'+inp_n_id,true);	
					$(n_el).find(".node_borders").find("."+inp_n_id.slice(1)).find(".nth-input").text(idx+1);
				} else {
					// var from_node_el = $(".node#"+inp_n_id);
					// var to_node_el = $(".node#"+n.ID);
					// if(from_node_el.length==0 || to_node_el.length==0) return;
					// pg.panel.drawConnector($(from_node_el).position(), $(to_node_el).position());
				}
			});
		});
	},
	drawConnector_two_nodes: function(_fromNode, _toNode, nth_input) {
		var from_node_el = $(".node#"+_fromNode.ID);
		var to_node_el = $(".node#"+_toNode.ID);
		if(from_node_el.length==0 || to_node_el.length==0) return;
		pg.panel.drawConnector(from_node_el, to_node_el, nth_input);
	},
	drawConnector: function(_fromEl, _toEl, nth_input) {
		// draw connecting line at the #pg_panel>#plate_container>#overlay>svg
		var marginPortion = 0.1;
		var margin = $(_fromEl).width()*marginPortion;
		var fromPos = {left: $(_fromEl).position().left+margin, top:$(_fromEl).position().top+$(_fromEl).height()-margin};
		var toPos = {left: $(_toEl).position().left+margin, top:$(_toEl).position().top+margin};

		// var qPos = {left:fromPos.left+10, top:fromPos.top};
		// var midPos = {left:(fromPos.left+toPos.left)/2, top:(fromPos.top+toPos.top)/2};

		var svg = $("#pg_panel > #plate_container > #overlay > svg");
		// var newPath = document.createElementNS('http://www.w3.org/2000/svg','path');
		// var d = "M"+fromPos.left+","+fromPos.top+" Q "+qPos.left+","+qPos.top+" "+midPos.left+","+midPos.top+" T"+toPos.left+","+toPos.top;
		// newPath.setAttribute('d',d);
		// newPath.setAttribute('class','path_connector');
		// $(svg).append(newPath);
		var newLine_shadow = document.createElementNS('http://www.w3.org/2000/svg','line');
		newLine_shadow.setAttribute('x1',fromPos.left+1); 	newLine_shadow.setAttribute('y1',fromPos.top);
		newLine_shadow.setAttribute('x2',toPos.left+1); 	newLine_shadow.setAttribute('y2',toPos.top);
		newLine_shadow.setAttribute('class','path_connector_shadow');
		$(svg).append(newLine_shadow);

		var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
		newLine.setAttribute('x1',fromPos.left); 	newLine.setAttribute('y1',fromPos.top);
		newLine.setAttribute('x2',toPos.left); 	newLine.setAttribute('y2',toPos.top);
		newLine.setAttribute('class','path_connector');
		$(svg).append(newLine);
		
		if(typeof nth_input !== 'undefined') {
			// var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
			// circle.setAttribute('cx', fromPos.left);	circle.setAttribute('cy', fromPos.top);
			// circle.setAttribute('r', "10");
			// $(svg).append(circle);
			var rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
			rect.setAttribute('x', fromPos.left-6);	rect.setAttribute('y', fromPos.top-6);
			rect.setAttribute('rx', 2);	rect.setAttribute('ry', 2);
			rect.setAttribute('width', 12);	rect.setAttribute('height', 12);
			$(svg).append(rect);
			var nth =  document.createElementNS('http://www.w3.org/2000/svg','text');
			nth.setAttribute('text-anchor','middle');
			nth.setAttribute('x',fromPos.left);
			nth.setAttribute('y',fromPos.top+4);  nth.setAttribute('fill','gray');
			$(nth).text(nth_input);
			$(svg).append(nth);

		}

	},
	clearConnector: function() {
		$("#pg_panel > #plate_container > #overlay > svg").empty();
	},


	///////////////////////////////////////////////////////////////////
	///  inspector UI
	///////////////////////////////////////////////////////////////////
	dataUI: {
		create: function(el, pos) {
			if(pg.panel.selected_element && pg.panel.selected_element==el) {
				pg.panel.dataUI.remove();
				pg.panel.selected_element = null;
				return;
			} else {
				pg.panel.selected_element = el; 
				pg.panel.dataUI.remove();
			}
			var ui_el = $("<div id='pg_data_ui'>\
					<div class='parents_list'></div>\
					<div class='pg_data_tools'></div>\
					<div class='pg_data_table'></div>\
				</div>\
				");
			var parents_el = $(ui_el).find(".parents_list").get(0);  
			var tools_el = $(ui_el).find(".pg_data_tools").get(0);  
			var attributes_el = $(ui_el).find(".pg_data_table").get(0);  

			pg.panel.data_selection_box = new pg.SelectionBox(3);
			pg.panel.data_selection_box.highlight(el);
		
			_.each($($(el).parentsUntil('html').get().reverse()), function(p) {
				$("<span>"+$(p).prop("tagName")+"&gt; </span>").click($.proxy(function() {
					pg.panel.dataUI.create(this.p, pos);
				},{p:p}))
				.hover($.proxy(function(){
					pg.panel.parent_selection_box = new pg.SelectionBox(3, '#0000FF');
					pg.panel.parent_selection_box.highlight(this.p);
				},{p:p}),function(){
					if(pg.panel.parent_selection_box) {
						pg.panel.parent_selection_box.hide();
						pg.panel.parent_selection_box.destroy();	
					}
				})
				.appendTo(parents_el);
			});
			$("<span style='color:red'>"+$(el).prop("tagName")+"</span>").appendTo(parents_el);

			$("<button>Extract</button>").click($.proxy(function() {
				pg.panel.commandUI.addData(this.el);
			},{el:el})).appendTo(tools_el);
			$("<button>Send to other tabs</button>").click($.proxy(function() {
				pg.panel.share_elements([this.el]);
			},{el:el})).appendTo(tools_el);

			// DRAW DATA TABLE
			var attr_dict = get_attr_dict(el);  // get_attr_dict returns simplified attr->value object
			_.each(attr_dict, function(value,key) {
				var attr_el = $("<div class='attr'><span class='attr_key'>"+ key +":</span></div>").appendTo(attributes_el);
				var attr_setter_func = pg.planner.attr_func(key).setter;
				$("<span class='attr_value' contenteditable='true' original_value='"+value+"'>"+value+"</span>").bind("blur", $.proxy(function(e) {
					if($(e.target).attr('original_value')===$(e.target).text()) return; 
					var new_value = $(e.target).text();
					console.log("new value:"+new_value);
					$(e.target).attr('original_value',new_value);
					// if($(this.el).attr("original_value")) { // remember the original attribute
					// 	$(this.el).attr("original_key",this.key);
					// 	$(this.el).attr("original_value",this.original_value);
					// }
					this.setter(this.el,new_value);
					pg.history.put({type:'set_attribute',target:el,key:key,value:new_value});
					pg.history.infer();
				},{key:key, original_value:value, setter:attr_setter_func, el:el})).appendTo(attr_el);
			});	

			// PLACE DATA UI PANEL
			var x = Math.min(pos.x+$(window).scrollLeft(), $(window).width()-300+$(window).scrollLeft()); 
			$(ui_el).css("top", pos.y + $(window).scrollTop() + 20);
			$(ui_el).css("left", x);
			$(pg.documentBody).append(ui_el).show('fast');
			return ui_el;
		},
		remove: function() {
			if(pg.panel.parent_selection_box) {
				pg.panel.parent_selection_box.hide();  
				pg.panel.parent_selection_box.destroy();	
				pg.panel.parent_selection_box=undefined;
			}
			if(pg.panel.data_selection_box) {
				pg.panel.data_selection_box.hide();  
				pg.panel.data_selection_box.destroy();	
				pg.panel.data_selection_box=undefined;
			}
			$("#pg_data_ui").remove();
		}
	},
	attachEventListeners: function() {
		$(".node")
			.off()
			.draggable({ 	
				cancel: "div.node_cover",
				grid: [ this.node_dimension, this.node_dimension],
				stop: function(e) {
					var node = pg.panel.get_node_by_id($(this).attr('id'));
					if(node) {
						var position = [ Math.round($(this).position().top / pg.panel.node_dimension),
											Math.round($(this).position().left / pg.panel.node_dimension)	];
						if (_.isEqual(position,node.position)) return;
						var existing_node = pg.panel.get_node_by_position(position);
						if(existing_node) pg.panel.delete(existing_node);
						node.position = position;
					}
					if(pg.panel.get_current_node()!=node) pg.panel.select(node);
					pg.panel.redraw();
				}
			})
			.hover(function(){
				if(pg.panel.get_current_node()) return;
				if($(".node .node_cover .nth-input-text").hasClass("select_modal")) return;
				var node = pg.panel.get_node_by_id($(this).attr('id'));
				pg.panel.node_show_inputs(node);

			},function(){
				if(pg.panel.get_current_node()) return;
				if($(".node .node_cover .nth-input-text").hasClass("select_modal")) return;
				var node = pg.panel.get_node_by_id($(this).attr('id'));
				pg.panel.node_hide_inputs(node);
			})
			.dblclick(function(e) {
				e.stopPropagation();
			});
		$(pg.pg_el).find("#plate").droppable({
			accept: ".task_item, .operation_item",
			drop: function( event, ui ) {
				var position = [ Math.floor((event.clientY-$(this).offset().top+$(document).scrollTop()) / pg.panel.node_dimension),
											Math.floor((event.clientX-$(this).offset().left+$(document).scrollLeft()) / pg.panel.node_dimension)	];
				console.log("dropped at "+position);
				var existing_node = pg.panel.get_node_by_position(position);
				pg.log.add({type:'confirm_operation',operation:pg.toolbox.draggingOperation});    
				if(existing_node) {
					existing_node.P=pg.toolbox.draggingOperation;
					pg.panel.redraw();
				} else {
					var new_node = pg.Node.create();
					new_node.P = pg.toolbox.draggingOperation;	
					new_node.position = position;
					pg.panel.enhancement.push_at(new_node, position);
					pg.panel.deselect();
					pg.panel.select(new_node);
				} 
			}

		});
		$(".node .node_content").click(function(e) {
			var n = $(e.target).parents(".node");
			if($(n).is('.ui-draggable-dragging')){
				return;
			}
			var node = pg.panel.get_node_by_id($(n).attr('id'));
			var previously_selected_node = pg.panel.get_current_node();
			console.log(node);
			if(node==previously_selected_node) pg.panel.deselect();
			else {
				pg.panel.deselect();
				pg.panel.select(node);
			}
			e.stopPropagation();
		})
		// Assign backspace button to delete node. Prevent page back navigation
		$(document).off("keydown").keydown(function (e) {
            var element = e.target.nodeName.toLowerCase();
            var contenteditable = $(e.target).attr("contenteditable");
            console.log(element);
            if ((element != 'input' && element != 'textarea' && !contenteditable) || $(e.target).attr("readonly")) {
                if (e.keyCode === 8 || e.keyCode === 46) {
                	if(document.activeElement.tagName==='SPAN') return;
                    pg.panel.delete();
                    return false;
                }
            }
		});
		var el_tiles = $("#pg").find("#tiles");
		$(el_tiles).off('click').click(function(e) {
			if(pg.panel.get_current_node()) {
				pg.panel.deselect();
				return;
			} else {
				var mouse_coord = {left: e.pageX - $(this).offset().left,
									top: e.pageY - $(this).offset().top};
				var mouse_pos = {left: Math.floor(mouse_coord.left/pg.panel.node_dimension), 
								top: Math.floor(mouse_coord.top/pg.panel.node_dimension)};
				e.stopPropagation();
				console.log("plate clicked "+ mouse_pos.left + "," +mouse_pos.top);
				if(pg.mode=="manual") return;
				var new_node = pg.Node.create();
				new_node.position = [mouse_pos.top, mouse_pos.left];
				pg.panel.get_nodes().push(new_node);
				pg.panel.deselect();
				pg.panel.redraw();
				pg.panel.select(new_node);
			}
		});
		$(pg.pg_el).find("#resize_handle_panel").draggable({
			axis: "x",
			containment: [$(pg.panel.targetEl).position().left - 8, 0, $(window).width(), $(window).height()],
			start: function() {
				if(pg.inspector.flag_inspect) {
					pg.panel.commandUI.turn_inspector(false);
					pg.panel.inspector_suspended = "yes";
				}
			},
			drag: function(event, ui) {
				var left, width;
				if(PANEL_POSITION=="left") {
					left = ui.offset.left + 10 - $(window).scrollLeft();;	
					width = left-$(pg.panel.targetEl).position().left;
					$(pg.panel.targetEl).width(width);
					$(pg.pg_el).width(left);
					$(pg.documentBody).css("padding-left",left);
				} else {
					left = ui.offset.left + 10 - $(window).scrollLeft();
					pg_width = window.innerWidth - left;
					panel_width = window.innerWidth - left - 300;  // grid width
					$(pg.panel.targetEl).width(panel_width);
					$(pg.pg_el).width(pg_width);
					$(pg.documentBody).css("padding-right",pg_width);
				}
				//var top = ui.offset.top - $(window).scrollTop();;
				
				// $(this).css({'right':0, 'top':0});
			},
			stop: function(event, ui) {				
				if(pg.panel.inspector_suspended=="yes") {
					pg.panel.commandUI.turn_inspector(true);
					pg.panel.inspector_suspended = undefined;
				}
			}
		});
		// Prevent scrolling body when mouse is over panel element.
		$("#pg_panel").hover(function() {
			$("body").css("overflow","hidden");
		},function() {
			$("body").css("overflow","auto");
		});

		$(pg.pg_el).find("#switch_panel_position").find(".fa-step-backward").click(function() {
			//PANEL_POSITION = (PANEL_POSITION=="left")?"right":"left";
			PANEL_POSITION = "left";
			// pg.init();
			pg.refresh_layout();
		});	
		$(pg.pg_el).find("#switch_panel_position").find(".fa-step-forward").click(function() {
			//PANEL_POSITION = (PANEL_POSITION=="left")?"right":"left";
			PANEL_POSITION = "right";
			pg.refresh_layout();
		});	

		
	},


	


}



