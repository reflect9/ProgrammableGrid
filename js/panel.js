pg.panel = {
	init: function(title, nodes){
		$("#pg").empty();
		this.title = (title)? title:"untitled";
		this.nodes = (nodes)? nodes:[];
		this.commands = [];
		this.selected_elements = [];
		this.node_dimension = DEFAULT_NODE_DIMENSION;
		this.el = $("<div id='pg_panel' class='panel'>\
								<div id='resize_handle_panel'></div>\
								<div id='plate_container'>\
									<div id='tiles'></div>\
									<div id='plate'></div>\
								</div>\
					</div>").appendTo($("#pg"));
		// add dummy space at the end
		$("<div id='pg_spacer'></div>").css({
			'display':'block',
			'position':'relative',
			'clear':'both',
			'width':'100%'
		}).appendTo($("#pg"));
		$("#pg_spacer").height($(this.el).height());
		// attach editUI and commandUI
		this.editUI.create();
		// this.commandUI.create();  this.commandUI.remove();
		this.toolbar.create();
		//
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
	deselect: function() {
		pg.inspector.unhighlight_list();
		pg.inspector.off();
		$("#tiles .node").removeAttr("selected");
		_.each(pg.panel.nodes, function(n) { n.selected=false; });
		pg.panel.commandUI.remove();
	},
	select: function(node) {
		var node_el = $("#"+node.ID).get(0);
		// deselect all others
		$("#tiles .node").removeAttr("selected");
		// select ON
		if(node.selected==false || node.selected==undefined) {
			$(node_el).attr("selected",true);
			_.each(pg.panel.nodes, function(n) { n.selected=false; });
			node.selected = true;
			pg.panel.commandUI.redraw();
			pg.panel.commandUI.turn_inspector(true);
		} else{	// select OFF
			// pg.panel.redraw();
			_.each(pg.panel.nodes, function(n) { n.selected=false; });
			$(node_el).attr("selected",false);
			pg.panel.commandUI.remove();
			pg.panel.commandUI.turn_inspector(false);
		}
		
	},
	delete: function(target_nodeObj) {
		pg.inspector.unhighlight_list();
		if(!target_nodeObj) target_nodeObj = pg.panel.get_selected_nodes()[0];
		this.nodes = _.without(pg.panel.nodes, target_nodeObj);
		this.commandUI.remove();
		this.redraw();
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
	edit_data: function(target_nodeObj) {
		if(!target_nodeObj) target_nodeObj = pg.panel.get_selected_nodes()[0];
		var dataUI;
		if($("#pg_data_ui").length==0) 
			dataUI = pg.panel.dataUI.create(target_nodeObj);
		else 
			dataUI = $("#pg_data_ui");
		pg.panel.dataUI.loadData(target_nodeObj.V);
		$(dataUI).appendTo($("#pg").get(0));
	},
	insert: function(new_nodes, target_node) {
		// replace target_node with nodes and push nodes on the right side to right
		var target_position = target_node.position;
		var ID_deleted_O = target_node.ID;
		this.delete(target_node);
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
			nd.position=[target_position[0], target_position[1]+ni]; 
			pg.panel.nodes.push(nd);
		}
		_.each(new_nodes, function(nd) {
			nd.I = _.map(nd.I, function(input_id) {	// replace nd.I with <left> if the left node is the input node.
				if(input_id == pg.panel.get_node_by_id("_left",nd)) return "_left";
				else if(input_id == pg.panel.get_node_by_id("_above",nd)) return "_above";
				else if(input_id == pg.panel.get_node_by_id("_right",nd)) return "_right";
				else if(input_id == pg.panel.get_node_by_id("_below",nd)) return "_below";
				else return input_id;
			});
		});
		pg.panel.redraw();
		
	},
	get_left_node:function(node) {
		return pg.panel.get_node_by_position([node.position[0], node.position[1]-1]);
	},
	get_right_node:function(node) {
		return pg.panel.get_node_by_position([node.position[0], node.position[1]+1]);
	},
	get_above_node:function(node) {
		return pg.panel.get_node_by_position([node.position[0]-1, node.position[1]]);
	},
	get_below_node:function(node) {
		return pg.panel.get_node_by_position([node.position[0]+1, node.position[1]]);
	},
	get_selected_nodes:function() {
		return _.map($("#tiles .node[selected]").toArray(), function(nodeEl) {
			return pg.panel.get_node_by_id($(nodeEl).prop('id'));
		});
	},
	get_node_by_id: function(node_id, reference_output_node) {
		if(node_id == '_left' && reference_output_node) return this.get_left_node(reference_output_node);
		if(node_id == '_above' && reference_output_node) return this.get_above_node(reference_output_node);
		if(node_id == '_right' && reference_output_node) return this.get_right_node(reference_output_node);
		if(node_id == '_below' && reference_output_node) return this.get_below_node(reference_output_node);
		for(var i in this.nodes) {
			if (this.nodes[i].ID == node_id) return this.nodes[i];
		}	return false;
	},
	get_node_by_position: function(position) {
		for(var i in this.nodes) {
			if (this.nodes[i].position[0] == position[0] && this.nodes[i].position[1] == position[1]) return this.nodes[i];
		}	return false;
	},	
	get_next_nodes:function(node) {
		return _.filter(allNodes, function(n) {
			return _.indexOf(n.I, node.ID) != -1;
		});
	},
	get_prev_nodes:function(node) {	
		return _.map(node.I, function(input_id) {
			return pg.panel.get_node_by_id(input_id, node);
		});	
	},
	get_ready_nodes:function(_allNodes) {
		var allNodes = (_allNodes)?_allNodes: pg.panel.nodes;
		return _.filter(allNodes, function(n) {
			if(n.executed) return false;
			var prev_nodes = pg.panel.get_prev_nodes(n);
			if (_.filter(prev_nodes, function(n) { return n.executed==true; }).length==prev_nodes.length ) return true;
			else return false;	
		});
	},
	el_to_obj:function(el) {
		return pg.panel.get_node_by_id($(el).prop('id'));
	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  executions methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// run_single_node: function(nodeObj) {
	// 	if(!nodeObj) return false;
	// 	if(!nodeObj.P) return false;
	// 	nodeObj.executed = true;
	// 	pg.planner.execute(nodeObj);
	// 	pg.panel.redraw();
	// },
	run_triggered_nodes: function(starting_nodes, nodes) {
		// reset 'executed' property of every node
		if(nodes==undefined) nodes = _.clone(pg.panel.nodes);
		_.each(nodes, function(n) { n.executed = False; });	
		if(starting_nodes==undefined) 
			starting_nodes = _.filter(nodes, function(node) {
				return 	node.P && node.P.param && node.P.param.type=='trigger' && 
						node.P.param.event_source=="page" && node.P.param.event_type=="loaded"; 
			});
		count==0;
		var queue = starting_nodes;
		// nodes = _.difference(nodes, queue);
		while(queue.length>0 && count<500){
			var node_to_execute = queue.pop();
			node_to_execute.execute();
			// nodes = _.difference(nodes, queue);
			var nodes_ready = get_ready_nodes(nodes);
			queue = _.union(queue, nodes_ready);
			console.log("---");
			console.log(queue);	console.log(nodes);
			console.log("---");
			count++;
		}
	},
	infer: function(output_node) {
		var Is = _.without(_.map(output_node.I, function(input_id) {
			return pg.panel.get_node_by_id(input_id, output_node);
		}), false);
		var O = output_node;
		if(O.V.length==0) {
			return pg.planner.find_applicable_operations(Is); // return a list of operations
		} else {
			if(Is.length>0) {
				return pg.planner.plan(Is, O);	
			} else {
				return [];
			}
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
		this.drawPlate();
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
	},
	drawPlate: function() {
		var el_plate = $("#pg_panel > #plate_container > #plate");
		$(el_plate).children().remove();
		var canvas = $("<canvas id='plate_canvas' width='3000' height='3000'></canvas>");
		$(el_plate).append(canvas);
		var ctx = canvas.get(0).getContext("2d");
		ctx.fillStyle = "#eeeeee";
		var num_row = Math.round(DEFAULT_PLATE_DIMENSION / this.node_dimension);
		var num_col = Math.round(DEFAULT_PLATE_DIMENSION / this.node_dimension);
		for (r=0;r<num_row;r++) {
			for(c=0;c<num_col;c++) {
				ctx.fillRect(	c*this.node_dimension+NODE_MARGIN, r*this.node_dimension+NODE_MARGIN, 
								this.node_dimension-NODE_MARGIN*2, this.node_dimension-NODE_MARGIN*2);		
			}
		}
	},
	dataUI: {
		create: function(nodeObj, holder) {
			var ui_el = $("<div id='pg_data_ui' node_id='"+nodeObj.ID+"'>\
					<div>\
						<table>\
						</table>\
					</div>\
				</div>\
				");
			$("<button>Empty data</button>").click($.proxy(function(){pg.panel.empty(this);}, nodeObj ))
				.appendTo($(ui_el).find("#node_tools"));
			// $(ui_el).find("table").
			if(holder) {
				$(ui_el).appendTo(holder);
			}
			return ui_el;
		},
		loadData: function(data) {
			var datatable = $("#pg_data_ui > div > table").empty();
			if(datatable.length==0) return;
			_.each(data, function(v) {
				$(datatable).append($("<tr><td>"+v+"</td></tr>"));
			});
		},
		open: function() {
			$("#pg_data_ui").show();
		},
		close: function() {
			$("#pg_data_ui").hide();
		},
		save: function() {
			var tr = $("#pg_data_ui > div > table > tr");
			var node_id = $("#pg_data_ui").attr("node_id");
			var data_list = _.map(tr, function(tr) {
				return $(tr).find("td").text();
			});
			pg.panel.get_node_by_id(node_id).V = data_list;
		}
	},
	editUI: {
		create: function() {
			var ui_el = $("<div id='pg_edit_ui'>  \
				<div>\
					<button class='edit_button'>Edit</button>\
					<button class='load_page_button'>Current Page</button>\
					<button class='select_button'>Select</button>\
				</div>\
				<div id='inspector_all_sel'>\
					<div class='label_selected_elements'>no selection</div>\
					<div class='table_inspector'>\
						<ul></ul>\
					</div>\
					<div class='buttons_inspector'>\
						<button class='release_button'>Release</button>\
						<button class='extract_button'>Extract</button>\
					</div>\
				</div>\
			</div>");
			$(ui_el).find(".edit_button").click(function() {
				// Turn PBD ON.  User still can interact with page elements. 
				// It monitors and suggests relevant commands for user's interaction
				if(pg.editor.flag_inspect) {
					pg.editor.off();
				} else {
					pg.editor.on();
				}
			});
			$(ui_el).find(".select_button").click(function(event) {
				pg.panel.editUI.toggle_select();
			});
			$(ui_el).find(".load_page_button").click(function() {
				var currently_selected_nodes = _.filter(pg.panel.nodes, function(n) { return n.selected==true; });
				if(currently_selected_nodes.length>0) {
					var n = currently_selected_nodes[0];
					n.V = $("body").toArray();
					n.P = pg.planner.get_prototype({type:"loadPage"});
				} else {
					console.log("no node is selected now.");
				}
				pg.panel.redraw();
			});
			// $(ui_el).find(".snapshot_button").click(function() {
			// 	var currently_selected_nodes = _.filter(pg.panel.nodes, function(n) { return n.selected==true; });
			// 	if(currently_selected_nodes.length>0) {
			// 		var n = currently_selected_nodes[0];
			// 		var body = $("body").clone();
			// 		$(body).find("#pg_panel").remove();
			// 		$(body).find("#pg_edit_ui").remove();
			// 		$(body).find("#pg_command_ui").remove();
			// 		n.V = $(body).toArray();
			// 	} else {
			// 		console.log("no node is selected now.");
			// 	}
			// 	pg.panel.redraw();
			// });
			$(ui_el).find(".release_button").click(function() {
				pg.panel.editUI.deselect_elements();
				pg.panel.editUI.toggle_select("off");
			});
			$(ui_el).find(".extract_button").click(function() {
				pg.panel.editUI.extract_selected_elements(pg.panel.selected_elements);
				pg.panel.editUI.deselect_elements();
				pg.panel.editUI.toggle_select("off");
			});
			
			$("#pg").append(ui_el);
			$(ui_el).draggable();
		},
		toggle_select: function(mode) {
			var select_button = $("#pg_edit_ui").find(".select_button");
			if(mode && mode=='on') {
				$(select_button).addClass("selected");
				pg.inspector.on(pg.panel.editUI.callback_select_element);	
			} else if(mode && mode=='off') {
				pg.inspector.off();
				$(select_button).removeClass("selected");
			} else {
				// when mode is not defined 
				if($(select_button).hasClass("selected")) {
					$(select_button).removeClass("selected");
					pg.inspector.off();
				} else {
					$(select_button).addClass("selected");
					pg.inspector.on(pg.panel.editUI.callback_select_element);	
				}
			}
		},
		callback_select_element: function(el) {	// called by Inpector when a page element is selected
			if(!(el in pg.panel.selected_elements)) 
				pg.panel.selected_elements.push(el);
			var attr_table_el = $("#pg_edit_ui").find(".table_inspector").find("ul");
			pg.inspector.unhighlight_list();
			pg.inspector.highlight_list(pg.panel.selected_elements);
			pg.panel.editUI.updateInspector(pg.panel.selected_elements, $(attr_table_el).get(0));
		},
		deselect_elements: function() {
			pg.panel.selected_elements = [];
			pg.inspector.unhighlight_list();		
			$("#pg_edit_ui").find(".table_inspector").find("ul").empty();
			var num_label = $("#inspector_all_sel > .label_selected_elements");
			$(num_label).text("Nothing selected.");
		},
		extract_selected_elements: function(els) {
			// add selected elements to the V of the current node
			var currently_selected_nodes = _.filter(pg.panel.nodes, function(n) { return n.selected==true; });
			if(currently_selected_nodes.length>0) {
				var n = currently_selected_nodes[0];
				if(n.V==undefined) n.V=[];
				n.V = _.union(n.V, els);
			} else {
				console.log("no tile is selected now.");
			}
			pg.panel.redraw();
		},
		updateInspector: function(els, target_ul) {
			$(target_ul).empty();
			var attr_dict = get_attr_dict(els);
			var num_label = $("#inspector_all_sel > .label_selected_elements");
			if(els.length>0) {
				$(num_label).text(els.length+" selected.");
				_.each(attr_dict, function(value,key) {
					$(target_ul).append("	<li class='attr'><span class='attr_key'>"+ key +":</span>   \
											<span class='attr_value'>"+value+"</span></li>	\
						");
				});	
			} else { // when nothing is selected
				$(num_label).text("Nothing selected.");
			}
			
			// 
			// get all the property keys of els 

		}
	},
	commandUI: {
		top:100,
		left:100,
		create: function() {
			$("#pg_command_ui").remove();
			
			var ui_el = $("<div id='pg_command_ui' title='commands'>\
				<div class='header_panel'>\
					<div class='node_info'>\
						<label>Node ID: </label><span class='node_info_id'></span><span class='node_info_position'></span>\
					</div>\
				</div>\
				<div class='upper_panel'>\
					<div class='input_data'>\
						<label>Input nodes</label>\
						<div class='input_nodes_container'></div>\
					</div>\
					<div class='operation_menu'>\
						<label>Current Operation</label>\
						<div class='operation_info'>\
						</div>\
						<label>Operations satisfying Input and Data </label>\
						<div id='task_container'>\
						</div>\
						<label>Operations suitable for Input</label>\
						<div id='operation_container'>\
						</div>\
					</div>\
					<div class='output_data'>\
						<label>Data of the node</label>\
						<div class='pg_ul_container'><ul class='data_ul'>\
						</ul></div>\
						<div class='output_data_buttons floating_buttons_at_the_bottom'>\
							<input type='text' class='new_data_input' placeholder='Add new data'></input><br>\
							<button class='extract_button'>Extract</button>\
							<button class='clear_button'>Clear</button>\
						</div>\
					</div>\
				</div>\
				<div class='lower_panel'>\
					<div id='node_tools'></div>\
				</div>\
				</div>");
			
			// $(ui_el).find("button.infer_op_button").click(function() { pg.panel.commandUI.inferOperations(); });
			// $(ui_el).find("button.infer_task_button").click(function() {  pg.panel.commandUI.inferTasks(); });

			// add node tools
			// $("<button>Execute operation</button>").click(function(e){
			// 	pg.panel.run_single_node(pg.panel.get_selected_nodes()[0]);
			// }).appendTo($(ui_el).find("#node_tools"));
			// $("<button>Delete node</button>").click(function(e){pg.panel.delete(pg.panel.el_to_obj(e.target));}).appendTo($(ui_el).find("#node_tools"));
			// $("<button>Clear data</button>").click(function(e){pg.panel.empty(pg.panel.el_to_obj(e.target));}).appendTo($(ui_el).find("#node_tools"));
			
			// add data tools
			$(ui_el).find("input.new_data_input").change(function(){
				pg.panel.commandUI.addData($(this).val());
				$(this).val("");
				$("#pg_command_ui").find("input.new_data_input").focus();
			});
			$(ui_el).find("button.extract_button").click(function() { pg.panel.commandUI.toggleExtract(); });
			$(ui_el).find("button.clear_button").click(function(e){pg.panel.empty(pg.panel.el_to_obj(e.target));});

			/////
			$('#pg').append(ui_el);	
			$(ui_el).css({
				'visibility':"visible",
				"top":pg.panel.commandUI.top + "px",
				"left":pg.panel.commandUI.left + "px"
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
			var Is = _.without(_.map(node.I, function(input_id) {
				return pg.panel.get_node_by_id(input_id, node);
			}), false, undefined);
			var applicable_tasks = []; var applicable_operations=[];
			if(node.V && node.V.length>0) {
				applicable_tasks = (node.V && node.V.length>0)? pg.planner.plan(Is, node) : [];	
			} 
			applicable_operations = (Is.length>0)? pg.planner.find_applicable_operations(Is) : [];
			pg.panel.commandUI.update(applicable_tasks, applicable_operations, node);	
		},
		update: function(solutionNodes, operations, node) {
			if($("#pg_command_ui").length==0) pg.panel.commandUI.create();	// open if it's closed
			var operation_container = $("#pg_command_ui").find("#operation_container");  	// main command UI
			var task_container = $("#pg_command_ui").find("#task_container");  	// main command UI
			var operation_info = $("#pg_command_ui").find(".operation_info");	 
			var input_container = $("#pg_command_ui").find(".input_nodes_container");	 
			var node_info = $("#pg_command_ui").find(".node_info");	 
			var output_data_ul = $("#pg_command_ui").find(".output_data").find("ul.data_ul");	 
			$(operation_container).empty();	$(operation_info).empty(); $(input_container).empty(); 
			$(task_container).empty();

			// 0. show current node information and operation detail
			$(node_info).find(".node_info_id").text(node.ID);
			$(node_info).find(".node_info_position").text(JSON.stringify(node.position));
			// show operation detail
			if(node) {
				if(node.P) {
					$(operation_info).append("<div><b>"+node.P.type+"</b>. "+node.P.description+"</div>");
					var parameters = pg.planner.operations[node.P.type].parameters;
					if(parameters) {
						var paramEl = $("<div class='op_parameters'></div>").appendTo(operation_info);
						_.each(parameters, function(p, p_key) {
							// var current_value = (node.P.param[p_key])? node.P.param[p_key]: p.default; 
							var current_value = node.P.param[p_key]; 
							var param_div = $("<div class='op_param'><span>"+p.label+":</span></div>");
							var param_input = $("<input type='text' name='"+p_key+"' value='"+current_value+"'>, ").
								change(function() {  // when user updates the parameter value
									var paramKey = $(this).attr('name');
									var newParamValue = txt2var($(this).val());
									(pg.panel.get_selected_nodes()[0]).P.param[paramKey]=newParamValue;
								}).appendTo(param_div);
							$(param_div).appendTo(paramEl);
						});	
					}

					// add execute button for current operation
					$("<div class='op_execute_button'>RUN</div>").click(function() {
						pg.panel.run_single_node(pg.panel.get_selected_nodes()[0]);
					}).appendTo(operation_info);
				} else {
					$(operation_info).append("<span>No operation yet.</span>");
				}
			} 

			// 1. show input nodes
			for(var i=0; i<node.I.length; i++) {
				try{
					var inputNode = pg.panel.get_node_by_id(node.I[i], node);
					var inputNode_el = $("<div>\
							<span>"+(i+1)+" </span><input type='text' inputNodeIdx='"+i+"' value='"+node.I[i]+"'>\
							<div class='pg_ul_container'><ul class='data_ul'></ul></div>\
						</div>")
					$(inputNode_el).find("input").change(function() {  // UPDATE INPUT NODE ID
						var i = $(this).attr('inputNodeIdx');
						var newInputID = $(this).val();
						(pg.panel.get_selected_nodes()[0]).I[i]=newInputID;
					});
					pg.panel.commandUI.makeDataTable(inputNode.V, $(inputNode_el).find("ul.data_ul"), true);
					$(input_container).append(inputNode_el);
				} catch(e) {	console.error(e.stack); 	continue;	}
			}

			// 1. show solutionNodes 
			if(solutionNodes.length>0) {
				_.each(solutionNodes, function(sn, sni) {
					var nodeSet = pg.panel.commandUI.makeNodesEl(sn);
					$(task_container).append(nodeSet);
				});
			} else {
				$(task_container).append("<span style='margin-left:20px;'>No task is applicable.</span>");
			}
			
			// show applicable operations
			if(operations.length>0) {
				_.each(operations, function(op, opi)  {
					var commandButton = pg.panel.commandUI.makeCommandEl(op);
					if(node && node.P && node.P.type==c.type) {
						// if the command is curreltly selected
						$(commandButton).attr('selected',true);
					}
					$(operation_container).append(commandButton);
				});
			} else {
				$(operation_container).append("<span style='margin-left:20px;'>No operation is applicable.</span>");
			}
			
			// DATATABLE
			this.makeDataTable(node.V, output_data_ul);
		},
		inferOperations: function() {
			var node = pg.panel.get_selected_nodes()[0]; 
			var Is = _.without(_.map(node.I, function(input_id) {
				return pg.panel.get_node_by_id(input_id, node);
			}), false, undefined);
			var inferredOperations = pg.planner.find_applicable_operations(Is);
			pg.panel.commandUI.update([], inferredOperations, node);	
		},
		inferTasks: function() {
			var node = pg.panel.get_selected_nodes()[0]; 
			var Is = _.without(_.map(node.I, function(input_id) {
				return pg.panel.get_node_by_id(input_id, node);
			}), false, undefined);
			var inferredTasks = pg.planner.plan(Is, O);	
			pg.panel.commandUI.update(inferredTasks, [], node);	
		},
		makeDataTable: function(V, target_ul, isReadOnly) {
			$(target_ul).empty();
			if(!isReadOnly && V.length==0) {
				var html = "<div class='data_table_instruction_container'>\
								<div class='dt_inst'>\
									The node data is empty.<br> You can either<br>\
									<button class='extract_button'>Extract from page</button>\
									<div style='width:100%; text-align:center'>or</div>\
									<input class='input_type_data' placeholder='Type data here'></input>\
								</div>\
							</div>";
				var datable_el = $(html).appendTo(target_ul);
				$(datable_el).find("input.input_type_data").change(function() {
					pg.panel.commandUI.addData($(this).val());
					$(this).val("");
					$("#pg_command_ui").find(".new_data_input").focus();
				});
				$(datable_el).find("button.extract_button").click(function(){ pg.panel.commandUI.toggleExtract(); });
				$("#pg_command_ui").find(".output_data_buttons").hide();
			} else {	// node has some data to display
				for(i in V) {
					var v = V[i]; 
					var entryEl = $("<li data_index='"+i+"'></li>"); 
					if(isDom(v)) {
						var attr_dict = get_attr_dict(v);  // get_attr_dict returns simplified attr->value object
						_.each(attr_dict, function(value,key) {
							$(entryEl).append("	<div class='attr'><span class='attr_key'>"+ key +":</span>\
												<span class='attr_value'>"+value+"</span></div>");
						});	
					} else {	// WHEN THE DATA is NOT DOM
						$(entryEl).append("	<div class='attr'><span class='attr_value'>"+v+"</span></div>");
					}
					if(isReadOnly) { }
					else {	// edit buttons for individual data
						var data_edit_buttons = $("<div class='data_edit_buttons'></div>")
							.appendTo(entryEl);
						$(entryEl).hover(function(){$(this).find(".data_edit_buttons").show();}, function(){$(this).find(".data_edit_buttons").hide();});
						$("<button class='edit_button'>E</button>").click(function() {
							// TBD
						}).appendTo(data_edit_buttons);
						$("<button class='delete_button'>D</button>").click(function() {
							var data_index = $(this).parents("li").attr("data_index");
							var node = pg.panel.get_selected_nodes()[0];
							node.V.splice(data_index,1);
							pg.panel.redraw();
						}).appendTo(data_edit_buttons);
					}	// end of edit buttons
					$(target_ul).append(entryEl);
				}
				$("#pg_command_ui").find(".output_data_buttons").show();
			}
		},
		addData: function(val, targetNode) {
			var node = pg.panel.get_selected_nodes()[0];
			if(targetNode) node = targetNode;
			node.V.push(txt2var(val));
			pg.panel.commandUI.makeDataTable(node.V, $("#pg_command_ui").find(".output_data").find("ul.data_ul"));
			pg.panel.redraw();
		},
		makeNodesEl: function(_nodes) {
			var el = $("<div class='nodes'></div>"); 
			var nodes = $.makeArray(_nodes);
			_.each(nodes, function(n) {
				$("<div class='command'>"+ n.P.type +"</div>").appendTo(el);
			});
			$(el).click($.proxy(function() {
				pg.panel.insert(this, pg.panel.get_selected_nodes()[0]);
			},nodes));
			return el;
		},
		makeCommandEl: function(command) {
			var el = $("<div class='command'>\
				<div class='com_icon'></div>\
				<div class='com_title'>"+ command.type +"</div>\
				</div>\
				"); 
			$(el).click($.proxy(function() {
				pg.panel.get_selected_nodes()[0].P = this;
				pg.panel.redraw();
			},command));
			return el;
		},
		remove: function() {
			$("#pg_command_ui").remove();
			pg.panel.solutionNodes=[];
		},
		turn_inspector : function(mode){
			if(mode==undefined) {
				pg.inspector.toggle(function(el){
					pg.panel.commandUI.addData(el);
				});	
			} else if(mode==true) {
				pg.inspector.toggle(function(el){
					pg.panel.commandUI.addData(el);
				});
			} else if(mode==false) {
				pg.inspector.unhighlight_list();
				pg.inspector.off();
			}
		}

	},
	toolbar: {
		create: function() {
			var ui_el = $("<div id='control_ui'>		\
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
				pg.save_script(pg.panel.title,pg.panel.nodes);
			});
			$(ui_el.find("#button_execute")).click(function() {
				pg.execute();
			});
			$(ui_el).find('button.zoom_button').click(function() {
				pg.panel.zoom($(this).attr('node_size'));
			});
			$(ui_el).find("#delete_node").click(function() {
				pg.panel.delete("selected_node");
				pg.panel.redraw();
			});
			$("#pg > #pg_panel").append(ui_el);
		}
	},

	attachEventListeners: function() {
		$(".node")
			.off()
			.draggable({ 	
				grid: [ this.node_dimension, this.node_dimension],
				stop: function(e) {
					var node = pg.panel.get_node_by_id($(this).attr('id'));
					if(node) {
						var position = [ Math.floor($(this).position().top / pg.panel.node_dimension),
											Math.floor($(this).position().left / pg.panel.node_dimension)	];
						if (_.isEqual(position,node.position)) return;
						var existing_node = pg.panel.get_node_by_position(position);
						if(existing_node) pg.panel.delete(existing_node);
						node.position = position;
					}
					pg.panel.redraw();
				}
			})
			.dblclick(function(e) {
				// console.log($(this).attr('id') + " is double clicked");
				// var clicked_node = pg.panel.get_node_by_id($(this).attr("id"));
				// pg.panel.zoom([clicked_node]);
				e.stopPropagation();
			})
			.click(function(e) {
				if($(this).is('.ui-draggable-dragging')){
					return;
				}
				var node = pg.panel.get_node_by_id($(this).attr('id'));
				console.log(node);
				pg.panel.select(node);
				e.stopPropagation();
				// console.log("Click: "+$(e.target).attr("id"));
				// plate.toggleNode($(e.target).attr("id"));
			});
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
			pg.panel.nodes.push(new_node);
			pg.panel.redraw();
			pg.panel.select(new_node);

		});
		$(el_tiles).off('click').click(function(e) {
			pg.panel.deselect();
		});
		$(this.el).find("#resize_handle_panel").draggable({
			axis: "y",
			stop: function() {
				// console.log($(window).height()-$(this).offset().top);
				// console.log($(this).offset());
				$(pg.panel.el).height($(window).height()-$(this).offset().top+$(window).scrollTop());
				$(this).offset({'top':$(pg.panel.el).offset().top});
				$("#pg_spacer").height($(pg.panel.el).height());
			}
		});
		// $('body').unbind('click').on('click',':not(#pg)',function(e) {
		// 	e.stopPropagation();
		// 	pg.panel.commandUI.remove();
		// });

		// 2. drag plate to pan
	},


	


}









// function test() {
// 	pg.panel.init();
// 	pg.panel.load(sample);
// 	pg.panel.redraw();
// }
