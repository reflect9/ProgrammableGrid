pg = {
	init: function() {
		$("#pg").remove();	// delete #pg if exist
		$("<div id='pg'></div>").appendTo("body");
		this.new_script("untitled "+makeid());

		// ATTACH EVENT HANDLERS
		$(document).keydown(function (e) {
            var element = e.target.nodeName.toLowerCase();
            if ((element != 'input' && element != 'textarea') || $(e.target).attr("readonly")) {
                if (e.keyCode === 8 || e.keyCode === 46) {
                    pg.panel.delete();
                    return false;
                }
            }
		});
	},
	execute: function() {
		pg.execute_script(pg.panel.nodes);
		pg.panel.redraw();
	},


	////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////
	new_script: function(title) {
		pg.save_script(title,[
				pg.Node.create({P:pg.planner.get_prototype({type:"trigger"}), position:[0,0]})
			]);
		pg.load_script(title);
	},
	save_script : function(title, nodes_to_store) {
		try {
			var old_data = localStorage["prgr"];
			if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
			programs = pg.parse(old_data);
		} catch(e) {
			programs = {};
		}	
		programs[title] = nodes_to_store;
		new_data = pg.serialize(programs);
		localStorage.setItem("prgr",new_data);
		return programs;
	},
	load_script : function(title) {
		var programs = pg.load_all_scripts();
		if(programs && programs[title]) {
			pg.panel.init(title, programs[title]);
		} else return false;
	},
	clear_script: function() {
		pg.open_panel(pg.panel.title, []);
	},
	remove_script: function(title) {
		try {
			var old_data = localStorage["prgr"];
			if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
			programs = pg.parse(old_data);
		} catch(e) {
			programs = {};
		}	
		delete programs[title];
		new_data = pg.serialize(programs);
		localStorage.setItem("prgr",new_data);
		return programs;
	},
	load_all_scripts : function() {
		if (localStorage["prgr"]==undefined) return false;
		else {
			var data = localStorage.getItem("prgr");
			return programs = pg.parse(data);
		}	
	},
	execute_script : function(nodes) {
		console.log("START SCRIPT");
		// initialize states of the nodes


		var triggers = _.filter(nodes, function(n) {
			return n && n.P && n.P.type=='trigger';
		});
		pg.panel.run_connected_nodes(triggers);


		// var MAX_STEPS = 500;
		// var counter=0;
		// _.each(nodes, function(node) {
		// 	node.executed = False;
		// };
		// // execute nodes those are ready
		// try{
		// while(nodes.length>0 && counter<MAX_STEPS) {
		// 	// find an executable node
		// 	counter++;
		// 	var ready_nodes = _.filter(nodes, function(node) {
		// 		if(node && node.P && node.P.type=='trigger' && node.P)
		// 	});

		// 	var node_to_execute = undefined;

		// 	for(var i=0; i<nodes.length; i++) {
		// 		var n = nodes[i];
		// 		var input_still_inodes = _.filter(n.I, function(ni) { 
		// 			return nodes.indexOf(ni)!=-1; 
		// 		},this);
		// 		if (input_still_inodes.length==0 && n.P && n.P.type) {
		// 			node_to_execute = n;
		// 			break;
		// 		}
		// 	}
		// 	if(node_to_execute) {
		// 			node_to_execute = pg.planner.execute(node_to_execute);
		// 			nodes = _.without(nodes, node_to_execute);	
		// 			console.log(node_to_execute);	
		// 	}
		// }}
		// catch(e) { console.error(e.stack);}
	},
	execute_node: function(nodeObj) {
		nodeObj = pg.planner.methods
	},
	serialize: function(programs) {
		_.each(programs, function(nodes) {
			// var output = {};
			// id_counter = 0;
			_.each(nodes, function(node, index) {
				// node.ID = id_counter++;
				node.V = [];
				// output[node.ID] = node;
			});
			// _.each(nodes, function(node, index) {
			// 	if (node.I) {
			// 		if (_.isArray(node.I)) {
			// 			node.I_ID = _.map(node.I, function(n, i) {
			// 			return n.ID;
			// 			});
			// 		} else {
			// 			node.I_ID = node.I.ID;
			// 		}
			// 	} else {
			// 		node.I_ID = "";
			// 	}
			// 	node.I = null;
			// });
			// _.each(nodes, function(node, index) {
			// 	node.ID = null;
			// });
			return nodes;		
		});
		return JSON.stringify(programs);
	},
	// serialize_nodes: function(nodes) {
	// 	var output = {};
	// 	id_counter = 0;
	// 	_.each(nodes, function(node, index) {
	// 		node.ID = id_counter++;
	// 		node.V = null;
	// 		output[node.ID] = node;
	// 	});
	// 	_.each(nodes, function(node, index) {
	// 		if (node.I) {
	// 			if (_.isArray(node.I)) {
	// 				node.I_ID = _.map(node.I, function(n, i) {
	// 				return n.ID;
	// 				});
	// 			} else {
	// 				node.I_ID = node.I.ID;
	// 			}
				
	// 		} else {
	// 			node.I_ID = "";
	// 		}
	// 		node.I = null;
	// 	});
	// 	_.each(nodes, function(node, index) {
	// 		node.ID = null;
	// 	});
	// 	return JSON.stringify(nodes);	
	// },
	parse: function(data) {
		var programs = JSON.parse(data);
		// _.each(programs, function(nodes, title) {
		// 	_.each(nodes, function(node, j) {
				// if (_.isArray(node.I_ID)) {
				// 	node.I = _.map(node.I_ID, function(id, i) {
				// 		return nodes[id];
				// 	})
				// } else {
				// 	node.I = nodes[node.I_ID];
				// }
				// node.type = "Variable";
				// node.ID = j;
				// node.position=[1,j+1];
		// 	});
		// });
		return programs;
	},
	generate : function(problem_title){
		try {
			var problem_nodes = pg.problems[problem_title]();
			var plans = pg.planner.plan(problem_nodes[0],problem_nodes[1]);
			var plansWithI = _.map(plans, function(p) {
				return _.union(problem_nodes[0], p);
			},this);
			return plansWithI;
		} catch(e) {
			console.error(e.stack);
		}
	},

	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	//					UTILITY FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	open_dialog : function(content) {
		$("<div class='pg_dialog_backdrop'></div>").appendTo($("#pg"));
		var diag_el = $("<div class='pg_dialog'></div>")
		.append(content).appendTo("#pg");
		$(diag_el).offset({
			'top': $(window).height()/2 - $(diag_el).height()/2,
			'left': $(window).width()/2 - $(diag_el).width()/2
		});
		$(diag_el).find(".button_close").click(pg.close_dialog);
	},
	close_dialog : function() {
		$(".pg_dialog").remove();
		$(".pg_dialog_backdrop").remove();
	}


};








