




pg.panel = {
	init: function(target_el){
		this.el = target_el;
		this.title = "untitled";
		$('#pg').append(this.editUI.create());
		this.commandUI.create();
		$('#pg_edit_ui').draggable();
		$(this.el).append("<div id='resize_handle_panel'></div>");
		this.el_container = $("<div id='plate_container'></div>").appendTo(this.el);
		this.el_tiles = $("<div id='tiles'></div>").appendTo(this.el_container);
		this.el_plate = $("<div id='plate'></div>").appendTo(this.el_container); 
		$(this.el).append(this.toolbar.create());
		this.nodes = [];
		this.commands = [];
		this.selected_elements = [];
		this.node_dimension = DEFAULT_NODE_DIMENSION;
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
		$(this.el_container).animate({scrollTop: loc[0], scrollLeft: loc[1]}, 600);
	},
	p2c: function(position) {
		// convert position to coordinate on plate element
		return [position[0]*this.node_dimension, 
				position[1]*this.node_dimension];
		// return [position[0]*this.node_dimension - this.offset[0], 
		// 		position[1]*this.node_dimension - this.offset[1]];
	},
	deselect: function() {
		$("#tiles .node").removeAttr("selected");
		pg.panel.commandUI.close();
	},
	select: function(node) {
		// if(!_.isArray(node)) node = [node];
		if (node && !_.isElement(node)) {
			node = $("#"+node.ID).get(0);
		}
		var nodeObj = this.get_node_by_id($(node).attr("id"));
		var prev_selected = $(node).attr("selected")!==undefined; 
		$("#tiles .node").removeAttr("selected");
		_.each(pg.panel.nodes, function(n){n.selected=false;});
		if(!prev_selected) {
			$(node).attr("selected",true);
			nodeObj.selected = true;
			pg.panel.commandUI.find_command(nodeObj); 
		} else{
			pg.panel.commandUI.close();
		}
		
	},
	delete: function(target_nodeObj) {
		pg.inspector.unhighlight_list();
		if(!target_nodeObj) target_nodeObj = pg.panel.get_selected_nodes()[0];
		pg.panel.nodes = _.without(pg.panel.nodes, target_nodeObj);
		pg.panel.commandUI.close();
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
		this.delete(target_node);
		for(var ni=0; ni<this.nodes.length;ni++) {
			var n = this.nodes[ni];
			if(n.position[0] == target_position[0] && n.position[1]>target_position[1]) {
				// if the node is on the right side of the target node, then push it as the legnth of new nodes
				n.position[1]+= new_nodes.length-1;
			}
		}
		// place new_nodes
		for(var ni=0; ni<new_nodes.length;ni++) {
			var nd = new_nodes[ni]; 	
			nd.position=[target_position[0], target_position[1]+ni];
			pg.panel.nodes.push(nd);
		}
		
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
	get_node_by_id: function(node_id) {
		for(var i in this.nodes) {
			if (this.nodes[i].ID == node_id) return this.nodes[i];
		}	return false;
	},
	get_node_by_position: function(position) {
		for(var i in this.nodes) {
			if (this.nodes[i].position[0] == position[0] && this.nodes[i].position[1] == position[1]) return this.nodes[i];
		}	return false;
	},	
	el_to_obj:function(el) {
		return pg.panel.get_node_by_id($(el).prop('id'));
	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  executions methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	run: function(nodeObj, triggerNext) {
		if(!nodeObj) return false;
		if(!nodeObj.P) return false;
		if(pg.planner.operations )

		if(triggerNext) {
			// run following (right/bottom) nodes
		}
		// node_queue <- all the descendant nodes connected to start_node 
		// choose a node in node_queue whose inputs are not in node_queue
		// 		evaluate the operation of the node, and update value
		// 		repeat until there's no node in node_queue 
	},
	infer: function(output_node) {
		if(_.isElement(output_node)) {
			output_node = pg.panel.get_node_by_id($(output_node).attr("id"));
		}
		var I = pg.panel.get_left_node(output_node);
		var O = output_node;
		var solutions = pg.planner.plan(I,O);
		this.commandUI.update(solutions);
		console.log(solutions);
		if(!solutions || solutions==[]) alert("no solution found");
		return solutions;
	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  view methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	redraw: function() {
		$(this.el_tiles).empty();
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
		$(this.el_plate).children().remove();
		var canvas = $("<canvas id='plate_canvas' width='3000' height='3000'></canvas>");
		$(this.el_plate).append(canvas);
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
					<button class='select_button'>Select</button>\
					<button class='load_page_button'>Current Page</button>\
					<button class='snapshot_button'>Page Snapshot</button>\
				</div>\
				<div id='inspector_all_sel'>\
					<div class='label_selected_elements'>no selection</div>\
					<div class='table_inspector'>\
						<ul></ul>\
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
				if(pg.inspector.flag_inspect) {
					pg.inspector.off();
					pg.panel.selected_elements=[];
					$(event.target).removeClass("selected");
					var attr_table_el = $("#pg_edit_ui").find(".table_inspector").find("ul");
					pg.panel.editUI.updateInspector(pg.panel.selected_elements, $(attr_table_el).get(0));
				} else {
					$(event.target).addClass("selected");
					pg.inspector.on(pg.panel.editUI.select_element);	
				}
			});
			$(ui_el).find(".load_page_button").click(function() {
				var currently_selected_nodes = _.filter(pg.panel.nodes, function(n) { return n.selected==true; });
				if(currently_selected_nodes.length>0) {
					var n = currently_selected_nodes[0];
					n.V = $("body").toArray();
					n.P = {"type":"loadPage","param":""};
				} else {
					console.log("no node is selected now.");
				}
				pg.panel.redraw();
			});
			$(ui_el).find(".snapshot_button").click(function() {
				var currently_selected_nodes = _.filter(pg.panel.nodes, function(n) { return n.selected==true; });
				if(currently_selected_nodes.length>0) {
					var n = currently_selected_nodes[0];
					var body = $("body").clone();
					$(body).find("#pg_panel").remove();
					$(body).find("#pg_edit_ui").remove();
					$(body).find("#pg_command_ui").remove();
					n.V = $(body).toArray();
				} else {
					console.log("no node is selected now.");
				}
				pg.panel.redraw();
			});


			return ui_el;
		},
		select_element: function(el) {
			if(!(el in pg.panel.selected_elements)) 
				pg.panel.selected_elements.push(el);
			var attr_table_el = $("#pg_edit_ui").find(".table_inspector").find("ul");
			pg.panel.editUI.updateInspector(pg.panel.selected_elements, $(attr_table_el).get(0));
		},
		deselect_elements: function() {
			pg.panel.selected_elements = [];
			$("#pg_edit_ui").find(".table_inspector").find("ul").empty();
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
				$(target_ul).append("<button>Extract above elements</button>").click(function() {
					pg.panel.editUI.extract_selected_elements(pg.panel.selected_elements);
				});
			} else { // when nothing is selected
				$(num_label).text("Nothing selected.");
			}
			
			// 
			// get all the property keys of els 

		}
	},
	commandUI: {
		create: function() {
			var c_container = $("#pg_command_ui");
			if(c_container.length==0) {
				var ui_el = $("<div id='pg_command_ui' title='commands'>\
					<div>Available Operations</div>\
					<div id='command_container'>\
					</div>\
					<div id='node_info'>\
					</div>\
					<div id='command_info'>\
					</div>\
					<div id='node_tools'><hr>\
					</div>\
					</div>");
				$("<button>Execute operation</button>").click(function(e){pg.panel.run(pg.panel.el_to_obj(e.target));}).appendTo($(ui_el).find("#node_tools"));
				$("<button>Delete node</button>").click(function(e){pg.panel.delete(pg.panel.el_to_obj(e.target));}).appendTo($(ui_el).find("#node_tools"));
				$("<button>Clear operation</button>").click(function(e){pg.panel.clear(pg.panel.el_to_obj(e.target));}).appendTo($(ui_el).find("#node_tools"));
				$("<button>Empty data</button>").click(function(e){pg.panel.empty(pg.panel.el_to_obj(e.target));}).appendTo($(ui_el).find("#node_tools"));
				$("<button>Edit data</button>").click(function(e){pg.panel.edit_data();}).appendTo($(ui_el).find("#node_tools"));				
				$('#pg').append(ui_el);	
			}
		},
		open: function() {
			this.create();
			if(!$("#pg_command_ui").is(":visible")) {
				$("#pg_command_ui").show();	
			}
		},
		close: function() {
			$("#pg_command_ui").hide();
			pg.panel.commands=[];
		},
		update: function(commands, focused_node) {
			this.open();

			// update node info (id, input) 
			var node_info_el = $("#pg_command_ui > #node_info").empty();
			$("<label>id:</label><input type='text' name='node_id' value='"+focused_node.ID+"'>").appendTo(node_info_el);
			$("<label>input:</label><input type='text' name='node_input' value='"+focused_node.I+"'>").appendTo(node_info_el);			

			// update command info
			pg.panel.commands = commands;
			$("#command_container").empty();
			var command_info = $("#pg_command_ui > #command_info").empty();
			_.each(commands, function(c,ci) {
				var commandButton = this.makeCommandEl(c);
				if(focused_node && focused_node.P && focused_node.P.type==c.type) {
					// if the command is curreltly selected
					$(commandButton).attr('selected',true);
				}
				$("#command_container").append(commandButton);
			},this);

			// SHOW COMMAND DETAIL HERE
			if(focused_node) {
				if(focused_node.P) {
					$(command_info).append("<div>"+focused_node.P.type+":  "+focused_node.P.description+"</div>");
					var param_ul = $("<ul></ul>").appendTo(command_info);
					_.each(focused_node.P.param, function(value, key) {
						var li = $("<li><span>"+key+"</span>:</li>");
						var param_input = $("<input type='text' name='"+key+"' value='"+value+"'>").
							change(function() {  // when user updates the parameter value
								var paramKey = $(this).attr('name');
								var newParamValue = $(this).val();
								(pg.panel.get_selected_nodes()[0]).P.param[paramKey]=newParamValue;
								// (TBD) update the commandUI automatically here.
							}).appendTo(li);
						$(li).appendTo(param_ul);
					});	
				} else {
					$(command_info).append("<div>No command selected.</div>");
				}
			} 

			// var selected_node_offset = $(pg.panel.get_selected_nodes()[0]).position();
			// var command_bottom = 0;
			// var command_left = selected_node_offset.left - 20;
			// $("#pg_command_ui").css({
			// 	bottom: command_bottom+"px",
			// 	left: command_left+"px"
			// });
		},
		find_command: function(focused_node) {
			if(!focused_node) return;
			var Is = [];
			if(pg.panel.get_left_node(focused_node)) Is.push(pg.panel.get_left_node(focused_node));
			if(pg.panel.get_above_node(focused_node)) Is.push(pg.panel.get_above_node(focused_node));
			var commands = pg.planner.find_applicable_operations(Is);
			if(_.isArray(commands) && commands.length>0) {
				pg.panel.commandUI.update(commands, focused_node);
			}


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
				&nbsp;&nbsp;&nbsp;Edit node: \
				<span id='edit_button_group'> \
					<button class='delete_button' id='delete_node'>delete</button>\
				</span>\
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
					pg.open_panel(title, pg.load_script(title));
				});
			});
			$(ui_el.find("#button_remove")).click(function() {
				pg.remove_script(pg.panel.title);
				var programs = pg.load_all_scripts();
				for(var k in programs) {
					pg.open_panel(k, programs[k]);
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
			return ui_el;
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
				console.log($(this).attr('id') + " is clicked");
				console.log(pg.panel.get_node_by_id($(this).attr('id')));
				pg.panel.select(this);
				e.stopPropagation();
				// console.log("Click: "+$(e.target).attr("id"));
				// plate.toggleNode($(e.target).attr("id"));
			});
		// now attach event handlers
		// 1. create a new tile when empty plate is clicked
		$(this.el_tiles).off('dblclick').dblclick(function(e) {
			var mouse_coord = {left: e.pageX - $(this).offset().left,
								top: e.pageY - $(this).offset().top};
			var mouse_pos = {left: Math.floor(mouse_coord.left/pg.panel.node_dimension), 
							top: Math.floor(mouse_coord.top/pg.panel.node_dimension)};
			e.stopPropagation();
			console.log("plate clicked "+ mouse_pos.left + "," +mouse_pos.top);
			var new_node = pg.Node.emptyNode();
			new_node.position = [mouse_pos.top, mouse_pos.left];
			pg.panel.nodes.push(new_node);
			pg.panel.redraw();
			pg.panel.select(new_node);

		});
		$(this.el_tiles).off('click').click(function(e) {
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
		// 2. drag plate to pan
	},


	


}









// function test() {
// 	pg.panel.init();
// 	pg.panel.load(sample);
// 	pg.panel.redraw();
// }
