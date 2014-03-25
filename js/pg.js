pg = {
	body: undefined,
	init: function() {
		if($("body").length==0) {
			var frame= $("frame");
			if(frame.length>0) {
				for (var i in frame) {
					var body_cand = $($(frame)[0].contentDocument).find("body");
					if(body_cand.length>0) pg.body= body_cand[0];
				}
			} else {
				console.log("cant find body");
				return;
			}
		} else {
			pg.body = $("body")[0];
		}

		if($("#pg").length>0) {
			$("#pg").remove();
			pg.inspector.off();
			return;
		}
		$("#pg").remove();
		$("<div id='pg'></div>").appendTo(pg.body);
		// this.new_script("untitled "+makeid());
		this.load_script("_latest");

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
	toggle_visibility: function() {
		$("#pg").toggle();
	},
	execute: function() {
		pg.execute_script(pg.panel.nodes);
		pg.panel.redraw();
	},
	new_script: function(title) {
		pg.save_script(title);
		pg.load_script(title);
	},
	save_script : function(title, program) {
		try {
			var old_data = localStorage["prgr"];
			if (old_data =="undefined" || old_data == "[object Object]" || old_data == "[]") old_data="{}";
			programs = pg.parse(old_data);
		} catch(e) {
			programs = {};
		}	
		var p={};
		var triggerNode = pg.Node.create({type:'trigger', P:pg.planner.get_prototype({type:"trigger"}), position:[1,0]});
		var currentPageNode = pg.Node.create({type:'loadPage', P:pg.planner.get_prototype({type:"loadPage"}), position:[1,1]});
		var defaultNodes = [triggerNode, currentPageNode];
		if(program) {
			p.nodes = typeof program.nodes !== 'undefined' ? program.nodes : defaultNodes;
			p.timestamp = Date.now();
			p.active = typeof program.active !== 'undefined' ? program.active : true;
			p.domain = typeof program.domain !== 'undefined' ? program.domain : [document.URL];
		} else {
			p.nodes = defaultNodes;
			p.timestamp = Date.now();
			p.active = true;
			p.domain = [document.URL];
		}
		programs[title] = p;
		new_data = pg.serialize(programs);
		localStorage.setItem("prgr",new_data);
		return programs;
	},
	load_script : function(title) {
		var programs = pg.load_all_scripts();
		if(!programs || _.keys(programs).length==0) {
			pg.new_script("first script");
			return;
		}
		if(title=="_latest") {
			var sortedPrograms = _.without(_.sortBy(_.pairs(programs), function(title_program) {
				return title_program[1].timestamp;
			}),false, undefined);
			var latest = sortedPrograms[sortedPrograms.length-1]; 
			if(!latest) {   
				pg.new_script("Rothko-"+makeid());
				return false;
			}
			pg.panel.init(latest[0], latest[1].nodes);
		} else if(programs[title]) {
			pg.panel.init(title, programs[title].nodes);
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
	serialize: function(programs) {
		_.each(programs, function(program) {
			_.each(program.nodes, function(node, index) {
				node.V = [];
				node.selected=false;
			});
		});
		return JSON.stringify(programs);
	},
	parse: function(data) {
		try {
			var programs = JSON.parse(data);
			return programs;
		} catch(e) {
			return {};
		}
		
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
	cleanStorage: function() {
		localStorage["prgr"]="{}";
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
		$(diag_el).css({
			'bottom': "100px",
			'left': "100px"
		});
		$(diag_el).find(".button_close").click(pg.close_dialog);
	},
	close_dialog : function() {
		$(".pg_dialog").remove();
		$(".pg_dialog_backdrop").remove();
	}
};






// pg.backup_page = $(pg.body).clone().get(0);


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

