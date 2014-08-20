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
		// attach editUI and commandUI
		// this.editUI.create();
		// this.commandUI.create();  this.commandUI.remove();
		// this.toolbar.create();
		// $("#plate_container").dragscrollable({
		// 	dragSelector:'#tiles',
		// 	acceptPropagatedEvent:false
		// });
		pg.info.update(this.enhancement);
		//pg.panel.drawPlate();
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
		// return [position[0]*this.node_dimension - this.offset[0], 
		// 		position[1]*this.node_dimension - this.offset[1]];
	},
	select: function(node) {
		window.curnode = node; // for debugging
		var node_el = $("#"+node.ID).get(0);
		$(node_el).attr("selected",true);
		_.each(pg.panel.get_nodes(), function(n) { n.selected=false; });
		pg.panel.node_show_inputs(node);
		node.selected = true;
		pg.panel.commandUI.create();
		pg.panel.commandUI.redraw();
		pg.panel.commandUI.turn_inspector(true);
	},
	deselect: function() {
		pg.inspector.unhighlight_list();
		pg.inspector.off(pg.panel.dataUI.remove);
		$("#tiles .node").removeAttr("selected");
		_.each(pg.panel.get_nodes(), function(n) { n.selected=false; pg.panel.node_hide_inputs(n);});
		// pg.panel.hide_show_inputs(node);
		pg.panel.commandUI.remove();
		pg.panel.commandUI.turn_inspector(false);
		pg.panel.node_select_modal_off();
		pg.panel.redraw();
		pg.toolbox.redraw(pg.planner.get_all_operations());
	},
	delete: function(target_nodeObj) {
		console.log("delete start");
		pg.inspector.unhighlight_list();
		pg.inspector.off(pg.panel.dataUI.remove);
		if(!target_nodeObj) target_nodeObj = pg.panel.get_current_node();
		pg.panel.enhancement.delete(target_nodeObj);
		this.commandUI.remove();
		console.log("redraw start");
		this.redraw();
		console.log("redraw end");
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
	// edit_data: function(target_nodeObj) {
	// 	if(!target_nodeObj) target_nodeObj = pg.panel.get_current_node();
	// 	var dataUI;
	// 	if($("#pg_data_ui").length==0) 
	// 		dataUI = pg.panel.dataUI.create(target_nodeObj);
	// 	elsecreate			dataUI = $("#pg_data_ui");
	// 	pg.panel.dataUI.loadData(target_nodeObj.V);
	// 	$(dataUI).appendTo($("#pg").get(0));
	// },
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
		$(".node .node_cover .nth-input-text").html("input"+(i+1)).removeClass("hidden");
		$(".node .node_cover").show();
		$(".node .node_cover").removeClass("notClickable");
		$(".node .node_cover").click($.proxy(function(e) {
			var _id = $(e.target).parents(".node").attr("id");
			console.log(_id + " is selected as "+this.i+"-th input");
			$("#pg_command_ui").find("input[inputNodeIdx='"+this.i+"']").val(_id);
			(pg.panel.get_current_node()).I[this.i]=_id;
			e.stopPropagation();
			pg.panel.node_select_modal_off();
			pg.panel.redraw();
		},{i:i}));
	},
	node_select_modal_off: function() {
		$(".node .node_cover").addClass("notClickable");
		$(".node .node_cover .nth-input-text").empty().addClass("hidden");
		$(".node .node_cover").hide().unbind('click');
	},
	node_show_inputs: function(node) {
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
	// get_left_node:function(node) {
	// 	try{
	// 		return node && pg.panel.get_node_by_position([node.position[0], node.position[1]-1]);			
	// 	} catch(e) {
	// 		console.log(e.stack);
	// 	}

	// },
	// get_right_node:function(node) {
	// 	return node && pg.panel.get_node_by_position([node.position[0], node.position[1]+1]);
	// },
	// get_above_node:function(node) {
	// 	return node && pg.panel.get_node_by_position([node.position[0]-1, node.position[1]]);
	// },
	// get_below_node:function(node) {
	// 	return node && pg.panel.get_node_by_position([node.position[0]+1, node.position[1]]);
	// },
	get_current_node:function() {
		return _.map($("#tiles .node[selected]").toArray(), function(nodeEl) {
			return pg.panel.get_node_by_id($(nodeEl).prop('id'));
		})[0];
	},
	get_adjacent_node:function(direction, node, _allNodes) {
		return pg.panel.enhancement.get_adjacent_node(direction, node, _allNodes);
		// var allNodes = (_allNodes)?_allNodes: pg.panel.get_nodes();
		// if(!direction || !node) return false;
		// if(direction=="_left") return pg.panel.get_node_by_position([node.position[0], node.position[1]-1], allNodes);			
		// if(direction=="_right") return pg.panel.get_node_by_position([node.position[0], node.position[1]+1], allNodes);			
		// if(direction=="_above") return pg.panel.get_node_by_position([node.position[0]-1, node.position[1]], allNodes);			
		// if(direction=="_below") return pg.panel.get_node_by_position([node.position[0]+1, node.position[1]], allNodes);							
		// return false;
	},
	get_node_by_id: function(node_id, reference_output_node, _allNodes) {
		return pg.panel.enhancement.get_node_by_id(node_id, reference_output_node, _allNodes);
		// var allNodes = (_allNodes)?_allNodes: pg.panel.get_nodes();
		// // if (reference_output_node==undefined) reference_output_node = pg.panel.get_current_node();

		// if(node_id.substring(0,5) == '_left' && reference_output_node) {
		// 	var new_node_id = node_id.substring(5); var old_node_id = node_id.substring(0,5);
		// 	if(new_node_id.length>0) return this.get_adjacent_node("_left", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
		// 	else return this.get_adjacent_node("_left", reference_output_node, allNodes);	
		// } else if(node_id.substring(0,6) == '_above' && reference_output_node)  {
		// 	var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
		// 	if(new_node_id.length>0) return this.get_adjacent_node("_above", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
		// 	else return this.get_adjacent_node("_above", reference_output_node, allNodes);	
		// } else if(node_id.substring(0,6) == '_right' && reference_output_node)  {
		// 	var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
		// 	if(new_node_id.length>0) return this.get_adjacent_node("_right", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
		// 	else return this.get_adjacent_node("_right", reference_output_node, allNodes);	
		// } else if(node_id.substring(0,6) == '_below' && reference_output_node)  {
		// 	var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
		// 	if(new_node_id.length>0) return this.get_adjacent_node("_below", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
		// 	else return this.get_adjacent_node("_below", reference_output_node, allNodes);	
		// }
		// //
		// for(var i in allNodes) {
		// 	if (allNodes[i].ID == node_id) return allNodes[i];
		// }	return false;
	},
	get_node_by_position: function(position, _allNodes) {
		return pg.panel.enhancement.get_node_by_position(position, _allNodes);	
		// var allNodes = (_allNodes)?_allNodes: pg.panel.get_nodes();
		// for(var i in allNodes) {
		// 	if (allNodes[i].position[0] == position[0] && allNodes[i].position[1] == position[1]) return allNodes[i];
		// }	return false;
	},	
	get_next_nodes:function(node, _reachableNodes, _allNodes) {
		return pg.panel.enhancement.get_next_nodes(node, _reachableNodes, _allNodes);		
		// find next node among _reachableNodes.  _allNodes is the entire set of nodes
		// var allNodes = (_allNodes)?_allNodes: pg.panel.get_nodes();
		// var reachableNodes = (_reachableNodes)?_reachableNodes: allNodes;
		// return _.filter(reachableNodes, function(n) {
		// 	return pg.panel.get_prev_nodes(n, allNodes).indexOf(node)!=-1;
		// });
	},
	get_reachable_nodes: function(_starting_nodes, _allNodes, _include_triggers) {
		return pg.panel.enhancement.get_reachable_nodes(_starting_nodes, _allNodes, _include_triggers);
		// var allNodes = (_allNodes)? _.clone(_allNodes): _.clone(pg.panel.get_nodes());
		// var remaining_nodes = _.clone(allNodes);
		// var reachable_nodes = [];
		// var queue = _.clone(_starting_nodes);
		// while(queue.length>0 && remaining_nodes.length>0 ) {
		// 	var n = queue.pop();
		// 	reachable_nodes =  _.union(reachable_nodes, n);
		// 	if (!_include_triggers && n.P && n.P.type=="trigger") {  }
		// 	else {
		// 		var new_reachable_nodes = pg.panel.get_next_nodes(n,remaining_nodes,allNodes);
		// 		if(new_reachable_nodes.length>0) {
		// 			queue = _.union(queue, new_reachable_nodes);
		// 			remaining_nodes = _.difference(remaining_nodes, new_reachable_nodes);
		// 		}
		// 	}
		// }
		// console.log("reachable nodes : "+pg.panel.print(reachable_nodes));
		// return reachable_nodes;
	},
	get_informative_nodes:function(nodes) {
		return pg.panel.enhancement.get_informative_nodes(nodes);
		// var all_prev_nodes = _.union(_.flatten(_.map(nodes, function(n) {
		// 	return pg.panel.get_prev_nodes(n, pg.panel.get_nodes());
		// })));
		// var informative_nodes = _.difference(all_prev_nodes,nodes);
		// return informative_nodes;
	},
	get_prev_nodes:function(node, _allNodes) {	
		return pg.panel.enhancement.get_prev_nodes(node, _allNodes);
		// var allNodes = (_allNodes)?_allNodes: pg.panel.get_nodes();
		// return _.without(_.map(node.I, function(input_id) {
		// 	return pg.panel.get_node_by_id(input_id, node, allNodes);
		// }),false,undefined);	
	},
	get_ready_nodes:function(_candidateNodes, _allNodes) {
		return pg.panel.enhancement.get_ready_nodes(_candidateNodes, _allNodes);
		// var allNodes = (_allNodes)?_allNodes: pg.panel.get_nodes();
		// var candidateNodes = (_candidateNodes)? _candidateNodes: allNodes;
		// var ready_nodes = _.filter(candidateNodes, function(n) {
		// 	if(n.executed) return false;
		// 	var prev_nodes = pg.panel.get_prev_nodes(n, allNodes);
		// 	if (	prev_nodes.length>0 &&
		// 			_.filter(prev_nodes, function(n) { return n.executed==false; }).length==0 ) 
		// 		return true;
		// 	else return false;	
		// });
		// return ready_nodes;
	},
	el_to_obj:function(el) {
		return pg.panel.enhancement.get_node_by_id($(el).prop('id'));
	},
	print: function(nodes) {
		return pg.panel.enhancement.print(nodes);
		// var str = "";
		// try{
		// 	_.each(nodes, function(n) {
		// 		if(n.P) { str += n.P.type + "["+n.position[0]+","+n.position[1]+"]("+n.executed+"), "; }
		// 	});
		// 	return str;	
		// } catch(e) { console.error(e.stack); }
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
		// if(nodeObj.P && nodeObj.P.type!="trigger") nodeObj.executed = true;
		// if(!nodeObj) return false;
		// if(!nodeObj.P) return false;
		// pg.planner.execute(nodeObj);
		pg.panel.enhancement.run_node(nodeObj);
		if(skip_redraw){  }
		else pg.panel.redraw();
	},
	run_triggered_nodes: function(starting_nodes, _nodes, skip_redraw) {
		// reset 'executed' property of every node
		//console.log("===================================");
		// var nodes = (_nodes)? _.clone(_nodes): _.clone(pg.panel.get_nodes());
		// var nodesToExecute = pg.panel.get_reachable_nodes(starting_nodes, nodes, true); // including starting nodes
		// _.each(nodesToExecute, function(n) { n.executed = false; });	
		// if(nodesToExecute==undefined || nodesToExecute.length==0 ) return;
		// var queue = starting_nodes;
		// //console.log("starting nodes : "+pg.panel.print(starting_nodes));
		// var executed = [];
		// // nodes = _.difference(nodes, queue);
		// var count=0;
		// while(queue.length>0 && count<nodes.length){
		// 	//console.log("---");
		// 	var n = queue.pop();
		// 	pg.panel.run_node(n, true);
		// 	executed = _.union(executed, n);
		// 	//console.log("run : "+pg.panel.print([n]));
		// 	// nodes = _.difference(nodes, queue);
		// 	var nodes_ready = pg.panel.get_ready_nodes(nodesToExecute, nodes);
		// 	var nodes_ready_not_yet_run = _.difference(nodes_ready, executed);
		// 	queue = _.union(queue, nodes_ready_not_yet_run);
		// 	//console.log("queue : "+pg.panel.print(queue));
		// 	//console.log("nodes : "+pg.panel.print(nodes));
		// 	//console.log("---");
		// 	count++;
		// }
		pg.panel.enhancement.run_triggered_nodes(starting_nodes, _nodes, skip_redraw);
		pg.panel.redraw();
	},
	infer: function(output_node) {
		var Is = _.without(_.map(output_node.I, function(input_id) {
			return pg.panel.enhancement.get_node_by_id(input_id, output_node);
		}), false);
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
		// var solution_nodes = pg.planner.plan(Is,output_node);
		// this.commandUI.update(solution_nodes);
		// console.log(solution_nodes);
		// if(!solution_nodes || solution_nodes==[]) alert("no solution found");
		// return solution_nodes;
	},





	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  view methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	redraw: function() {
		// pg.save_enhancement(pg.panel.title,pg.panel.get_nodes());
		var nodes = pg.panel.get_nodes();
		$("#pg_panel > #plate_container > #tiles").empty();
		_.each(nodes, function(n,ni){
			try{
				pg.Node.draw(n,this.node_dimension);
			} catch(e) {
				console.error(e.stack);
			}
		},this);
		this.attachEventListeners();
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
			

			var attr_dict = get_attr_dict(el);  // get_attr_dict returns simplified attr->value object
			_.each(attr_dict, function(value,key) {
				var attr_el = $("<div class='attr'><span class='attr_key'>"+ key +":</span></div>").appendTo(attributes_el);
				var attr_setter_func = pg.planner.attr_func(key).setter;
				$("<span class='attr_value' contenteditable='true'>"+value+"</span>").bind("input", $.proxy(function(e) {
					console.log("new value:"+$(e.target).text());
					if($(this.el).attr("original_value")) { // remember the original attribute
						$(this.el).attr("original_key",this.key);
						$(this.el).attr("original_value",this.original_value);
					}
					this.setter(this.el,$(e.target).text());
				},{key:key, original_value:value, setter:attr_setter_func, el:el})).appendTo(attr_el);
			});	
			$(ui_el).css("top", pos.y + $(window).scrollTop());
			$(ui_el).css("left", pos.x + $(window).scrollLeft());
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

	// toolbar: {
	// 	create: function() {
	// 		var ui_el = $("<div id='control_ui'>		\
	// 				<input type='checkbox' class='active_checkbox'>\
	// 				<span class='pg_title'></span>\
	// 				<select id='script_selector'>	<option selected disabled>Load script</option>\
	// 				</select>	\
	// 				<button id='button_remove'>remove</button>\
	// 				<button id='button_clear'>clear</button>\
	// 				<button id='button_new'>new</button>\
	// 				<button id='button_save'>save</button>\
	// 				<button id='button_execute'>execute</button>\
	// 				<label>ZOOM:</label>\
	// 				<button class='zoom_button' id='zoom_to_low'  node_size=50>small</button>\
	// 				<button class='zoom_button' id='zoom_to_mid'  node_size=150>medium</button>\
	// 				<button class='zoom_button' id='zoom_to_high' node_size=300>large</button>\
	// 				<button class='zoom_button' id='zoom_to_high' node_size='showAll'>show all</button>\
	// 				<label>&nbsp;SCRIPT:</label>\
	// 				<button class='button_copy_script' id='button_copy_script'>copy</button>\
	// 				<button class='button_paste_script' id='button_paste_script'>paste</button>\
	// 			</div>\
	// 		");
	// 		$(ui_el).find(".pg_title").text(pg.panel.title);
	// 		_.each(pg.load_all_enhancement(), function(script,title) {
	// 			var option = $("<option></option")
	// 				.attr('value',title)
	// 				.text(title).appendTo($(ui_el).find("#script_selector"));
	// 		},this);
	// 		$(ui_el).find("#script_selector").change(function() {
	// 			$("#script_selector option:selected").each(function() {
	// 				var title = $(this).attr('value');
	// 				pg.load_enhancement(title);
	// 			});
	// 		});
	// 		$(ui_el.find("#button_remove")).click(function() {
	// 			pg.remove_enhancement(pg.panel.title);
	// 			var programs = pg.load_all_enhancement();
	// 			for(var k in programs) {
	// 				pg.load_enhancement(k);
	// 				break;
	// 			}
	// 		});
	// 		$(ui_el.find("#button_clear")).click(function() {
	// 			pg.panel.enhancement.clear();
	// 		});
	// 		$(ui_el.find("#button_new")).click(function() {
	// 			// use modal to get title of new script
	// 			var diag_content = $("	<div class='dialog_content'> \
	// 	  					<p> New Script </p>\
	// 	  					<p> Please enter a name for the script. </p> \
	// 	  					<p><input type='text' id='new_script_title'></input></p> \
	// 	  					<p><button class='button_ok'>OK</button> \
	// 	  						<button class='button_cancel'>Cancel</button> \
	// 	  					</p> \
	// 					</div>");
	// 			$(diag_content).find(".button_ok").click(function() {
	// 				pg.new_enhancement($("#new_script_title").val());
	// 				pg.close_dialog();
	// 			});
	// 			$(diag_content).find(".button_cancel").click(pg.close_dialog);
	// 			pg.open_dialog(diag_content);
	// 		});
	// 		$(ui_el.find("#button_save")).click(function() {
	// 			var active = $(pg.documentBody).find("#control_ui").find(".active_checkbox").prop('checked');
	// 			pg.save_enhancement(pg.panel.enhancement);
	// 		});
	// 		$(ui_el.find("#button_execute")).click(pg.panel.execute);
	// 		$(ui_el).find('button.zoom_button').click(function() {
	// 			pg.panel.zoom($(this).attr('node_size'));
	// 		});
	// 		// $(ui_el).find("#delete_node").click(function() {
	// 		// 	pg.panel.delete("selected_node");
	// 		// 	pg.panel.redraw();
	// 		// });
	// 		$(ui_el).find("#button_copy_script").click(function() {
	// 			pg.panel.copy_script();
	// 		});
	// 		$(ui_el).find("#button_paste_script").click(function() {
	// 			pg.panel.paste_script();
	// 		});
	// 		$("#pg > #pg_panel").append(ui_el);
	// 	}
	// },

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
				if($(""))
				var node = pg.panel.get_node_by_id($(this).attr('id'));
			},function(){
				var node = pg.panel.get_node_by_id($(this).attr('id'));
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
				if(existing_node) {
					existing_node.P=pg.toolbox.draggingOperation;
					pg.panel.redraw();
				} else {
					var new_node = pg.Node.create();
					new_node.P = pg.toolbox.draggingOperation;	
					new_node.position = position;
					pg.panel.enhancement.push_at(new_node, position);
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
		// Double-Click --> create new node
		var el_tiles = $("#pg").find("#tiles");
		$(el_tiles).off('click').click(function(e) {
			// if(pg.panel.get_current_node()) {
			// 	pg.panel.deselect();
			// 	return;
			// } else {
				var mouse_coord = {left: e.pageX - $(this).offset().left,
									top: e.pageY - $(this).offset().top};
				var mouse_pos = {left: Math.floor(mouse_coord.left/pg.panel.node_dimension), 
								top: Math.floor(mouse_coord.top/pg.panel.node_dimension)};
				e.stopPropagation();
				console.log("plate clicked "+ mouse_pos.left + "," +mouse_pos.top);
				var new_node = pg.Node.create();
				new_node.position = [mouse_pos.top, mouse_pos.left];
				pg.panel.get_nodes().push(new_node);
				pg.panel.deselect();
				pg.panel.redraw();
				pg.panel.select(new_node);
			// }
		});
		// Click tile -> deselect node
		// $(el_tiles).off('click').click(function(e) {
		// 	pg.panel.deselect();
		// });
		// resizable panel
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
				var top = ui.offset.top - $(window).scrollTop();;
				var left = ui.offset.left + 10 - $(window).scrollLeft();;
				console.log(left + " , " + top);
				var width = left-$(pg.panel.targetEl).position().left;
				$(pg.panel.targetEl).width(width);
				$(pg.documentBody).css("padding-left",left);
				// $(this).css({'right':0, 'top':0});
			},
			stop: function(event, ui) {				
				if(pg.panel.inspector_suspended=="yes") {
					pg.panel.commandUI.turn_inspector(true);
					pg.panel.inspector_suspended = undefined;
				}
				// console.log($(window).height()-$(this).offset().top);
				// console.log($(this).offset());
				// $(pg.panel.el).height(window.innerHeight-top);
				
				// $("#pg_spacer").height($(pg.panel.el).height());
				// var new_padding = $(pg.browser.target_el).width
				// $(pg.documentBody).css("padding-left","")
			}
		});
		// Prevent scrolling body when mouse is over panel element.
		$("#pg_panel").hover(function() {
			$("body").css("overflow","hidden");
		},function() {
			$("body").css("overflow","auto");
		});

		
	},


	


}



