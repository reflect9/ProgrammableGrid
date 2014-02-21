pg = {
	init: function() {
		console.log("open pg");
		this.open_panel("untitled",[]);

		// basic event handler
		$(document).keydown(function (e) {
            var element = e.target.nodeName.toLowerCase();
            if ((element != 'input' && element != 'textarea') || $(e.target).attr("readonly")) {
                if (e.keyCode === 8 || e.keyCode === 46) {
                    pg.panel.delete("selected_node");
                    pg.panel.redraw();
                    return false;
                }
            }
		});
	},
	open_panel : function(title, nodes) {
		$("#pg_panel").remove();
		var el_panel = $("<div id='pg_panel' class='panel'></div>").appendTo($("body"));
		$("<div id='pg_spacer'></div>").css({
			'display':'block',
			'position':'relative',
			'clear':'both',
			'width':'100%'
		}).appendTo($("body"));
		$("#pg_spacer").height($(el_panel).height());
		pg.panel.init(el_panel.get(0));
		if (nodes) {
			pg.panel.nodes = nodes;
			pg.panel.title= title;
		}
		pg.panel.redraw();
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
				{ I: undefined, ID:0, I_ID:"", V:[], P:{type:"loadPage",param:""}, position:[0,0], selected:false, type:"Variable" }
			]);
		pg.panel.title= title;
		pg.open_panel(title, pg.load_script(title));
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
			return programs[title];
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
		var n_queue = nodes;
		var n_executed = [];
		var counter=0;
		// execute nodes those are ready
		try{
		while(n_queue.length>0 && counter<100) {
			// find an executable node
			counter++;
			var node_to_execute = undefined;
			for(var i=0; i<n_queue.length; i++) {
				var n = n_queue[i];
				var input_still_in_queue = _.filter(n.I, function(ni) { 
					return n_queue.indexOf(ni)!=-1; 
				},this);
				if (input_still_in_queue.length==0 && n.P && n.P.type) {
					node_to_execute = n;
					break;
				}
			}
			if(node_to_execute) {
					node_to_execute = pg.planner.methods[n.P.type].execute(node_to_execute);
					n_queue = _.without(n_queue, node_to_execute);	
					console.log(node_to_execute);	
			}
		}}
		catch(e) { console.error(e.stack);}
		console.log("DONE EXECUTING SCRIPT");
	},	
	serialize: function(programs) {
		_.each(programs, function(nodes) {
			var output = {};
			id_counter = 0;
			_.each(nodes, function(node, index) {
				node.ID = id_counter++;
				node.V = null;
				output[node.ID] = node;
			});
			_.each(nodes, function(node, index) {
				if (node.I) {
					if (_.isArray(node.I)) {
						node.I_ID = _.map(node.I, function(n, i) {
						return n.ID;
						});
					} else {
						node.I_ID = node.I.ID;
					}
				} else {
					node.I_ID = "";
				}
				node.I = null;
			});
			_.each(nodes, function(node, index) {
				node.ID = null;
			});
			return nodes;		
		});
		return JSON.stringify(programs);
	},
	serialize_nodes: function(nodes) {
		var output = {};
		id_counter = 0;
		_.each(nodes, function(node, index) {
			node.ID = id_counter++;
			node.V = null;
			output[node.ID] = node;
		});
		_.each(nodes, function(node, index) {
			if (node.I) {
				if (_.isArray(node.I)) {
					node.I_ID = _.map(node.I, function(n, i) {
					return n.ID;
					});
				} else {
					node.I_ID = node.I.ID;
				}
				
			} else {
				node.I_ID = "";
			}
			node.I = null;
		});
		_.each(nodes, function(node, index) {
			node.ID = null;
		});
		return JSON.stringify(nodes);	
	},
	parse: function(data) {
		var programs = JSON.parse(data);
		_.each(programs, function(nodes, title) {
			_.each(nodes, function(node, j) {
				if (_.isArray(node.I_ID)) {
					node.I = _.map(node.I_ID, function(id, i) {
						return nodes[id];
					})
				} else {
					node.I = nodes[node.I_ID];
				}
				node.type = "Variable";
				node.ID = j;
				node.position=[1,j+1];
			});
		});
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
		$("<div class='pg_dialog_backdrop'></div>").appendTo($("body"));
		var diag_el = $("<div class='pg_dialog'></div>")
		.append(content).appendTo("body");
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
