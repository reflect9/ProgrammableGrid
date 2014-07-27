pg.Enhancement = function(_title, _nodes) {
	this.id = makeid();
	this.title = (_title)? _title: "Tandem-"+this.id;
	this.description = "description";
	if(_nodes && isArray(_nodes) && _nodes.length>0) this.nodes = _nodes;
	else {
		var default_trigger_node = pg.Node.create({type:'trigger', P:pg.planner.get_prototype({type:"trigger"}), position:[0,1]});
		default_trigger_node.P.param.event_source = "page";
		this.nodes = [default_trigger_node];
		this.title = _title || "Tandem-"+makeid();
	}
	
};
pg.Enhancement.prototype.delete = function(node_to_delete) {
	this.nodes = _.without(this.nodes, node_to_delete);
};
pg.Enhancement.prototype.clear = function() {
	this.nodes = [];
};
pg.Enhancement.prototype.load_json = function(json){
	this.nodes = _.map(json.nodes, function(n_data,ni){
		var newNode = new Node(); 
		newNode.load(n_data);
		return newNode;
	});
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Editing methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////

pg.Enhancement.prototype.insert = function(new_nodes, target_node) {
	// replace target_node with nodes and push nodes on the right side to right
	var target_position, nodes_range;
	nodes_range = get_nodes_range(new_nodes);
	if(target_node) {
		target_position = target_node.position;
		this.delete(target_node);
		if(new_nodes.length>1) {
			// push nodes right or below
			_.each(this.get_nodes(), function(node) {
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
		var max_y = _.max(this.get_nodes(), function(n){ return n.position[0];}).position[0]+1;
		target_position = [max_y,1];
	}
	for(var ni=0; ni<new_nodes.length;ni++) {
		var nd = new_nodes[ni]; 	
		if(typeof nd.position !== 'undefined') {
			nd.position=[target_position[0]+nd.position[0]-nodes_range.min_y, target_position[1]+nd.position[1]-nodes_range.min_x]; 	
		} else {
			nd.position=[target_position[0], target_position[1]+ni]; 	
		}
		this.get_nodes().push(nd);
	}
	_.each(new_nodes, function(nd) {
		nd.I = _.map(nd.I, function(input_id) {	// replace nd.I with <left> if the left node is the input node.
			if(input_id === "_pageLoad") {
				var trigger_page_load = _.filter(this.get_nodes(), function(n) {
					return n.P && n.P.type=='trigger' && n.P.param && n.P.param.event_source==="page";
				});
				if(trigger_page_load.length>0) return trigger_page_load[0].ID;
			}
			if(input_id === this.get_node_by_id("_left",nd)) return "_left";
			else if(input_id === this.get_node_by_id("_above",nd)) return "_above";
			else if(input_id === this.get_node_by_id("_right",nd)) return "_right";
			else if(input_id === this.get_node_by_id("_below",nd)) return "_below";
			else return input_id;
		}, this);
	},this);
};
pg.Enhancement.prototype.push_at = function(new_node, target_position) {
	var candDiff = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
	for(var i in candDiff) {
		var newPos = [new_node.position[0]+candDiff[i][0],new_node.position[1]+candDiff[i][1]];
		if(pg.panel.enhancement.get_node_by_position(newPos)==false) {
			new_node.position = newPos;
			pg.panel.get_nodes().push(new_node);
			pg.panel.redraw();
			return;
		}
	}
};
pg.Enhancement.prototype.insert_column = function(col_num) {
	_.each(this.get_nodes(), function(n){
		if(n.position[1]>=col_num) n.position[1]+=1;
	});
};
pg.Enhancement.prototype.insert_row = function(row_num) {
	_.each(this.get_nodes(), function(n){
		if(n.position[0]>=row_num) n.position[0]+=1;
	});
};
pg.Enhancement.prototype.delete_column = function(col_num) {
	 this.set_nodes(_.filter(pg.panel.get_nodes(), function(n) {
		return n.position[1]!= col_num;
	}));
	_.each(this.get_nodes(), function(n){
		if(n.position[1]>=col_num) n.position[1]-=1;
	});
};
pg.Enhancement.prototype.delete_row = function(row_num) {
	 this.set_nodes(_.filter(pg.panel.get_nodes(), function(n) {
		return n.position[0]!= row_num;
	}));
	_.each(this.get_nodes(), function(n){
		if(n.position[0]>=row_num) n.position[0]-=1;
	});
};

pg.Enhancement.prototype.serialize = function() {
	return _.map(this.get_nodes(), function(n){
		return pg.Node.serialize(n);
	});
};

///////////////////////////////////////////////////////////////////
///  Node getters
///////////////////////////////////////////////////////////////////
pg.Enhancement.prototype.get_selected_nodes = function() {


};

pg.Enhancement.prototype.get_nodes = function() {
	return this.nodes;
};


pg.Enhancement.prototype.get_adjacent_node = function(direction, node, _allNodes) {
	var allNodes = (_allNodes)?_allNodes: this.get_nodes();
	if(!direction || !node) return false;
	if(direction=="_left") return this.get_node_by_position([node.position[0], node.position[1]-1], allNodes);			
	if(direction=="_right") return this.get_node_by_position([node.position[0], node.position[1]+1], allNodes);			
	if(direction=="_above") return this.get_node_by_position([node.position[0]-1, node.position[1]], allNodes);			
	if(direction=="_below") return this.get_node_by_position([node.position[0]+1, node.position[1]], allNodes);							
	return false;
};

pg.Enhancement.prototype.get_node_by_id = function(node_id, ref_node, _allNodes) {
	var allNodes = (_allNodes)?_allNodes: this.get_nodes();

	if(node_id.substring(0,5) == '_left' && ref_node) {
		var new_node_id = node_id.substring(5); var old_node_id = node_id.substring(0,5);
		if(new_node_id.length>0) return this.get_adjacent_node("_left", this.get_node_by_id(new_node_id,ref_node), allNodes);
		else return this.get_adjacent_node("_left", ref_node, allNodes);	
	} else if(node_id.substring(0,6) == '_above' && ref_node)  {
		var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
		if(new_node_id.length>0) return this.get_adjacent_node("_above", this.get_node_by_id(new_node_id,ref_node), allNodes);
		else return this.get_adjacent_node("_above", ref_node, allNodes);	
	} else if(node_id.substring(0,6) == '_right' && ref_node)  {
		var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
		if(new_node_id.length>0) return this.get_adjacent_node("_right", this.get_node_by_id(new_node_id,ref_node), allNodes);
		else return this.get_adjacent_node("_right", ref_node, allNodes);	
	} else if(node_id.substring(0,6) == '_below' && ref_node)  {
		var new_node_id = node_id.substring(6); var old_node_id = node_id.substring(0,6);
		if(new_node_id.length>0) return this.get_adjacent_node("_below", this.get_node_by_id(new_node_id,ref_node), allNodes);
		else return this.get_adjacent_node("_below", ref_node, allNodes);	
	}
	//
	for(var i in allNodes) {
		if (allNodes[i].ID == node_id) return allNodes[i];
	}	return false;
};
pg.Enhancement.prototype.get_node_by_position = function(position, _allNodes) {
	var allNodes = (_allNodes)?_allNodes: this.get_nodes();
	for(var i in allNodes) {
		if (allNodes[i].position[0] == position[0] && allNodes[i].position[1] == position[1]) return allNodes[i];
	}	return false;
};	
pg.Enhancement.prototype.get_next_nodes = function(node, _reachableNodes, _allNodes) {
	// find next node among _reachableNodes.  _allNodes is the entire set of nodes
	var allNodes = (_allNodes)?_allNodes: this.get_nodes();
	var reachableNodes = (_reachableNodes)?_reachableNodes: allNodes;
	var nextNodes = [];
	for(var i=0;i<reachableNodes.length;i++) {
		if(this.get_prev_nodes(reachableNodes[i], allNodes).indexOf(node)!=-1) nextNodes.push(reachableNodes[i]);
	}
	return nextNodes;
};
pg.Enhancement.prototype.get_reachable_nodes = function(_starting_nodes, _allNodes, _include_triggers) {
	var allNodes = (_allNodes)? _.clone(_allNodes): _.clone(this.get_nodes());
	var remaining_nodes = _.clone(allNodes);
	var reachable_nodes = [];
	var queue = _.clone(_starting_nodes);
	while(queue.length>0 && remaining_nodes.length>0 ) {
		var n = queue.pop();
		reachable_nodes =  _.union(reachable_nodes, n);
		if (!_include_triggers && n.P && n.P.type=="trigger") {  }
		else {
			var new_reachable_nodes = this.get_next_nodes(n,remaining_nodes,allNodes);
			if(new_reachable_nodes.length>0) {
				queue = _.union(queue, new_reachable_nodes);
				remaining_nodes = _.difference(remaining_nodes, new_reachable_nodes);
			}
		}
	}
	//console.log("reachable nodes : "+this.print(reachable_nodes));
	return reachable_nodes;
};
pg.Enhancement.prototype.get_informative_nodes = function(nodes) {
	var all_prev_nodes = _.union(_.flatten(_.map(nodes, function(n) {
		return this.get_prev_nodes(n, this.get_nodes());
	})));
	var informative_nodes = _.difference(all_prev_nodes,nodes);
	return informative_nodes;
};
pg.Enhancement.prototype.get_prev_nodes = function(node, _allNodes) {	
	var allNodes = (_allNodes)?_allNodes: this.get_nodes();
	var prevNodes = [];
	for(var i=0;i<node.I.length;i++) {
		prevNodes.push(this.get_node_by_id(node.I[i], node, allNodes));
	}
	prevNodes = _.without(prevNodes, false, undefined);
	return prevNodes;
};
pg.Enhancement.prototype.get_ready_nodes = function(_candidateNodes, _allNodes) {
	var allNodes = (_allNodes)?_allNodes: this.get_nodes();
	var candidateNodes = (_candidateNodes)? _candidateNodes: allNodes;
	var ready_nodes = _.filter(candidateNodes, function(n) {
		if(n.executed) return false;
		var prev_nodes = this.get_prev_nodes(n, allNodes);
		if (	prev_nodes.length>0 &&
				_.filter(prev_nodes, function(n) { return n.executed==false; }).length==0 ) 
			return true;
		else return false;	
	},this);
	return ready_nodes;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//  executions methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////
pg.Enhancement.prototype.execute = function() {
	var nodes = this.get_nodes();
	var page_triggers = _.filter(nodes, function(node) {
		return 	node.P && node.P.param && node.P.type=='trigger' && 
				node.P.param.event_source=="page"; 
	});
	var triggered_nodes = _.uniq(_.flatten(_.map(page_triggers, function(t){ return this.get_next_nodes(t); })));
	_.each(nodes, function(n) { n.executed=false; n.V=[]; });
	this.run_triggered_nodes(triggered_nodes, false, false);
};
pg.Enhancement.prototype.run_node = function(nodeObj, skip_redraw) {
	if(nodeObj.P && nodeObj.P.type!="trigger") nodeObj.executed = true;
	if(!nodeObj) return false;
	if(!nodeObj.P) return false;
	pg.planner.execute(nodeObj);
	// if(skip_redraw){  }
	// else pg.panel.redraw();
};
pg.Enhancement.prototype.run_triggered_nodes = function(starting_nodes, _nodes, skip_redraw) {
	var nodes = (_nodes)? _.clone(_nodes): _.clone(this.get_nodes());
	var nodesToExecute = this.get_reachable_nodes(starting_nodes, nodes, true); // including starting nodes
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
		this.run_node(n, true);
		executed = _.union(executed, n);
		//console.log("run : "+pg.panel.print([n]));
		// nodes = _.difference(nodes, queue);
		var nodes_ready = this.get_ready_nodes(nodesToExecute, nodes);
		var nodes_ready_not_yet_run = _.difference(nodes_ready, executed);
		queue = _.union(queue, nodes_ready_not_yet_run);
		//console.log("queue : "+pg.panel.print(queue));
		//console.log("nodes : "+pg.panel.print(nodes));
		//console.log("---");
		count++;
	}
	// pg.panel.redraw();
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

pg.Enhancement.prototype.print = function(nodes) {
	var str = "";
	try{
		_.each(nodes, function(n) {
			if(n.P) { str += n.P.type + "["+n.position[0]+","+n.position[1]+"]("+n.executed+"), "; }
		});
		return str;	
	} catch(e) { console.error(e.stack); }
};

pg.Enhancement.prototype.set_nodes = function(_nodes) {
	this.nodes = _nodes;
};