pg.backup_page = $("body").clone().get(0);


DEFAULT_PLATE_DIMENSION = 3000
DEFAULT_NODE_DIMENSION = 100
NODE_MARGIN = 1

NODE_SIZE_LOW = 50
NODE_SIZE_MID = 100
NODE_SIZE_HIGH = 200

TILE_TYPES = ['Trigger','Page','Element','Variable','Operation'];


MAX_INFERENCE_STEPS = 3;
MAX_CONTEXT_NODES = 20;


MAX_INT = 9007199254740992;
MIN_INT = -9007199254740992;

sample = [
		{
			id:'trigger_1',
			type:'trigger',
			position:[0,0],
			value:undefined,
			operation:{
				type: 'Action:Hide',
				description: 'Trigger when page is loaded.',
				I1: undefined,
				I2: undefined,
				param:''
			}
     	},
     	{	id:1,
     		type:'variable',
			position:[1,0],
			value:['a','b','c'],
			operation: {
				type: 'Transform:Map:StringExpr:JoinSingleArgBackward',
				description : 'desc',
				I1: 'top',
				I2: undefined,
				param:''
			}
     	},
     	{
			id:2,
			type:'element',
			position:[1,1],
			value:['abc'],
			operation: {
				type: 'Select:Attribute',
				description : 'desc',
				I1: 'left',
				I2: undefined,
				param:''
			}
     	}
];
