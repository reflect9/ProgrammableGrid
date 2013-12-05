
pg.plate = {
	init: function(){
		this.nodes = [];
		this.offset = [0,0];
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  control methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	zoom: function(scale) {

	},
	pan: function(loc) {

	},
	p2c: function(position) {
		// convert position to coordinate on plate element
		return [position[0]*this.node_dimension - this.offset[0], 
				position[1]*this.node_dimension - this.offset[1]];
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
	infer: function(out_node) {
		// context_nodes <- adjacent nodes + remotely-connected nodes
		// candidate_graphs <- [graph1, graph2, ... ]
		// 

	},
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  view methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	redraw: function() {
		$("#tiles").empty();
		this.drawPlate();
		// draw nodes based on current module
		_.each(this.nodes, function(n,ni){
			NodeView.draw(n,this.node_dimension);
		},this);
		this.attachEventListeners();

	},
	drawPlate: function() {
		$("#plate").empty();
		var canvas = $("<canvas id='plate_canvas' width='3000' height='3000'></canvas>");
		$("#plate").append(canvas);
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

	toggleNode: function(node) {
		if(node.selected == true) node.selected = false;
		else node.selected = true;
		NodeView.draw(node,this.node_dimension);
	},
	highlightNodes: function(nodes) {
		// select a set of nodes for further actions
		_.each(nodes, function(n,ni){
			n.selected =true;
			NodeView.draw(n,this.node_dimension);
		},this);
	},
	unhighlightNodes: function() {
		_.each(plate.nodes, function(n,ni){
			n.selected =false;
			NodeView.draw(n,this.node_dimension);
		},this);
	},
	attachEventListeners: function() {
		$(".node")
			.draggable({ 	grid: [ this.node_dimension, this.node_dimension]})
			.click(function(e) {
				if($(this).is('.ui-draggable-dragging')){
					return;
				}
				console.log("Click: "+$(e.target).attr("id"));
				plate.toggleNode($(e.target).attr("id"));
			});
	}


}

// function test() {
// 	pg.plate.init();
// 	pg.plate.load(sample);
// 	pg.plate.redraw();
// }
