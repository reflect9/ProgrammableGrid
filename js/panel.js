




pg.panel = {
	init: function(target_el){
		this.el = target_el;
		$('body').append(this.createEditUI());
		$(this.el).append(this.createControlUI());
		this.el_container = $("<div id='plate_container'></div>").appendTo(this.el);
		this.el_tiles = $("<div id='tiles'></div>").appendTo(this.el_container);
		this.el_plate = $("<div id='plate'></div>").appendTo(this.el_container); 
		this.nodes = [];
		// this.offset = [0,0];
		// this.detail_level = DEFAULT_DETAIL;
		this.node_dimension = DEFAULT_NODE_DIMENSION;
	},
	load_json: function(json){
		this.nodes = _.map(json.nodes, function(n_data,ni){
			var newNode = new Node(); 
			newNode.load(n_data);
			return newNode;
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
	select: function(node) {
		// if(!_.isArray(node)) node = [node];
		var prev_selected = $(node).attr("selected")!==undefined; 
		$("#tiles .node").removeAttr("selected");
		_.each(pg.panel.nodes, function(n){n.selected=false;});
		if(!prev_selected) {
			$(node).attr("selected",true);
			this.get_node_by_id($(node).attr("id")).selected = true;
		}
	},
	delete: function(target) {
		if(target=="selected_node") {
			pg.panel.nodes = _.filter(pg.panel.nodes, function(n) { return n.selected!==true;});
		}
	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  executions methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	run: function(start_node) {
		// node_queue <- all the descendant nodes connected to start_node 
		// choose a node in node_queue whose inputs are not in node_queue
		// 		evaluate the operation of the node, and update value
		// 		repeat until there's no node in node_queue 
	},
	infer: function(empty_node) {
		if(_.isElement(empty_node)) {
			empty_node = pg.panel.get_node_by_id($(empty_node).attr("id"));
		}
		var I = this.get_node_by_position([empty_node.position[0], empty_node.position[1]-1]);
		var O = this.get_node_by_position([empty_node.position[0],empty_node.position[1]+1]);
		var solutions = pg.planner.plan(I,O);
		console.log(solutions);
	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  view methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	redraw: function() {
		$(this.el_tiles).empty();
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
	createEditUI: function() {
		var ui_el = $("\
				<div id='edit_ui'>\
					<div>\
						<button class='page_editable_button'>Make Page Editable</button>\
						<button class='selected_element_button'>Select Elements</button>\
						<button class='hide_button'>Hide Elements</button>\
					</div>\
					<div>\
						<button class='snapshot_button'>Page Snapshot</button>\
					</div>\
				</div>\
				");
		$(ui_el).find(".selected_element_button").click(function() {
			if(pg.inspector.flag_inspect) {
				pg.inspector.off();
			} else {
				pg.inspector.on(function(e) {
					// add selected elements to the V of the current node
					var currently_selected_nodes = _.filter(pg.panel.nodes, function(n) { return n.selected==true; });
					if(currently_selected_nodes.length>0) {
						var n = currently_selected_nodes[0];
						if(n.V==undefined) n.V=[];
						n.V.push(e);
					} else {
						console.log("no node is selected now.");
					}
					pg.panel.redraw();
				});	
			}
		});
		$(ui_el).find(".page_editable_button").click(function() {
			if($("body").attr('contenteditable')) $("body").attr('contenteditable','false');
			else $("body").attr('contenteditable',"true");
		});
		$(ui_el).find(".hide_button").click(function() {
			if(pg.inspector.flag_inspect) {
				pg.inspector.off();
			} else {
				pg.inspector.on(function(e) {
					$(e).css("display","none");
				});	
			}
			
		});
		$(ui_el).find(".snapshot_button").click(function() {
			var currently_selected_nodes = _.filter(pg.panel.nodes, function(n) { return n.selected==true; });
			if(currently_selected_nodes.length>0) {
				var n = currently_selected_nodes[0];
				var body = $("body").clone();
				$(body).find("#pg_panel").remove();
				$(body).find("#edit_ui").remove();
				n.V = $(body).toArray();
			} else {
				console.log("no node is selected now.");
			}
			pg.panel.redraw();
		});


		return ui_el;
	},
	createControlUI: function() {
		var ui_el = $("<div id='control_ui'>		\
			<div class='resize_handle'></div> \
			<select id='script_selector'>	<option selected disabled>Load script</option>\
											<option>new script</option>\
			</select>	\
			<button id='button_execute'>execute</button>\
			&nbsp;&nbsp;&nbsp;ZOOM: \
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
		_.each(pg.load_all_scripts(), function(script,title) {
			var option = $("<option></option")
				.attr('value',title)
				.text(title).appendTo($(ui_el).find("#script_selector"));
		},this);
		$(ui_el).find("#script_selector").change(function() {
			$("#script_selector option:selected").each(function() {
				pg.open_panel(pg.load_script($(this).attr('value')));
			});
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
		$(ui_el).find(".resize_handle").css({
			'position' : 'absolute',
			'z-index':10000,
			'top': '0px',
			'left': '0px',
			'width': '100%',
			'height': '4px',
			'cursor': 'pointer',
			'background-color': '#ddd',
			
		}).draggable({
			axis: "y",
			stop: function() {
				// console.log($(window).height()-$(this).offset().top);
				// console.log($(this).offset());
				$(pg.panel.el).height($(window).height()-$(this).offset().top);
				$(this).offset({'top':$(pg.panel.el).offset().top});
			}
		});
		// $(ui_el).find('#node_size_slider').slider( {
		// 	max: 299, min: 50,
		// 	slide: function(event, ui) {
		// 		// if(plate.module==undefined) { 
		// 		// 	plate.init();
		// 		// 	plate.load(sample);
		// 		// }
		// 		pg.panel.node_dimension = ui.value;
		// 		pg.panel.redraw();
		// 	}
		// });
		return ui_el;
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
						var existing_node = pg.panel.get_node_by_position(position);
						if(existing_node) pg.panel.delete(existing_node);
						node.position = position;
					}
					pg.panel.redraw();
				}
			})
			.dblclick(function(e) {
				console.log($(this).attr('id') + " is double clicked");
				var clicked_node = pg.panel.get_node_by_id($(this).attr("id"));
				pg.panel.zoom([clicked_node]);
				e.stopPropagation();
			})
			.click(function(e) {
				if($(this).is('.ui-draggable-dragging')){
					return;
				}
				console.log($(this).attr('id') + " is clicked");
				pg.panel.select(this);
				e.stopPropagation();
				// console.log("Click: "+$(e.target).attr("id"));
				// plate.toggleNode($(e.target).attr("id"));
			});
		// now attach event handlers
		// 1. create a new tile when empty plate is clicked
		$(this.el_tiles).off('click').click(function(e) {
			var mouse_coord = {left: e.pageX - $(this).offset().left,
								top: e.pageY - $(this).offset().top};
			var mouse_pos = {left: Math.floor(mouse_coord.left/pg.panel.node_dimension), 
							top: Math.floor(mouse_coord.top/pg.panel.node_dimension)};
			console.log("plate clicked "+ mouse_pos.left + "," +mouse_pos.top);
			var new_node = pg.Node.emptyNode();
			new_node.position = [mouse_pos.top, mouse_pos.left];
			pg.panel.nodes.push(new_node);
			pg.panel.redraw();
		});
		// 2. drag plate to pan
	},


	


}









// function test() {
// 	pg.panel.init();
// 	pg.panel.load(sample);
// 	pg.panel.redraw();
// }
