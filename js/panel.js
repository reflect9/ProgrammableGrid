pg.panel = {
	init: function(title, nodes){
		$("#pg").empty();
		this.title = (title)? title:"untitled";
		this.nodes = (nodes)? nodes:[];
		this.commands = [];
		this.selected_element;
		this.node_dimension = DEFAULT_NODE_DIMENSION;
		this.el = $("<div id='pg_panel' class='pg_panel'>\
								<div id='resize_handle_panel'></div>\
								<div id='plate_container'>\
									<div id='overlay'>\
										<svg></svg>\
									</div>\
									<div id='tiles'></div>\
									<div id='plate'></div>\
								</div>\
					</div>").appendTo($("#pg"));
		// add dummy space at the end
		// $("<div id='pg_spacer'></div>").css({
		// 	'display':'block',
		// 	'position':'relative',
		// 	'clear':'both',
		// 	'width':'100%'
		// }).appendTo($(pg.body));
		$("#pg_spacer").height($(this.el).height());
		// attach editUI and commandUI
		// this.editUI.create();
		// this.commandUI.create();  this.commandUI.remove();
		this.toolbar.create();
		pg.panel.drawPlate();
		pg.panel.redraw();
	},
	close: function() {
		$("#pg").empty();
	},
	load_json: function(json){
		this.nodes = _.map(json.nodes, function(n_data,ni){
			var newNode = new Node(); 
			newNode.load(n_data);
			return newNode;
		});
	},

	zoom: function(option) {
		// option can be either scale number in string, nodes to focus on
		if(option=='showAll') {
			this.zoom(this.nodes);
		} else if(_.isString(option) || _.isNumber(option)) {
			var new_dimension = parseInt(option);
			var ratio_zoom = new_dimension / this.node_dimension;
			this.node_dimension = new_dimension;
			this.redraw();
			this.pan([0,0]);
		} else if(_.isArray(option)) {
			var bounding_box = {min_x:MAX_INT, min_y:MAX_INT, max_x:MIN_INT, max_y:MIN_INT};
			_.each(option, function(n) {
				n_pos = this.p2c(n.position);
				bounding_box = {	
					min_x:_.min([bounding_box.min_x, n_pos[1]]),
					min_y:_.min([bounding_box.min_y, n_pos[0]]),	
					max_x:_.max([bounding_box.max_x, n_pos[1]+this.node_dimension]),
					max_y:_.max([bounding_box.max_y, n_pos[0]+this.node_dimension]),
				};
			},this); 
			var num_boxes = [ 	(bounding_box.max_y-bounding_box.min_y)/this.node_dimension, 
								(bounding_box.max_x-bounding_box.min_x)/this.node_dimension];
			var required_scale = [ $(this.el).height()/num_boxes[0], 
									$(this.el).width()/num_boxes[1] ];
			var new_dimension = _.min(required_scale)*0.8;
			var ratio_zoom = new_dimension / this.node_dimension;
			// this.offset = origin;
			this.node_dimension = new_dimension;
			this.redraw();
			this.pan([bounding_box.min_y*ratio_zoom, bounding_box.min_x*ratio_zoom]);
		}
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
		_.each(pg.panel.nodes, function(n) { n.selected=false; });
		pg.panel.node_show_inputs(node);
		node.selected = true;
		console.log("commandUI redraw start");
		pg.panel.commandUI.create();
		pg.panel.commandUI.redraw();
		console.log("commandUI redraw end");
		pg.panel.commandUI.turn_inspector(true);
		console.log("inspector turned on");
	},
	deselect: function() {
		pg.inspector.unhighlight_list();
		pg.inspector.off(pg.panel.dataUI.remove);
		$("#tiles .node").removeAttr("selected");
		_.each(pg.panel.nodes, function(n) { n.selected=false; pg.panel.node_hide_inputs(n);});
		// pg.panel.hide_show_inputs(node);
		pg.panel.commandUI.remove();
		pg.panel.commandUI.turn_inspector(false);
		pg.panel.node_select_modal_off();
		pg.panel.redraw();
	},
	delete: function(target_nodeObj) {
		console.log("delete start");
		pg.inspector.unhighlight_list();
		pg.inspector.off(pg.panel.dataUI.remove);
		if(!target_nodeObj) target_nodeObj = pg.panel.get_selected_nodes()[0];
		this.nodes = _.without(pg.panel.nodes, target_nodeObj);
		this.commandUI.remove();
		console.log("redraw start");
		this.redraw();
		console.log("redraw end");
	},
	clear: function(target_nodeObj) {
		if(!target_nodeObj) target_nodeObj = pg.panel.get_selected_nodes()[0];
		target_nodeObj.P=undefined;
		pg.panel.redraw();
	},
	empty: function(target_nodeObj) {
		if(!target_nodeObj) target_nodeObj = pg.panel.get_selected_nodes()[0];
		target_nodeObj.V=[];
		pg.panel.redraw();
	},
	// edit_data: function(target_nodeObj) {
	// 	if(!target_nodeObj) target_nodeObj = pg.panel.get_selected_nodes()[0];
	// 	var dataUI;
	// 	if($("#pg_data_ui").length==0) 
	// 		dataUI = pg.panel.dataUI.create(target_nodeObj);
	// 	elsecreate			dataUI = $("#pg_data_ui");
	// 	pg.panel.dataUI.loadData(target_nodeObj.V);
	// 	$(dataUI).appendTo($("#pg").get(0));
	// },
	insert: function(new_nodes, target_node) {
		// replace target_node with nodes and push nodes on the right side to right
		var target_position, nodes_range;
		nodes_range = get_nodes_range(new_nodes);
		if(target_node) {
			target_position = target_node.position;
			this.delete(target_node);
			if(new_nodes.length>1) {
				// push nodes right or below
				_.each(pg.panel.nodes, function(node) {
					if(node.position[1]>target_position[1]) {
						// for nodes on the right side of the target node
						node.position[1] = node.position[1] + nodes_range.columns-1;
					} else if(node.position[1]==target_position[1] && node.position[0]>target_position[0]) {
						// for nodes that are below the target
						node.position[0] = node.position[0] + nodes_range.rows - 1; 
					}
				});
			} 
		} else {
			// when there's no target node, append at the bottom
			var max_y = _.max(pg.panel.nodes, function(n){ return n.position[0];}).position[0]+1;
			target_position = [max_y,1];
		}
		
		// for(var ni=0; ni<this.nodes.length;ni++) {
		// 	var n = this.nodes[ni];
		// 	if(n.position[0] == target_position[0] && n.position[1]>target_position[1]) {
		// 		// if the node is on the right side of the target node, then push it as the legnth of new nodes
		// 		n.position[1]+= new_nodes.length-1;
		// 	}
		// }
		// place new_nodes
		for(var ni=0; ni<new_nodes.length;ni++) {
			var nd = new_nodes[ni]; 	
			if(typeof nd.position !== 'undefined') {
				nd.position=[target_position[0]+nd.position[0]-nodes_range.min_y, target_position[1]+nd.position[1]-nodes_range.min_x]; 	
			} else {
				nd.position=[target_position[0], target_position[1]+ni]; 	
			}
			pg.panel.nodes.push(nd);
		}
		_.each(new_nodes, function(nd) {
			nd.I = _.map(nd.I, function(input_id) {	// replace nd.I with <left> if the left node is the input node.
				if(input_id === "_pageLoad") {
					var trigger_page_load = _.filter(pg.panel.nodes, function(n) {
						return n.P && n.P.type=='trigger' && n.P.param && n.P.param.event_source==="page";
					});
					if(trigger_page_load.length>0) return trigger_page_load[0].ID;
				}
				if(input_id === pg.panel.get_node_by_id("_left",nd)) return "_left";
				else if(input_id === pg.panel.get_node_by_id("_above",nd)) return "_above";
				else if(input_id === pg.panel.get_node_by_id("_right",nd)) return "_right";
				else if(input_id === pg.panel.get_node_by_id("_below",nd)) return "_below";
				else return input_id;
			});
		});
		pg.panel.redraw();
	},

	copy_node_with_literal: function(_node) {
		var node = (_node)? _node: pg.panel.get_selected_nodes()[0];
		var literal_P = jsonClone(pg.planner.operations.literal.proto);
		var newNode = pg.Node.create({type:"literal", I:[node.ID], P:literal_P, V:node.V, position:clone(node.position)});
		var candDiff = [[1,0],[-1,0],[0,1],[0,-1]];
		for(var i in candDiff) {
			var newPos = [newNode.position[0]+candDiff[i][0],newNode.position[1]+candDiff[i][1]];
			if(pg.panel.get_node_by_position(newPos)==false) {
				newNode.position = newPos;
				pg.panel.nodes.push(newNode);
				pg.panel.redraw();
				return;
			}
		}
		alert("To copy a node, the node must have an empty neighbor tile.");
	},	
	duplicate_node: function(_node){
		// find empty spaces nearby
		var node = (_node)? _node: pg.panel.get_selected_nodes()[0];
		var newNode = pg.Node.duplicate(node);
		var candDiff = [[1,0],[-1,0],[0,1],[0,-1]];
		for(var i in candDiff) {
			var newPos = [newNode.position[0]+candDiff[i][0],newNode.position[1]+candDiff[i][1]];
			if(pg.panel.get_node_by_position(newPos)==false) {
				newNode.position = newPos;
				pg.panel.nodes.push(newNode);
				pg.panel.redraw();
				return;
			}
		}
		alert("To duplicate a node, the node must have an empty neighbor tile.");
	},
	share_node_across_tabs: function(_node_list) {
		var node_list = (_node_list)? _node_list: pg.panel.get_selected_nodes();
		var jsonList = serialize_nodes(node_list);
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
		pg.panel.copy_nodes(pg.panel.nodes);
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
		pg.panel.insert(node_list);
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
		pg.panel.insert([node]);
	},

	node_select_modal_on: function(i) {
		$(".node .node_cover .nth-input-text").html("I"+(i+1));
		$(".node .node_cover").show();
		$(".node .node_cover").click($.proxy(function(e) {
			var _id = $(e.target).parents(".node").attr("id");
			console.log(_id + " is selected as "+this.i+"-th input");
			$("#pg_command_ui").find("input[inputNodeIdx='"+this.i+"']").val(_id);
			(pg.panel.get_selected_nodes()[0]).I[this.i]=_id;
			e.stopPropagation();
			pg.panel.node_select_modal_off();
			pg.panel.redraw();
		},{i:i}));
	},
	node_select_modal_off: function() {
		$(".node .node_cover .nth-input-text").empty();
		$(".node .node_cover").hide().unbind('click');
	},
	node_show_inputs: function(node) {
		$("#"+node.ID).find('.nth-input').show();
		_.each(node.I, function(input_node_id, n_th) {
			var input_node = pg.panel.get_node_by_id(input_node_id, node);
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
	get_selected_nodes:function() {
		return _.map($("#tiles .node[selected]").toArray(), function(nodeEl) {
			return pg.panel.get_node_by_id($(nodeEl).prop('id'));
		});
	},
	get_adjacent_node:function(direction, node, _allNodes) {
		var allNodes = (_allNodes)?_allNodes: pg.panel.nodes;
		if(!direction || !node) return false;
		if(direction=="_left") return pg.panel.get_node_by_position([node.position[0], node.position[1]-1], allNodes);			
		if(direction=="_right") return pg.panel.get_node_by_position([node.position[0], node.position[1]+1], allNodes);			
		if(direction=="_above") return pg.panel.get_node_by_position([node.position[0]-1, node.position[1]], allNodes);			
		if(direction=="_below") return pg.panel.get_node_by_position([node.position[0]+1, node.position[1]], allNodes);							
		return false;
	},
	get_node_by_id: function(node_id, reference_output_node, _allNodes) {
		var allNodes = (_allNodes)?_allNodes: pg.panel.nodes;
		// if (reference_output_node==undefined) reference_output_node = pg.panel.get_selected_nodes()[0];

		if(node_id.substring(0,5) == '_left' && reference_output_node) {
			var new_node_id = node_id.substring(5); var old_node_id = node_id.substring(0,5);
			if(new_node_id.length>0) return this.get_adjacent_node("_left", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
			else return this.get_adjacent_node("_left", reference_output_node, allNodes);	
		} else if(node_id.substring(0,6) == '_above' && reference_output_node)  {
			var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
			if(new_node_id.length>0) return this.get_adjacent_node("_above", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
			else return this.get_adjacent_node("_above", reference_output_node, allNodes);	
		} else if(node_id.substring(0,6) == '_right' && reference_output_node)  {
			var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
			if(new_node_id.length>0) return this.get_adjacent_node("_right", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
			else return this.get_adjacent_node("_right", reference_output_node, allNodes);	
		} else if(node_id.substring(0,6) == '_below' && reference_output_node)  {
			var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
			if(new_node_id.length>0) return this.get_adjacent_node("_below", pg.panel.get_node_by_id(new_node_id,reference_output_node), allNodes);
			else return this.get_adjacent_node("_below", reference_output_node, allNodes);	
		}
		//
		for(var i in allNodes) {
			if (allNodes[i].ID == node_id) return allNodes[i];
		}	return false;
	},
	get_node_by_position: function(position, _allNodes) {
		var allNodes = (_allNodes)?_allNodes: pg.panel.nodes;
		for(var i in allNodes) {
			if (allNodes[i].position[0] == position[0] && allNodes[i].position[1] == position[1]) return allNodes[i];
		}	return false;
	},	
	get_next_nodes:function(node, _reachableNodes, _allNodes) {
		// find next node among _reachableNodes.  _allNodes is the entire set of nodes
		var allNodes = (_allNodes)?_allNodes: pg.panel.nodes;
		var reachableNodes = (_reachableNodes)?_reachableNodes: allNodes;
		return _.filter(reachableNodes, function(n) {
			return pg.panel.get_prev_nodes(n, allNodes).indexOf(node)!=-1;
		});
	},
	get_reachable_nodes: function(_starting_nodes, _allNodes, _include_triggers) {
		var allNodes = (_allNodes)? _.clone(_allNodes): _.clone(pg.panel.nodes);
		var remaining_nodes = _.clone(allNodes);
		var reachable_nodes = [];
		var queue = _.clone(_starting_nodes);
		while(queue.length>0 && remaining_nodes.length>0 ) {
			var n = queue.pop();
			reachable_nodes =  _.union(reachable_nodes, n);
			if (!_include_triggers && n.P && n.P.type=="trigger") {  }
			else {
				var new_reachable_nodes = pg.panel.get_next_nodes(n,remaining_nodes,allNodes);
				if(new_reachable_nodes.length>0) {
					queue = _.union(queue, new_reachable_nodes);
					remaining_nodes = _.difference(remaining_nodes, new_reachable_nodes);
				}
			}
		}
		console.log("reachable nodes : "+pg.panel.print(reachable_nodes));
		return reachable_nodes;
	},
	get_informative_nodes:function(nodes) {
		var all_prev_nodes = _.union(_.flatten(_.map(nodes, function(n) {
			return pg.panel.get_prev_nodes(n, pg.panel.nodes);
		})));
		var informative_nodes = _.difference(all_prev_nodes,nodes);
		return informative_nodes;
	},
	get_prev_nodes:function(node, _allNodes) {	
		var allNodes = (_allNodes)?_allNodes: pg.panel.nodes;
		return _.without(_.map(node.I, function(input_id) {
			return pg.panel.get_node_by_id(input_id, node, allNodes);
		}),false,undefined);	
	},
	get_ready_nodes:function(_candidateNodes, _allNodes) {
		var allNodes = (_allNodes)?_allNodes: pg.panel.nodes;
		var candidateNodes = (_candidateNodes)? _candidateNodes: allNodes;
		var ready_nodes = _.filter(candidateNodes, function(n) {
			if(n.executed) return false;
			var prev_nodes = pg.panel.get_prev_nodes(n, allNodes);
			if (	prev_nodes.length>0 &&
					_.filter(prev_nodes, function(n) { return n.executed==false; }).length==0 ) 
				return true;
			else return false;	
		});
		return ready_nodes;
	},
	el_to_obj:function(el) {
		return pg.panel.get_node_by_id($(el).prop('id'));
	},
	print: function(nodes) {
		var str = "";
		try{
			_.each(nodes, function(n) {
				if(n.P) { str += n.P.type + "["+n.position[0]+","+n.position[1]+"]("+n.executed+"), "; }
			});
			return str;	
		} catch(e) { console.error(e.stack); }
	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  executions methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	execute:function() {
		var page_triggers = _.filter(pg.panel.nodes, function(node) {
			return 	node.P && node.P.param && node.P.type=='trigger' && 
					node.P.param.event_source=="page"; 
		});
		var triggered = _.uniq(_.flatten(_.map(page_triggers, function(t){ return pg.panel.get_next_nodes(t); })));
		_.each(pg.panel.nodes, function(n) { n.executed=false; n.V=[]; });
		pg.panel.run_triggered_nodes(triggered, false, false);
	},
	run_node: function(nodeObj, skip_redraw) {
		if(nodeObj.P && nodeObj.P.type!="trigger") nodeObj.executed = true;
		if(!nodeObj) return false;
		if(!nodeObj.P) return false;
		pg.planner.execute(nodeObj);
		if(skip_redraw){  }
		else pg.panel.redraw();
	},
	run_triggered_nodes: function(starting_nodes, _nodes, skip_redraw) {
		// reset 'executed' property of every node
		//console.log("===================================");
		var nodes = (_nodes)? _.clone(_nodes): _.clone(pg.panel.nodes);
		var nodesToExecute = pg.panel.get_reachable_nodes(starting_nodes, nodes, true); // including starting nodes
		_.each(nodesToExecute, function(n) { n.executed = false; });	
		if(nodesToExecute==undefined || nodesToExecute.length==0 ) return;
		var queue = starting_nodes;
		//console.log("starting nodes : "+pg.panel.print(starting_nodes));
		var executed = [];
		// nodes = _.difference(nodes, queue);
		var count=0;
		while(queue.length>0 && count<nodes.length){
			//console.log("---");
			var n = queue.pop();
			pg.panel.run_node(n, true);
			executed = _.union(executed, n);
			//console.log("run : "+pg.panel.print([n]));
			// nodes = _.difference(nodes, queue);
			var nodes_ready = pg.panel.get_ready_nodes(nodesToExecute, nodes);
			var nodes_ready_not_yet_run = _.difference(nodes_ready, executed);
			queue = _.union(queue, nodes_ready_not_yet_run);
			//console.log("queue : "+pg.panel.print(queue));
			//console.log("nodes : "+pg.panel.print(nodes));
			//console.log("---");
			count++;
		}
		pg.panel.redraw();
	},
	infer: function(output_node) {
		var Is = _.without(_.map(output_node.I, function(input_id) {
			return pg.panel.get_node_by_id(input_id, output_node);
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
		// pg.save_script(pg.panel.title,pg.panel.nodes);

		$("#pg_panel > #plate_container > #tiles").empty();
		$("#control_ui").find(".pg_title").text(pg.panel.title);
		// draw nodes based on current module
		_.each(this.nodes, function(n,ni){
			try{
				pg.Node.draw(n,this.node_dimension);
			} catch(e) {
				console.error(e.stack);
			}
		},this);
		this.attachEventListeners();
		if(pg.panel.get_selected_nodes().length>0) {
			var n = pg.panel.get_selected_nodes()[0];
			pg.panel.deselect();
			pg.panel.select(n);
		}
		pg.panel.drawConnector_node_list();
	},
	drawPlate: function() {
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
		var node_list = _nodes || pg.panel.nodes;
		_.each(node_list, function(n) {
			var n_el = $(".node#"+n.ID); 
			if(n_el.length==0) return;
			_.each(n.I, function(inp_n_id,idx){
				if(pg.panel.get_adjacent_node(inp_n_id, n)!= false) {
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
		var fromPos = {left: $(_fromEl).position().left+$(_fromEl).width()-margin, top:$(_fromEl).position().top+margin};
		var toPos = {left: $(_toEl).position().left+margin, top:$(_toEl).position().top+margin*nth_input};

		// var qPos = {left:fromPos.left+10, top:fromPos.top};
		// var midPos = {left:(fromPos.left+toPos.left)/2, top:(fromPos.top+toPos.top)/2};

		var svg = $("#pg_panel > #plate_container > #overlay > svg");
		// var newPath = document.createElementNS('http://www.w3.org/2000/svg','path');
		// var d = "M"+fromPos.left+","+fromPos.top+" Q "+qPos.left+","+qPos.top+" "+midPos.left+","+midPos.top+" T"+toPos.left+","+toPos.top;
		// newPath.setAttribute('d',d);
		// newPath.setAttribute('class','path_connector');
		// $(svg).append(newPath);
		var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
		newLine.setAttribute('x1',fromPos.left); 	newLine.setAttribute('y1',fromPos.top);
		newLine.setAttribute('x2',toPos.left); 	newLine.setAttribute('y2',toPos.top);
		newLine.setAttribute('class','path_connector');
		$(svg).append(newLine);

		if(typeof nth_input !== 'undefined') {
			var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
			circle.setAttribute('cx', fromPos.left);	circle.setAttribute('cy', fromPos.top);
			circle.setAttribute('r', "10");
			$(svg).append(circle);
			var nth =  document.createElementNS('http://www.w3.org/2000/svg','text');
			nth.setAttribute('text-anchor','middle');
			nth.setAttribute('x',fromPos.left);
			nth.setAttribute('y',fromPos.top+5);  nth.setAttribute('fill','black');
			$(nth).text(nth_input);
			$(svg).append(nth);

		}

	},
	clearConnector: function() {
		$("#pg_panel > #plate_container > #overlay > svg").empty();
	},

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
			$(pg.body).append(ui_el).show('fast');
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
		},
		save: function() {
			// var tr = $("#pg_data_ui > div > table > tr");
			// var node_id = $("#pg_data_ui").attr("node_id");
			// var data_list = _.map(tr, function(tr) {
			// 	return $(tr).find("td").text();
			// });
			// pg.panel.get_node_by_id(node_id).V = data_list;
		}
	},
	commandUI: {
		top:100,
		left:100,
		create: function() {
			$("#pg_command_ui").remove();
			
			var ui_el = $("<div id='pg_command_ui'>\
				<div class='header_panel'>\
					<div class='operation_info'>\
						<div class='operation_title'></div>\
						<div class='operation_description'></div>\
						<div class='operation_execute'><i class='fa fa-play-circle-o operation_execute_button'></i></div>\
					</div>\
					<div class='header_panel_tools_burger'><i class='fa fa-bars' style='font-size:14px; margin:5px;'></i></div>\
					<div class='header_panel_tools'>\
						<button class='duplicate_button'>duplicate</button> <button class='copy_button'>copy</button>\
						<button class='share_button'>share_across_tabs</button>\
						<button class='clear_data_button'>clear data</button>\
						<label>INSERT</label><button class='insert_left_button'>left</button>\
						<button class='insert_above_button'>above</button> \
						<label>DELETE</label><button class='delete_row_button'>row</button>\
						<button class='delete_column_button'>column</button> \
					</div>\
				</div>\
				<div class='data_panel'>\
					<div class='input_data'>\
						<div class='input_nodes_container'></div>\
						<div class='input_nodes_tools'>\
							<i class='fa fa-plus add_input_node_button'></i>\
						</div>\
					</div>\
					<div class='output_data'>\
						<div class='output_data_table'>\
							<ul class='data_ul'></ul>\
						</div>\
						<div class='output_data_tools' floating_buttons_at_the_bottom'>\
							<div class='output_data_info'><label>OUTPUT</label></div>\
							<div class='wrapper_tools'>\
								<i class='fa fa-repeat operation_execute_button'></i>\
								<i class='fa fa-trash-o'></i>\
							</div>\
							<div class='output_type_and_number'>\
							</div>\
						</div>\
					</div>\
				</div>\
				<div class='operation_panel'>\
					<div class='operation_menu'>\
						<div class='task_container'>\
						</div>\
						<div class='operation_container'>\
						</div>\
					</div>\
				</div>\
				</div>");
			$(ui_el).find(".header_panel_tools_burger").click(function() {
				console.log("burger");
				$("#pg_command_ui").find(".header_panel_tools").toggle("fast");
			});
			$(ui_el).find(".operation_execute_button").click(function() {
				var node = pg.panel.get_selected_nodes()[0];
				pg.panel.run_node(node);
			});
			$(ui_el).find(".duplicate_button").click(function() {
				pg.panel.duplicate_node();
			});
			$(ui_el).find(".copy_button").click(function() {
				pg.panel.copy_node_with_literal();
			});
			$(ui_el).find(".share_button").click(function() {
				pg.panel.share_node_across_tabs();
			});
			$(ui_el).find(".insert_left_button").click(function() {
				var node = pg.panel.get_selected_nodes()[0];
				var col = node.position[1];
				_.each(pg.panel.nodes, function(n){
					if(n.position[1]>=col) n.position[1]+=1;
				});
				pg.panel.redraw();
			});
			$(ui_el).find(".insert_above_button").click(function() {
				var node = pg.panel.get_selected_nodes()[0];
				var row = node.position[0];
				_.each(pg.panel.nodes, function(n){
					if(n.position[0]>=row) n.position[0]+=1;
				});
				pg.panel.redraw();
			});
			$(ui_el).find(".delete_row_button").click(function() {
				var node = pg.panel.get_selected_nodes()[0];
				var row = node.position[0];
				pg.panel.nodes = _.filter(pg.panel.nodes, function(n) {
					return n.position[0]!= row;
				});
				_.each(pg.panel.nodes, function(n){
					if(n.position[0]>=row) n.position[0]-=1;
				});
				pg.panel.redraw();
			});
			$(ui_el).find(".delete_column_button").click(function() {
				var node = pg.panel.get_selected_nodes()[0];
				var col = node.position[1];
				pg.panel.nodes = _.filter(pg.panel.nodes, function(n) {
					return n.position[1]!= col;
				});
				_.each(pg.panel.nodes, function(n){
					if(n.position[1]>=col) n.position[1]-=1;
				});
				pg.panel.redraw();
			});
			$(ui_el).find(".add_input_node_button").click(function() {
				var node = pg.panel.get_selected_nodes()[0];
				node.I.push("");
				pg.panel.redraw();
			});
			// add data tools
			$(ui_el).find("input.new_data_input").change(function(){
				pg.panel.commandUI.addData($(this).val());
				$(this).val("");
				$("#pg_command_ui").find("input.new_data_input").focus();
			});
			$(ui_el).find(".data_tools").find("i.fa-trash-o").click(function() {	pg.panel.empty();	});
			$(ui_el).find(".clear_data_button").click(function(e){pg.panel.empty(pg.panel.el_to_obj(e.target));});

			/////
			$('#pg').append(ui_el);	
			$(ui_el).css({
				'visibility':"visible",
				"top":pg.panel.commandUI.top + "px",
				"left":pg.panel.commandUI.left + "px"
			});
			$(ui_el).hover(function() {
				$("body").css("overflow","hidden");
			},function() {
				$("body").css("overflow","auto");
			});
			$(ui_el).draggable({handle: ".header_panel",
				start: function() {
					pg.panel.commandUI.turn_inspector(false);
				},
				stop: function(event, ui) {
					pg.panel.commandUI.top = ui.offset.top - $(window).scrollTop();;
					pg.panel.commandUI.left = ui.offset.left - $(window).scrollLeft();;
					pg.panel.commandUI.turn_inspector(true);
					console.log(ui.offset);
				}
			});
		},
		
		redraw: function() {
			var node = pg.panel.get_selected_nodes()[0];
			// 0. show current node information and operation detail
			// $("#pg_command_ui").find(".node_info_id").text(node.ID);
			// $("#pg_command_ui").find(".node_info_position").text("@"+ JSON.stringify(node.position));
			
			pg.panel.commandUI.updateCurrentOperationInfo(node);
			pg.panel.commandUI.updateSuggestedOperationInfo(node);
			pg.panel.commandUI.updateInputNodes(node);
			pg.panel.commandUI.renderDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
		},
		updateInputNodes: function(node) {
			var input_container = $("#pg_command_ui").find(".input_nodes_container");	 
			var input_el_list = pg.panel.commandUI.renderInputNodes(node);
			$(input_container).empty().append(input_el_list);
			// ADD MORe INPUT button
			// $("<center><i class='fa fa-plus-square-o' style='font-size:13px; color:#888; cursor:pointer;'> ADD MORE INPUT</i></center>").click($.proxy(function() {
			// 	this.node.I.push("");
			// 	pg.panel.redraw();
			// },{node:node})).appendTo(input_container);

		},
		updateCurrentOperationInfo: function(node) {
			var operation_info = $("#pg_command_ui").find(".operation_info");	 
			pg.panel.commandUI.renderOperationInfo(node, operation_info);
		},
		updateSuggestedOperationInfo: function(node) {
			var operation_container = $("#pg_command_ui").find("#operation_container");  	// main command UI
			var task_container = $("#pg_command_ui").find("#task_container");  	// main command UI
			$(operation_container).empty();   $(task_container).empty();

			// 0. infer tasks and operations
			var Is = _.without(_.map(node.I, function(input_id) {
				return pg.panel.get_node_by_id(input_id, node);
			}), false, undefined);
			var taskSuggestions = []; var opSuggestions=[];
			if(node.V && node.V.length>0) {
				taskSuggestions = (node.V && node.V.length>0)? pg.planner.plan(Is, node) : [];	
			} 
			opSuggestions = (Is.length>0)? pg.planner.find_applicable_operations(Is) : [];

			// 1. show taskSuggestions 
			if(taskSuggestions.length>0) {
				_.each(taskSuggestions, function(sn, sni) {
					var nodeSet = pg.panel.commandUI.makeSuggestedTaskButton(sn);
					$(task_container).append(nodeSet);
				});
			} else {
				$(task_container).append("<span style='margin-left:20px;'>No task is applicable.</span>");
			}
			
			// show applicable opSuggestions
			if(opSuggestions.length>0) {
				_.each(opSuggestions, function(op, opi)  {
					var commandButton = pg.panel.commandUI.makeSuggestedOperationButton(op);
					if(node && node.P && node.P.type==c.type) {
						// if the command is curreltly selected
						$(commandButton).attr('selected',true);
					}
					$(operation_container).append(commandButton);
				});
			}
			//  else {
			// 	$(operation_container).append("<span style='margin-left:20px;'>No operation is applicable.</span>");
			// } 
			// show the rest opSuggestions 
			var operation_types = _.map(opSuggestions, function(op){return op.type; });
			var rest_op = _.filter(pg.planner.get_all_operations(), function(op) {
				return operation_types.indexOf(op.type)==-1;
			});
			_.each(rest_op, function(op, opi) {
				var commandButton = pg.panel.commandUI.makeSuggestedOperationButton(op, true);
				$(operation_container).append(commandButton);
			});
		},
		renderInputNodes: function(node) {
			var input_nodes_el = [];
			//var width_per_node = Math.floor(100/Math.max(node.I.length, 2))-1;
			for(var i=0; i<node.I.length; i++) {
				try{
					var inputNode = pg.panel.get_node_by_id(node.I[i], node);
					var inputNode_el = $("<div class='input_node_info'>\
							<div class='input_node_header'>\
								<div class='input_node_index_and_id'>\
									<label>I"+(i+1)+" </label><input type='text' class='input_node_id' inputNodeIdx='"+i+"' value='"+node.I[i]+"'/>\
								</div>\
								<div class='wrapper_tools'>\
									<a class='pick_button' inputNodeIdx='"+i+"'><i class='fa fa-crosshairs'></i></a>\
									<a class='delete_button' inputNodeIdx='"+i+"'><i class='fa fa-trash-o'></i></a>\
								</div>\
								<div class='input_node_data_type_and_number'>\
									<span><b>"+((inputNode.V)?inputNode.V.length:0)+"</b> "+getValueType(inputNode.V)+"\
								</div>\
							</div>\
							<div class='input_node_data_container'>\
								<ul class='data_ul'></ul>\
							</div>\
						</div>");
					$(inputNode_el).find("input.input_node_id").change(function() {
						var i = $(this).attr('inputNodeIdx');
						var newInputID = $(this).val();
						(pg.panel.get_selected_nodes()[0]).I[i]=newInputID;
						pg.panel.redraw();
					});
					$(inputNode_el).find("a.pick_button").click($.proxy(function() {
						pg.panel.node_select_modal_on(this.i);
					},{i:i}));
					$(inputNode_el).find("a.delete_button").click($.proxy(function() {
						this.node.I.splice(this.i,1);
						pg.panel.redraw();
					},{node:node, i:i}));
					// render data in V
					var data_ul_el = $(inputNode_el).find("ul.data_ul").empty(); 
					if(inputNode.V) {
						pg.panel.commandUI.renderInputDataTable(inputNode.V, data_ul_el);		
					} 
					// $(inputNode_el).css("width",width_per_node+"px");
					input_nodes_el.push(inputNode_el);
				} catch(e) {	console.error(e.stack); 	continue;	}
			}
			return input_nodes_el;
		},
		renderOperationInfo: function(node, _container_el) {
			var container_el = (_container_el)?_container_el:$("<div></div>").get(0);
			var P = node.P;
			var title, description;
			if(typeof P==='undefined') {
				title="No operation is chosen";
				description="Select operation in the list or set output data that you want.";
			} else {
				title = (P.type)? P.type.toUpperCase().replace("_"," "): "Unknown";
				description= pg.panel.commandUI.renderDescription(node);
			}
			$(container_el).find(".operation_title").empty()
				.append(pg.Node.getNodeIcon(node))
				.append(title);
			$(container_el).find(".operation_description").empty()	
				.append(description);
			
			return $(container_el).get(0);
			// operation's parameter decriptions and default values from DSL
			// var paramEl = $("<div class='op_parameters'></div>").appendTo(container_el);
			// var parameters = pg.planner.operations[node.P.type].parameters;
			// if(parameters) {
			// 	_.each(parameters, function(p, p_key) {
			// 		// var current_value = (node.P.param[p_key])? node.P.param[p_key]: p.default; 
			// 		var current_value = node.P.param[p_key]; 
			// 		var param_div = $("<div class='op_param'><span>"+p.label+":</span></div>");
			// 		var func_update = $.proxy(function() {  // when user updates the parameter value
			// 			var param_key = $(event.target).attr('param_key');
			// 			var newParamValue = txt2var($(event.target).val());
			// 			this.P.param[param_key]=newParamValue;
			// 		},{P:P});
			// 		var param_input = $("<input type='text' param_key='"+p_key+"' value='"+current_value+"'>, ");
			// 		param_input.change(func_update);
			// 		// param_input.focusout(function() { console.log("focuseout!");});
			// 		// param_input.blur(function() { console.log("blur!");});
			// 		param_input.keyup(func_update);
			// 		param_input.appendTo(param_div);
			// 		$(param_div).appendTo(paramEl);
			// 	});	
			// }
			
			
		},
		renderDescription: function(node) {
			if(!node || typeof node.P==='undefined' || typeof node.P.description==='undefined') 
				return "No Description is available"
			var desc = node.P.description;
			var params_raw = desc.match(/\[\w+\]/g);
			var params_formated = _.map(params_raw, function(p) {
				var key = p.replace(/\[|\]/g,'');
				if(typeof node.param==='undefined' || !(key in node.param)) return "missing parameter!";
				else {
					var value = node.param[key];
					var param_el = $("<span paramKey='"+key+"'>"+value+"</span>")
						.click(function() {
							if($(this).find("input").length>0) return; // ignore click if input box is already there
							var value = $(this).text();
							var input_for_edit = $("<input type='text' value='"+value+"'></input>")
								.change(function() {
									var param_key = $(this).parent().attr("paramKey");
									var new_value = $(this).val();
									var node = pg.panel.get_selected_nodes()[0];
									node.P.param[param_key] = new_value;
								});
						});
					return param_el;
				}
			});
			for(var i=0;i<params_raw.length;i++) {
				desc.replace(params_raw[i], params_formated[i]);
			}
			return desc_el;
		},
		renderInputDataTable: function(V, target_ul) {
			$(target_ul).empty();
			for(i in V) {
				var v = V[i]; 	var idx_to_show = parseInt(i)+1;
				var entryEl = $("<li data_index='"+i+"'></li>"); 
				// $(entryEl).append("<label class='data_label'>"+idx_to_show+"</label>");
				// $(entryEl).find("label.data_label").click($.proxy(function() {
				// 	pg.panel.commandUI.addData(this.v);
				// },{v:v}));
				if(isDom(v)) {
					var attr_dict = get_attr_dict(v);  // get_attr_dict returns simplified attr->value object
					_.each(attr_dict, function(value,key) {
						var attr_el = $("	<div class='attr'>\
												<span class='attr_key'>"+ key +":\
												<i class='fa fa-sign-out hidden'></i></span>\
												<span class='attr_value' attr_key='"+key+"'>"+value+"</span>\
											</div>");
						// when attribute value is clicked, the value adds to the current node data
						$(attr_el).click($.proxy(function() {
							// var key = $(this).attr('attr_key');
							pg.panel.commandUI.addData(this.value);
						},{value:value}));	
						$(attr_el).appendTo(entryEl);
					});	
				} else {	// WHEN THE DATA is NOT DOM
					$(entryEl).append("	<div class='attr'><span class='attr_value'>"+v+"</span></div>");
				}
				$(target_ul).append(entryEl);
			}
		},
		renderDataTable: function(V, target_ul) {
			$(target_ul).empty();
			$(target_ul).parents(".output_data").find(".output_type_and_number")
				.empty()
				.append("<span><b>"+((V)?V.length:0)+"</b> "+getValueType(V)+"</span>");
			for(i in V) {
				var v = V[i]; 	var idx_to_show = parseInt(i)+1;
				var entryEl = $("<li data_index='"+i+"'></li>"); 
				// $(entryEl).find("label.data_label").click($.proxy(function() {
				// 	pg.panel.commandUI.addData(this.v);
				// },{v:v}));
				if(isDom(v)) {
					var attr_dict = get_attr_dict(v);  // get_attr_dict returns simplified attr->value object
					_.each(attr_dict, function(value,key) {
						var attr_el = $("	<div class='attr'>\
												<span class='attr_key'>"+ key +":\
												<span class='attr_value' attr_key='"+key+"'>"+value+"</span>\
											</div>").appendTo(entryEl);
					});	
				} else {	// WHEN THE DATA is NOT DOM
					$(entryEl).append("	<div class='attr'><span class='attr_value'>"+v+"</span></div>");
				}
				// create trash and other tool buttons
				var data_edit_buttons = $("<div class='data_edit_buttons'></div>")
					.appendTo(entryEl);
				$(entryEl).hover(function(){$(this).find(".data_edit_buttons").show();}, function(){$(this).find(".data_edit_buttons").hide();});
				$("<a class='delete_button'><i class='fa fa-trash-o'></i></button>").click(function() {
					var data_index = $(this).parents("li").attr("data_index");
					var node = pg.panel.get_selected_nodes()[0];
					node.V.splice(data_index,1);
					pg.panel.redraw();
				}).appendTo(data_edit_buttons);
				$(target_ul).append(entryEl);
			}
		},
		addData: function(val, targetNode) {
			var node = pg.panel.get_selected_nodes()[0];
			if(targetNode) node = targetNode;
			node.V.push(txt2var(val));
			pg.panel.commandUI.renderDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
			pg.panel.commandUI.updateSuggestedOperationInfo(node);
		},
		makeSuggestedTaskButton: function(_nodes) {
			var el = $("<div class='nodes'></div>"); 
			var nodes = $.makeArray(_nodes);
			_.each(nodes, function(n) {
				$("<div class='command'>"+ n.P.type +"</div>").appendTo(el);
			});
			$(el).click($.proxy(function() {
				pg.panel.insert(this, pg.panel.get_selected_nodes()[0]);
				pg.panel.run_node(this[0]);
			},nodes));
			return el;
		},
		makeSuggestedOperationButton: function(command, dimmed) {
			var el = $("<div class='command'>\
				<div class='com_icon'></div>\
				<div class='com_title'>"+ command.type +"</div>\
				</div>\
				"); 
			if(dimmed) $(el).attr('dimmed','yes');
			$(el).click($.proxy(function() {
				var n = pg.panel.get_selected_nodes()[0];
				n.P = this;
				pg.panel.run_node(n);
				pg.panel.redraw();
			},command));
			return el;
		},
		remove: function() {
			$("#pg_command_ui").remove();
			pg.panel.solutionNodes=[];
		},
		turn_inspector : function(mode){
			if(mode==undefined || mode==true) {
				pg.inspector.on(pg.panel.dataUI.create);	
			} else if(mode==false) {
				pg.inspector.unhighlight_list();
				pg.inspector.off(pg.panel.dataUI.remove);
			}
		}

	},
	toolbar: {
		create: function() {
			var ui_el = $("<div id='control_ui'>		\
					<input type='checkbox' class='active_checkbox'>\
					<span class='pg_title'></span>\
					<select id='script_selector'>	<option selected disabled>Load script</option>\
					</select>	\
					<button id='button_remove'>remove</button>\
					<button id='button_clear'>clear</button>\
					<button id='button_new'>new</button>\
					<button id='button_save'>save</button>\
					<button id='button_execute'>execute</button>\
					<label>ZOOM:</label>\
					<button class='zoom_button' id='zoom_to_low'  node_size=50>small</button>\
					<button class='zoom_button' id='zoom_to_mid'  node_size=150>medium</button>\
					<button class='zoom_button' id='zoom_to_high' node_size=300>large</button>\
					<button class='zoom_button' id='zoom_to_high' node_size='showAll'>show all</button>\
					<label>&nbsp;SCRIPT:</label>\
					<button class='button_copy_script' id='button_copy_script'>copy</button>\
					<button class='button_paste_script' id='button_paste_script'>paste</button>\
				</div>\
			");
			$(ui_el).find(".pg_title").text(pg.panel.title);
			_.each(pg.load_all_scripts(), function(script,title) {
				var option = $("<option></option")
					.attr('value',title)
					.text(title).appendTo($(ui_el).find("#script_selector"));
			},this);
			$(ui_el).find("#script_selector").change(function() {
				$("#script_selector option:selected").each(function() {
					var title = $(this).attr('value');
					pg.load_script(title);
				});
			});
			$(ui_el.find("#button_remove")).click(function() {
				pg.remove_script(pg.panel.title);
				var programs = pg.load_all_scripts();
				for(var k in programs) {
					pg.load_script(k);
					break;
				}
			});
			$(ui_el.find("#button_clear")).click(function() {
				pg.clear_script();
			});
			$(ui_el.find("#button_new")).click(function() {
				// use modal to get title of new script
				var diag_content = $("	<div class='dialog_content'> \
		  					<p> New Script </p>\
		  					<p> Please enter a name for the script. </p> \
		  					<p><input type='text' id='new_script_title'></input></p> \
		  					<p><button class='button_ok'>OK</button> \
		  						<button class='button_cancel'>Cancel</button> \
		  					</p> \
						</div>");
				$(diag_content).find(".button_ok").click(function() {
					pg.new_script($("#new_script_title").val());
					pg.close_dialog();
				});
				$(diag_content).find(".button_cancel").click(pg.close_dialog);
				pg.open_dialog(diag_content);
			});
			$(ui_el.find("#button_save")).click(function() {
				var active = $(pg.body).find("#control_ui").find(".active_checkbox").prop('checked');
				pg.save_script(pg.panel.title,{nodes:pg.panel.nodes, active:active});
			});
			$(ui_el.find("#button_execute")).click(pg.panel.execute);
			$(ui_el).find('button.zoom_button').click(function() {
				pg.panel.zoom($(this).attr('node_size'));
			});
			// $(ui_el).find("#delete_node").click(function() {
			// 	pg.panel.delete("selected_node");
			// 	pg.panel.redraw();
			// });
			$(ui_el).find("#button_copy_script").click(function() {
				pg.panel.copy_script();
			});
			$(ui_el).find("#button_paste_script").click(function() {
				pg.panel.paste_script();
			});
			$("#pg > #pg_panel").append(ui_el);
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
					//if(pg.panel.get_selected_nodes()[0]!=node) pg.panel.select(node);
					pg.panel.redraw();
				}
			})
			.hover(function(){
				if($(""))
				var node = pg.panel.get_node_by_id($(this).attr('id'));
				// pg.panel.node_show_inputs(node);
			},function(){
				var node = pg.panel.get_node_by_id($(this).attr('id'));
				// pg.panel.node_hide_inputs(this);
			})
			.dblclick(function(e) {
				// console.log($(this).attr('id') + " is double clicked");
				// var clicked_node = pg.panel.get_node_by_id($(this).attr("id"));
				// pg.panel.zoom([clicked_node]);
				e.stopPropagation();
			});
		$(".node .node_content").click(function(e) {
			var n = $(e.target).parents(".node");
			if($(n).is('.ui-draggable-dragging')){
				return;
			}
			var node = pg.panel.get_node_by_id($(n).attr('id'));
			var previously_selected_node = pg.panel.get_selected_nodes()[0];
			console.log(node);
			if(node==previously_selected_node) pg.panel.deselect();
			else {
				pg.panel.deselect();
				pg.panel.select(node);
			}
			e.stopPropagation();
			// console.log("Click: "+$(e.target).attr("id"));
			// plate.toggleNode($(e.target).attr("id"));
		})

		// now attach event handlers
		// 1. create a new tile when empty plate is clicked
		var el_tiles = $("#pg").find("#tiles");
		$(el_tiles).off('dblclick').dblclick(function(e) {
			var mouse_coord = {left: e.pageX - $(this).offset().left,
								top: e.pageY - $(this).offset().top};
			var mouse_pos = {left: Math.floor(mouse_coord.left/pg.panel.node_dimension), 
							top: Math.floor(mouse_coord.top/pg.panel.node_dimension)};
			e.stopPropagation();
			console.log("plate clicked "+ mouse_pos.left + "," +mouse_pos.top);
			var new_node = pg.Node.create();
			new_node.position = [mouse_pos.top, mouse_pos.left];
			console.log("before push");
			pg.panel.nodes.push(new_node);
			console.log("before redraw");
			pg.panel.redraw();
			console.log("after redraw");
			pg.panel.select(new_node);

		});
		$(el_tiles).off('click').click(function(e) {
			pg.panel.deselect();
		});


		$(this.el).find("#resize_handle_panel").draggable({
			axis: "y",
			start: function() {
				if(pg.inspector.flag_inspect) {
					pg.panel.commandUI.turn_inspector(false);
					pg.panel.inspector_suspended = "yes";
				}
			},
			stop: function(event, ui) {				
				if(pg.panel.inspector_suspended=="yes") {
					pg.panel.commandUI.turn_inspector(true);
					pg.panel.inspector_suspended = undefined;
				}
				var top = ui.offset.top - $(window).scrollTop();;
				var left = ui.offset.left - $(window).scrollLeft();;
				console.log(left + " , " + top);
				
				// console.log($(window).height()-$(this).offset().top);
				// console.log($(this).offset());
				$(pg.panel.el).height(window.innerHeight-top);
				$(this).css({'top':0});
				$("#pg_spacer").height($(pg.panel.el).height());
			}
		});

		$("#pg_panel").hover(function() {
			$("body").css("overflow","hidden");
		},function() {
			$("body").css("overflow","auto");
		});

		// $('body').unbind('click').on('click',':not(#pg)',function(e) {
		// 	e.stopPropagation();
		// 	pg.panel.commandUI.remove();
		// });

		// 2. drag plate to pan
	},


	


}



